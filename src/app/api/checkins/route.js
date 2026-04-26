import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ items: [], reason: "no_supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || 60), 120);

  const { data, error } = await supabase
    .from("checkins")
    .select("workout_slug, checkin_date, effort, notes, created_at, workout_title, plan_km")
    .eq("user_id", user.id)
    .order("checkin_date", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data || []).map((r) => ({
      workoutSlug: r.workout_slug,
      date: r.checkin_date,
      effort: r.effort,
      note: r.notes ?? "",
      createdAt: r.created_at,
      workoutTitle: r.workout_title ?? null,
      planKm: r.plan_km != null ? Number(r.plan_km) : null,
    })),
  });
}

export async function POST(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const workoutSlug = body?.workoutSlug ?? body?.workout_slug;
  if (!workoutSlug || typeof workoutSlug !== "string") {
    return NextResponse.json({ error: "workoutSlug obrigatório." }, { status: 400 });
  }

  const checkinDate = typeof body.checkinDate === "string" ? body.checkinDate : todayISO();
  const effort = body.effort != null ? Number(body.effort) : null;
  const notes = typeof body.notes === "string" ? body.notes : typeof body.note === "string" ? body.note : "";
  const workoutTitle =
    typeof body.workoutTitle === "string"
      ? body.workoutTitle.trim()
      : typeof body.workout_title === "string"
        ? body.workout_title.trim()
        : null;
  const planKmRaw = body.planKm ?? body.plan_km;
  const planKm = planKmRaw != null && Number.isFinite(Number(planKmRaw)) ? Number(planKmRaw) : null;

  const row = {
    user_id: user.id,
    workout_slug: workoutSlug,
    checkin_date: checkinDate,
    effort: Number.isFinite(effort) ? effort : null,
    notes,
    created_at: new Date().toISOString(),
  };
  if (workoutTitle) row.workout_title = workoutTitle;
  if (planKm != null) row.plan_km = planKm;

  const { data, error } = await supabase
    .from("checkins")
    .upsert(row, { onConflict: "user_id,workout_slug,checkin_date" })
    .select("workout_slug, checkin_date, effort, notes, workout_title, plan_km")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    item: {
      workoutSlug: data.workout_slug,
      date: data.checkin_date,
      effort: data.effort,
      note: data.notes ?? "",
      workoutTitle: data.workout_title ?? null,
      planKm: data.plan_km != null ? Number(data.plan_km) : null,
    },
  });
}
