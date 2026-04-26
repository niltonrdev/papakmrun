import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function isCoach(role) {
  return role === "admin" || role === "coach";
}

async function getSessionUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request) {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [], reason: "legacy" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ items: [], reason: "no_supabase" });
  }

  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!isCoach(profile?.role)) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || 80), 200);
  const { data, error } = await supabase
    .from("pain_feedback")
    .select("id, athlete_name, workout_title, workout_date, pain_note, effort, read, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data || []).map((r) => ({
      id: r.id,
      athleteName: r.athlete_name,
      workoutTitle: r.workout_title,
      date: r.workout_date,
      painNote: r.pain_note,
      effort: r.effort,
      read: r.read,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(request) {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const note = typeof body.painNote === "string" ? body.painNote.trim() : "";
  if (!note) {
    return NextResponse.json({ error: "painNote obrigatório." }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, athlete_slug")
    .eq("id", user.id)
    .maybeSingle();

  const row = {
    user_id: user.id,
    athlete_slug: profile?.athlete_slug ?? null,
    athlete_name: profile?.display_name || user.email?.split("@")[0] || "Aluno",
    workout_slug: body.workoutSlug ?? null,
    workout_title: body.workoutTitle ?? null,
    workout_date: body.date ?? null,
    pain_note: note,
    effort: body.effort != null ? Number(body.effort) : null,
  };

  const { error } = await supabase.from("pain_feedback").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!isCoach(profile?.role)) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { error } = await supabase
    .from("pain_feedback")
    .update({ read: true })
    .eq("read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

