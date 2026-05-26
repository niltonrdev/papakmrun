import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decodePolyline, downsamplePoints } from "@/lib/strava/polyline";

const RECENT_DAYS = 30;
const RECENT_LIMIT = 30;

function isUuid(value) {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

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
  return downsamplePoints(decoded, 200);
}

export async function GET(_request, context) {
  const params = await context.params;
  const id = typeof params?.id === "string" ? params.id : "";

  if (!isUuid(id)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
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

  const rpc = await supabase.rpc("get_public_profile", { target_id: id });
  const profile = Array.isArray(rpc?.data) ? rpc.data[0] : null;
  if (!profile) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const cutoff = cutoffDateIso(RECENT_DAYS);

  const [activitiesRes, checkinsRes, statsRes] = await Promise.all([
    supabase
      .from("community_activities")
      .select(
        "id, user_id, name, date_iso, start_at, distance_km, moving_time_sec, pace_per_km, elevation_m, summary_polyline, created_at"
      )
      .eq("user_id", id)
      .gte("date_iso", cutoff)
      .order("date_iso", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("checkins")
      .select(
        "id, workout_slug, checkin_date, effort, notes, workout_title, plan_km, created_at"
      )
      .eq("user_id", id)
      .gte("checkin_date", cutoff)
      .order("checkin_date", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("community_activities")
      .select("distance_km, moving_time_sec", { count: "exact" })
      .eq("user_id", id)
      .gte("date_iso", cutoff),
  ]);

  const activities = (activitiesRes.data || []).map((r) => ({
    kind: "strava",
    activityKind: "strava",
    activityId: r.id,
    id: `strava-${r.id}`,
    dateISO: r.date_iso,
    createdAt: r.created_at,
    title: r.name || "Corrida",
    distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
    movingTimeSec: r.moving_time_sec ?? null,
    pacePerKm: r.pace_per_km || null,
    elevationM: r.elevation_m ?? null,
    mapPoints: pointsFromPolyline(r.summary_polyline),
  }));

  const checkins = (checkinsRes.data || []).map((r) => ({
    kind: "checkin",
    activityKind: "checkin",
    activityId: r.id,
    id: `checkin-${r.id}`,
    dateISO: r.checkin_date,
    createdAt: r.created_at,
    title: r.workout_title?.trim() || "Treino",
    distanceKm: r.plan_km != null ? Number(r.plan_km) : null,
    effort: r.effort ?? null,
    note: r.notes ?? "",
    mapPoints: null,
  }));

  const items = [...activities, ...checkins].sort((a, b) => {
    const ka = `${a.dateISO || ""}T${(a.createdAt || "").slice(11, 19) || "00:00:00"}`;
    const kb = `${b.dateISO || ""}T${(b.createdAt || "").slice(11, 19) || "00:00:00"}`;
    return kb.localeCompare(ka);
  });

  const rows = statsRes.data || [];
  const totalKm = rows.reduce(
    (acc, r) => acc + (r.distance_km != null ? Number(r.distance_km) : 0),
    0
  );
  const totalMovingSec = rows.reduce(
    (acc, r) => acc + (r.moving_time_sec != null ? Number(r.moving_time_sec) : 0),
    0
  );

  return NextResponse.json({
    profile: {
      id: profile.id,
      displayName: profile.display_name || null,
      athleteSlug: profile.athlete_slug || null,
      avatarUrl: profile.avatar_url || null,
      bannerUrl: profile.banner_url || null,
      bio: profile.bio || "",
      city: profile.city || "",
      country: profile.country || "",
      role: profile.role || null,
      createdAt: profile.created_at || null,
    },
    stats: {
      runs: activities.length,
      checkins: checkins.length,
      kmLast30d: Math.round(totalKm * 10) / 10,
      movingMinutesLast30d: Math.round(totalMovingSec / 60),
    },
    items,
    isSelf: user.id === id,
    cutoff,
  });
}
