import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ensureStravaAccess } from "@/lib/strava/token";
import { getRecentActivities } from "@/lib/strava/api";
import {
  buildWeeklyRunKm,
  extractPersonalRecords,
  buildPredictionsFromPRs,
  formatPacePerKm,
  isDistanceSport,
} from "@/lib/strava/insights";

async function fetchRunActivities(accessToken, maxPages = 4) {
  const merged = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await getRecentActivities(accessToken, { perPage: 50, page });
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const a of batch) {
      if (isDistanceSport(a) && a?.distance > 0) merged.push(a);
    }
    if (batch.length < 50) break;
  }
  return merged;
}

export async function GET() {
  if (!env.stravaConfigured) {
    return NextResponse.json({ linked: false });
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
    return NextResponse.json({ linked: false });
  }

  try {
    const activities = await fetchRunActivities(session.accessToken, 4);
    const weekly = buildWeeklyRunKm(activities, 12);
    const personalRecords = extractPersonalRecords(activities, 730);
    const predictions = buildPredictionsFromPRs(personalRecords, activities);

    let avgPaceSecPerKm = null;
    const recent = activities.slice(0, 20);
    const paces = recent
      .map((a) => {
        const d = Number(a.distance);
        const t = Number(a.moving_time);
        if (!d || !t) return null;
        return t / (d / 1000);
      })
      .filter(Boolean);
    if (paces.length) {
      avgPaceSecPerKm = paces.reduce((s, x) => s + x, 0) / paces.length;
    }

    const avgPaceLabel =
      avgPaceSecPerKm != null
        ? formatPacePerKm(avgPaceSecPerKm, 1000)
        : null;

    return NextResponse.json({
      linked: true,
      weeklyKm: weekly,
      avgPaceRecentRuns: avgPaceLabel,
      personalRecords,
      predictions,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Falha ao montar insights.", linked: true },
      { status: 502 }
    );
  }
}
