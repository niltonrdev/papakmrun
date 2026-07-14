import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

async function assertCoach(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin" || profile?.role === "coach";
}

export async function GET(_request, context) {
  const params = await context.params;
  const key = decodeURIComponent(params?.key || "").trim();
  if (!key) {
    return NextResponse.json({ error: "plan_key obrigatório." }, { status: 400 });
  }

  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
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

  const { data, error } = await supabase
    .from("plan_templates")
    .select("plan_key, title, weeks, updated_at")
    .eq("plan_key", key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    planKey: key,
    title: data?.title ?? key,
    weeks: data?.weeks ?? {},
    updatedAt: data?.updated_at ?? null,
  });
}

export async function PUT(request, context) {
  const params = await context.params;
  const key = decodeURIComponent(params?.key || "").trim();
  if (!key) {
    return NextResponse.json({ error: "plan_key obrigatório." }, { status: 400 });
  }

  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
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

  if (!(await assertCoach(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor ou admin." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const weeks = body?.weeks;
  if (!weeks || typeof weeks !== "object" || Array.isArray(weeks)) {
    return NextResponse.json({ error: "weeks deve ser um objeto JSON (semanas)." }, { status: 400 });
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : `Plano ${key}`;

  const row = {
    plan_key: key,
    title,
    weeks,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("plan_templates")
    .upsert(row, { onConflict: "plan_key" })
    .select("plan_key, title, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, plan: data });
}

export async function DELETE(_request, context) {
  const params = await context.params;
  const key = decodeURIComponent(params?.key || "").trim();
  if (!key) {
    return NextResponse.json({ error: "plan_key obrigatório." }, { status: 400 });
  }

  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
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

  if (!(await assertCoach(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor ou admin." }, { status: 403 });
  }

  const [usedByPlans, usedByProfiles] = await Promise.all([
    supabase
      .from("student_plans")
      .select("user_id")
      .eq("source_plan_key", key)
      .limit(20),
    supabase
      .from("profiles")
      .select("id, display_name, athlete_slug")
      .eq("selected_base_plan", key)
      .limit(20),
  ]);

  if (usedByPlans.error) {
    return NextResponse.json({ error: usedByPlans.error.message }, { status: 500 });
  }
  if (usedByProfiles.error) {
    return NextResponse.json({ error: usedByProfiles.error.message }, { status: 500 });
  }

  const planUsers = usedByPlans.data || [];
  const profileUsers = usedByProfiles.data || [];
  if (planUsers.length > 0 || profileUsers.length > 0) {
    const names = profileUsers
      .map((p) => p.display_name || p.athlete_slug || p.id)
      .filter(Boolean);
    return NextResponse.json(
      {
        error:
          "Este template está em uso por um ou mais alunos e não pode ser excluído.",
        inUse: true,
        studentsUsing: names,
        count: Math.max(planUsers.length, profileUsers.length),
      },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("plan_templates").delete().eq("plan_key", key);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: key });
}

