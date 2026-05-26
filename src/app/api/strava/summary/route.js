import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { ensureStravaAccess } from "@/lib/strava/token";
import { getAthlete, getAthleteStats, getRecentActivities } from "@/lib/strava/api";
import { cacheStravaActivities } from "@/lib/strava/community-cache";
import { fetchProfileForUser } from "@/lib/profiles/fetch-profile";

function metersToKm(m) {
  if (m == null || Number.isNaN(Number(m))) return null;
  return Math.round((Number(m) / 1000) * 10) / 10;
}

export async function GET() {
  if (!env.stravaConfigured) {
    return NextResponse.json(
      { error: "Strava não configurada.", fallback: true },
      { status: 503 }
    );
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
    return NextResponse.json({ linked: false, message: "Conecte o Strava no perfil." });
  }

  try {
    const athlete = await getAthlete(session.accessToken);
    const stats = await getAthleteStats(session.accessToken, athlete.id);
    const activities = await getRecentActivities(session.accessToken, { perPage: 30 });

    let authorName = `${athlete?.firstname ?? ""} ${athlete?.lastname ?? ""}`.trim();
    if (!authorName) {
      const { profile } = await fetchProfileForUser(supabase, user.id);
      authorName =
        profile?.display_name?.trim() ||
        (user.email ? String(user.email).split("@")[0] : "Atleta");
    }

    try {
      await cacheStravaActivities({
        supabase,
        userId: user.id,
        authorName,
        rawList: Array.isArray(activities) ? activities : [],
      });
    } catch {
      /* feed da comunidade é best-effort */
    }

    const all = stats?.all_run_totals;
    const ytd = stats?.ytd_run_totals;
    const recent = stats?.recent_run_totals;

    const list = Array.isArray(activities)
      ? activities.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          date: a.start_date_local,
          distanceKm: metersToKm(a.distance),
          movingTimeSec: a.moving_time,
        }))
      : [];

    console.log(
      "[Strava API] resumo carregado:",
      JSON.stringify(
        {
          athleteId: athlete?.id,
          athleteName: `${athlete?.firstname ?? ""} ${athlete?.lastname ?? ""}`.trim(),
          totals: {
            allRunKm: metersToKm(all?.distance),
            ytdRunKm: metersToKm(ytd?.distance),
            recentRunKm: metersToKm(recent?.distance),
          },
          recentActivitiesSample: list.slice(0, 3),
        },
        null,
        2
      )
    );

    return NextResponse.json({
      linked: true,
      athlete: {
        id: athlete.id,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        city: athlete.city,
        country: athlete.country,
      },
      totals: {
        allRunKm: metersToKm(all?.distance),
        allRunSessions: all?.count ?? null,
        ytdRunKm: metersToKm(ytd?.distance),
        recentRunKm: metersToKm(recent?.distance),
      },
      recentActivities: list,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Falha ao ler Strava.", linked: true },
      { status: 502 }
    );
  }
}
