import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser } from "@/lib/profiles/fetch-profile";
import {
  loadStudentPlanRow,
  resolveWeeksForUser,
  studentPlanPayload,
} from "@/lib/student-plan";
import {
  computeCalendarWeek,
  defaultPlanStartMonday,
  formatWeekRangeLabel,
  normalizePlanStartMonday,
} from "@/lib/plan-calendar";

export async function GET() {
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

  const { profile, error: profileErr } = await fetchProfileForUser(supabase, user.id);
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const planKey = profile?.selected_base_plan || "sub20";
  const { weeks, source, error, studentPlan } = await resolveWeeksForUser(
    supabase,
    user.id,
    planKey
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const custom = studentPlanPayload(studentPlan);
  const maxWeeks = Object.keys(weeks || {}).length || 1;
  const planStart = normalizePlanStartMonday(
    custom?.planStartDate ||
      (source === "student" && studentPlan?.plan_start_date) ||
      defaultPlanStartMonday()
  );

  const calendarWeek = computeCalendarWeek(planStart, maxWeeks);
  const storedWeek = profile?.active_week || "1";

  if (String(storedWeek) !== calendarWeek) {
    await supabase
      .from("profiles")
      .update({
        active_week: calendarWeek,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  }

  const weekRanges = {};
  for (let w = 1; w <= maxWeeks; w++) {
    weekRanges[String(w)] = formatWeekRangeLabel(planStart, w);
  }

  const hasPrescribedPlan =
    source === "student" && Object.keys(weeks || {}).length > 0;

  return NextResponse.json({
    planKey,
    activeWeek: calendarWeek,
    planStartDate: planStart,
    weekRanges,
    source,
    hasPrescribedPlan,
    weeks: weeks ?? {},
    zones: custom?.zones ?? null,
    testDistance: custom?.testDistance ?? null,
    testTime: custom?.testTime ?? null,
    vRef: custom?.vRef ?? null,
    updatedAt: custom?.updatedAt ?? null,
  });
}
