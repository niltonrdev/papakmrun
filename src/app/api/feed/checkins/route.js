import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET(request) {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [], reason: "legacy" });
  }

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
  const limit = Math.min(Number(searchParams.get("limit") || 80), 150);

  const { data, error } = await supabase
    .from("checkins")
    .select(
      "workout_slug, checkin_date, effort, notes, workout_title, plan_km, created_at, user_id, profiles ( display_name, email )"
    )
    .order("checkin_date", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((r) => {
    const prof = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const name =
      prof?.display_name?.trim() ||
      (prof?.email ? String(prof.email).split("@")[0] : null) ||
      "Atleta";
    return {
      id: `${r.user_id}-${r.checkin_date}-${r.workout_slug}`,
      workoutSlug: r.workout_slug,
      date: r.checkin_date,
      effort: r.effort,
      note: r.notes ?? "",
      workoutTitle: r.workout_title ?? null,
      planKm: r.plan_km != null ? Number(r.plan_km) : null,
      createdAt: r.created_at,
      authorName: name,
      userId: r.user_id,
    };
  });

  return NextResponse.json({ items });
}

