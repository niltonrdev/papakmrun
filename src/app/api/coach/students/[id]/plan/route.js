import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";
import { loadWeeksDictionary } from "@/lib/plan-catalog";
import {
  loadStudentPlanRow,
  resolveWeeksForUser,
  studentPlanPayload,
} from "@/lib/student-plan";
import { computeCalendarWeek, defaultPlanStartMonday } from "@/lib/plan-calendar";

async function assertStaff(supabase, userId) {
  const { profile, error } = await fetchProfileForUser(supabase, userId);
  if (error) return { ok: false, error: error.message, status: 500 };
  if (!profileCapabilities(profile).isStaff) {
    return { ok: false, error: "Apenas professor/admin.", status: 403 };
  }
  return { ok: true };
}

export async function GET(_request, context) {
  const { id: studentId } = await context.params;
  if (!studentId) {
    return NextResponse.json({ error: "ID do aluno obrigatório." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const staff = await assertStaff(supabase, user.id);
  if (!staff.ok) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const { data: student, error: studentErr } = await supabase
    .from("profiles")
    .select("id, display_name, email, athlete_slug, selected_base_plan, role, plan_status")
    .eq("id", studentId)
    .maybeSingle();

  if (studentErr) {
    return NextResponse.json({ error: studentErr.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }

  const planKey = student.selected_base_plan || "sub20";
  const { row } = await loadStudentPlanRow(supabase, studentId);
  const custom = studentPlanPayload(row);

  if (custom && Object.keys(custom.weeks || {}).length > 0) {
    return NextResponse.json({
      student,
      source: "student",
      planKey,
      weeks: custom.weeks,
      zones: custom.zones,
      testDistance: custom.testDistance,
      testTime: custom.testTime,
      vRef: custom.vRef,
      planStartDate: custom.planStartDate,
      updatedAt: custom.updatedAt,
    });
  }

  const templateWeeks = await loadWeeksDictionary(supabase, planKey);
  return NextResponse.json({
    student,
    source: "template",
    planKey,
    weeks: templateWeeks ?? {},
    zones: custom?.zones ?? null,
    testDistance: custom?.testDistance ?? null,
    testTime: custom?.testTime ?? null,
    vRef: custom?.vRef ?? null,
    planStartDate: custom?.planStartDate ?? null,
    updatedAt: custom?.updatedAt ?? null,
  });
}

export async function PUT(request, context) {
  const { id: studentId } = await context.params;
  if (!studentId) {
    return NextResponse.json({ error: "ID do aluno obrigatório." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const staff = await assertStaff(supabase, user.id);
  if (!staff.ok) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const weeks = body?.weeks;
  if (!weeks || typeof weeks !== "object" || Array.isArray(weeks)) {
    return NextResponse.json({ error: "weeks deve ser um objeto JSON." }, { status: 400 });
  }

  const { row: existing } = await loadStudentPlanRow(supabase, studentId);
  const planStart =
    typeof body?.planStartDate === "string" && body.planStartDate.trim()
      ? body.planStartDate.trim().slice(0, 10)
      : existing?.plan_start_date || defaultPlanStartMonday();

  const row = {
    user_id: studentId,
    weeks,
    zones: body?.zones ?? null,
    test_distance:
      body?.testDistance != null && body.testDistance !== "" ? Number(body.testDistance) : null,
    test_time: typeof body?.testTime === "string" ? body.testTime.trim() || null : null,
    v_ref: body?.vRef != null && body.vRef !== "" ? Number(body.vRef) : null,
    source_plan_key:
      typeof body?.sourcePlanKey === "string" ? body.sourcePlanKey.trim() || null : null,
    plan_start_date: planStart,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const maxWeeks = Object.keys(weeks).length || 1;
  const calendarWeek = computeCalendarWeek(planStart, maxWeeks);
  await supabase
    .from("profiles")
    .update({
      active_week: calendarWeek,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId);

  const { data, error } = await supabase
    .from("student_plans")
    .upsert(row, { onConflict: "user_id" })
    .select(
      "user_id, source_plan_key, weeks, zones, test_distance, test_time, v_ref, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    plan: studentPlanPayload(data),
  });
}
