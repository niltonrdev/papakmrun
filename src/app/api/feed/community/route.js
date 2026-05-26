import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { decodePolyline, downsamplePoints } from "@/lib/strava/polyline";

const PAGE_LIMIT = 60;
const FEED_DAYS = 7;

function cutoffDateIso(days) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function pointsFromPolyline(encoded) {
  if (!encoded) return null;
  const decoded = decodePolyline(encoded);
  if (!Array.isArray(decoded) || decoded.length < 2) return null;
  return downsamplePoints(decoded, 250);
}

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
  const limit = Math.min(Number(searchParams.get("limit") || PAGE_LIMIT), 150);
  const days = Math.min(
    Math.max(Number(searchParams.get("days") || FEED_DAYS), 1),
    60
  );
  const cutoff = cutoffDateIso(days);

  const [checkinsRes, activitiesRes] = await Promise.all([
    supabase
      .from("checkins")
      .select(
        "workout_slug, checkin_date, effort, notes, workout_title, plan_km, created_at, user_id, author_name"
      )
      .gte("checkin_date", cutoff)
      .order("checkin_date", { ascending: false })
      .limit(limit),
    supabase
      .from("community_activities")
      .select(
        "id, user_id, source, source_id, name, date_iso, start_at, distance_km, moving_time_sec, pace_per_km, elevation_m, summary_polyline, author_name, created_at"
      )
      .gte("date_iso", cutoff)
      .order("date_iso", { ascending: false })
      .limit(limit),
  ]);

  if (checkinsRes.error) {
    return NextResponse.json({ error: checkinsRes.error.message }, { status: 500 });
  }
  if (activitiesRes.error) {
    return NextResponse.json({ error: activitiesRes.error.message }, { status: 500 });
  }

  const userIds = new Set();
  for (const r of checkinsRes.data || []) if (r.user_id) userIds.add(r.user_id);
  for (const r of activitiesRes.data || []) if (r.user_id) userIds.add(r.user_id);

  let profilesById = new Map();
  if (userIds.size > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, display_name, athlete_slug, avatar_url")
      .in("id", Array.from(userIds));
    if (Array.isArray(profs)) {
      profilesById = new Map(profs.map((p) => [p.id, p]));
    }
  }

  function authorFor(userId, fallback) {
    const p = profilesById.get(userId);
    return {
      id: userId,
      name:
        p?.display_name?.trim() ||
        fallback?.trim() ||
        p?.athlete_slug ||
        "Atleta",
      avatarUrl: p?.avatar_url || null,
    };
  }

  const checkins = (checkinsRes.data || []).map((r) => {
    const author = authorFor(r.user_id, r.author_name);
    return {
      kind: "checkin",
      id: `checkin-${r.user_id}-${r.checkin_date}-${r.workout_slug}`,
      dateISO: r.checkin_date,
      createdAt: r.created_at,
      title: r.workout_title?.trim() || "Treino",
      distanceKm: r.plan_km != null ? Number(r.plan_km) : null,
      effort: r.effort ?? null,
      note: r.notes ?? "",
      author,
      mapPoints: null,
      pacePerKm: null,
    };
  });

  const activities = (activitiesRes.data || []).map((r) => {
    const author = authorFor(r.user_id, r.author_name);
    return {
      kind: "strava",
      id: `strava-${r.id}`,
      dateISO: r.date_iso,
      createdAt: r.created_at,
      title: r.name || "Corrida",
      distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
      movingTimeSec: r.moving_time_sec ?? null,
      pacePerKm: r.pace_per_km || null,
      elevationM: r.elevation_m ?? null,
      note: "",
      author,
      mapPoints: pointsFromPolyline(r.summary_polyline),
    };
  });

  const items = [...activities, ...checkins].sort((a, b) => {
    const ka = `${a.dateISO || ""}T${(a.createdAt || "").slice(11, 19) || "00:00:00"}`;
    const kb = `${b.dateISO || ""}T${(b.createdAt || "").slice(11, 19) || "00:00:00"}`;
    return kb.localeCompare(ka);
  });

  return NextResponse.json({ items, days, cutoff });
}
