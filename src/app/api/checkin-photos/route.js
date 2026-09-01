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
  const limit = Math.min(Number(searchParams.get("limit") || 30), 100);

  const { data, error } = await supabase
    .from("checkins")
    .select("workout_slug, checkin_date, effort, notes, author_name, workout_title, photo_url, created_at")
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
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
      athleteName: r.author_name ?? "Atleta",
      workoutTitle: r.workout_title ?? null,
      photoUrl: r.photo_url,
      createdAt: r.created_at,
    })),
  });
}
