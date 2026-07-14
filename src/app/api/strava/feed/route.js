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
import { cacheStravaActivities } from "@/lib/strava/community-cache";

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

    // Últimos ~14 dias para alimentar o feed (UI usa janela de 7).
    const after = Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60;
    const raw = await getRecentActivities(session.accessToken, {
      perPage: 50,
      page: 1,
      after,
    });
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

    const cacheResult = await cacheStravaActivities({
      supabase,
      userId: user.id,
      authorName: author,
      rawList: list,
      normalizedList: activities,
    });

    return NextResponse.json({
      linked: true,
      authorName: author,
      activities,
      rawCount: list.length,
      cachedCount: cacheResult?.count ?? 0,
      cache: cacheResult,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Falha ao ler Strava.", linked: true, activities: [] },
      { status: 502 }
    );
  }
}
