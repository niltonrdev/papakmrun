import { isDistanceSport } from "@/lib/strava/insights";

function metersToKm(m) {
  if (m == null || Number.isNaN(Number(m))) return null;
  return Math.round((Number(m) / 1000) * 10) / 10;
}

function paceFromMovingDistance(movingTimeSec, distanceMeters) {
  if (!movingTimeSec || !distanceMeters || distanceMeters <= 0) return null;
  const km = distanceMeters / 1000;
  const secPerKm = movingTimeSec / km;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Persiste no Supabase as atividades Strava do user para o feed da comunidade.
 * Aceita entradas em formato cru (do strava api) ou já normalizadas.
 *
 * - userId, authorName: identificação no banco
 * - rawList: lista crua de activities do Strava (necessária para `summary_polyline`)
 * - normalizedList (opcional): se já houver objetos normalizados, evita refazer mapeamentos
 */
export async function cacheStravaActivities({
  supabase,
  userId,
  authorName,
  rawList,
  normalizedList,
}) {
  if (!supabase || !userId) return { ok: false, reason: "no_supabase_or_user" };

  const list = Array.isArray(rawList) ? rawList : [];
  if (list.length === 0 && (!normalizedList || normalizedList.length === 0)) {
    return { ok: false, reason: "empty" };
  }

  const normalizedById = new Map();
  if (Array.isArray(normalizedList)) {
    for (const n of normalizedList) {
      if (n?.stravaId != null) normalizedById.set(String(n.stravaId), n);
    }
  }

  const rows = [];
  for (const a of list) {
    if (!isDistanceSport(a)) continue;
    if (a?.id == null) continue;

    const norm = normalizedById.get(String(a.id)) || {};
    const distMeters = Number(a.distance) || 0;
    const moving = Number(a.moving_time) || 0;
    const dateIso =
      norm.dateISO ||
      String(a.start_date_local || a.start_date || "").slice(0, 10) ||
      null;

    rows.push({
      user_id: userId,
      source: "strava",
      source_id: String(a.id),
      name: norm.name || a.name || "Corrida",
      date_iso: dateIso,
      start_at: a.start_date_local || a.start_date || null,
      distance_km: norm.distanceKm ?? metersToKm(distMeters),
      moving_time_sec: norm.movingTimeSec ?? moving,
      pace_per_km: norm.pacePerKm || paceFromMovingDistance(moving, distMeters),
      elevation_m:
        norm.elevationM ??
        (a.total_elevation_gain != null ? Math.round(a.total_elevation_gain) : null),
      summary_polyline: a?.map?.summary_polyline || a?.map?.polyline || null,
      author_name: authorName || null,
    });
  }

  if (rows.length === 0) return { ok: false, reason: "no_rows" };

  try {
    const { error } = await supabase
      .from("community_activities")
      .upsert(rows, { onConflict: "user_id,source,source_id" });
    if (error) {
      console.warn("community_activities upsert error:", error.message, error.code);
      return { ok: false, reason: error.message, code: error.code, attempted: rows.length };
    }
    return { ok: true, count: rows.length };
  } catch (err) {
    console.warn("community_activities upsert threw:", err);
    return { ok: false, reason: err?.message || "unknown" };
  }
}
