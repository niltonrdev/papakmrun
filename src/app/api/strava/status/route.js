import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ linked: false, reason: "no_supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ linked: false, reason: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("strava_connections")
    .select("strava_athlete_id, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const payload = {
    linked: Boolean(data),
    stravaAthleteId: data?.strava_athlete_id ?? null,
    updatedAt: data?.updated_at ?? null,
  };
  console.log("[Strava API] status:", JSON.stringify(payload, null, 2));

  return NextResponse.json(payload);
}
