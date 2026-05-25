import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ensureStravaAccess } from "@/lib/strava/token";
import { getRecentActivities, getActivityById, getAthlete } from "@/lib/strava/api";
import {
  activityMapPoints,
  formatDurationFromSeconds,
  formatPacePerKm,
  isDistanceSport,
} from "@/lib/strava/insights";
import { fetchProfileForUser } from "@/lib/profiles/fetch-profile";

async function cacheActivitiesForCommunity(supabase, userId, authorName, activities, rawList) {
  if (!supabase || !userId || !Array.isArray(activities) || activities.length === 0) return;
  const rawById = new Map((rawList || []).map((r) => [String(r?.id ?? ""), r]));

  const rows = activities
    .map((a) => {
      const raw = rawById.get(String(a.stravaId)) || {};
      return {
        user_id: userId,
        source: "strava",
        source_id: a.stravaId != null ? String(a.stravaId) : null,
        name: a.name || "Corrida",
        date_iso: a.dateISO || null,
        start_at: a.startAt || null,
        distance_km: a.distanceKm ?? null,
        moving_time_sec: a.movingTimeSec ?? null,
        pace_per_km: a.pacePerKm ?? null,
        elevation_m: a.elevationM ?? null,
        summary_polyline:
          raw?.map?.summary_polyline ||
          raw?.map?.polyline ||
          null,
        author_name: authorName || null,
      };
    })
    .filter((r) => r.source_id);

  if (rows.length === 0) return;

  try {
    await supabase
      .from("community_activities")
      .upsert(rows, { onConflict: "user_id,source,source_id" });
  } catch (err) {
    console.warn("community_activities upsert failed", err);
  }
}

export async function GET() {
  if (!env.stravaConfigured) {
    return NextResponse.json({ linked: false, activities: [] });
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

  const session = await ensureStravaAccess(supabase, user.id);
  if (!session?.accessToken) {
    return NextResponse.json({ linked: false, activities: [] });
  }

  try {
    const athlete = await getAthlete(session.accessToken);
    let author = `${athlete?.firstname ?? ""} ${athlete?.lastname ?? ""}`.trim();
    if (!author) {
      const { profile } = await fetchProfileForUser(supabase, user.id);
      author =
        profile?.display_name?.trim() ||
        (user.email ? String(user.email).split("@")[0] : "Atleta");
    }

    const raw = await getRecentActivities(session.accessToken, { perPage: 35, page: 1 });
    const list = Array.isArray(raw) ? raw : [];

    const activities = [];
    let detailBudget = 6;

    for (const a of list) {
      if (!isDistanceSport(a)) continue;

      let mapPoints = activityMapPoints(a);
      if (mapPoints.length < 2 && detailBudget > 0 && a?.id) {
        detailBudget -= 1;
        try {
          const full = await getActivityById(session.accessToken, a.id);
          mapPoints = activityMapPoints(full);
        } catch {
          /* ignore */
        }
      }

      const dist = Number(a.distance) || 0;
      const moving = Number(a.moving_time) || 0;
      const dateIso = String(a.start_date_local || a.start_date || "").slice(0, 10);

      activities.push({
        id: `strava-${a.id}`,
        stravaId: a.id,
        name: a.name || "Corrida",
        type: a.type,
        dateISO: dateIso || new Date().toISOString().slice(0, 10),
        startAt: a.start_date_local || a.start_date,
        distanceKm: Math.round((dist / 1000) * 10) / 10,
        movingTimeSec: moving,
        movingTimeLabel: formatDurationFromSeconds(moving),
        pacePerKm: formatPacePerKm(moving, dist),
        elevationM: a.total_elevation_gain != null ? Math.round(a.total_elevation_gain) : null,
        mapPoints,
      });
    }

    await cacheActivitiesForCommunity(supabase, user.id, author, activities, list);

    return NextResponse.json({ linked: true, authorName: author, activities });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Falha ao ler Strava.", linked: true, activities: [] },
      { status: 502 }
    );
  }
}
