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

function buildRows({ userId, authorName, rawList, normalizedList }) {
  const list = Array.isArray(rawList) ? rawList : [];
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
  return rows;
}

async function upsertRow(supabase, row) {
  const { data: existing, error: selectErr } = await supabase
    .from("community_activities")
    .select("id")
    .eq("user_id", row.user_id)
    .eq("source", row.source)
    .eq("source_id", row.source_id)
    .maybeSingle();

  if (selectErr) {
    return { ok: false, reason: selectErr.message };
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("community_activities")
      .update(row)
      .eq("id", existing.id);
    if (error) return { ok: false, reason: error.message };
    return { ok: true, mode: "update" };
  }

  const { error } = await supabase.from("community_activities").insert(row);
  if (error) return { ok: false, reason: error.message };
  return { ok: true, mode: "insert" };
}

/**
 * Persiste no Supabase as atividades Strava do user para o feed da comunidade.
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

  const rows = buildRows({ userId, authorName, rawList: list, normalizedList });
  if (rows.length === 0) {
    return {
      ok: false,
      reason: "no_rows",
      rawCount: list.length,
      hint: "Nenhuma atividade Run/Walk/Hike na resposta do Strava.",
    };
  }

  // 1) Tentativa em lote (funciona com UNIQUE em user_id,source,source_id).
  const batch = await supabase
    .from("community_activities")
    .upsert(rows, { onConflict: "user_id,source,source_id" });

  if (!batch.error) {
    return { ok: true, count: rows.length, mode: "batch" };
  }

  console.warn(
    "community_activities batch upsert failed, falling back row-by-row:",
    batch.error.message,
    batch.error.code
  );

  // 2) Fallback: insert/update por linha (funciona mesmo com índice parcial antigo).
  let saved = 0;
  const errors = [];
  for (const row of rows) {
    const result = await upsertRow(supabase, row);
    if (result.ok) saved += 1;
    else errors.push(result.reason);
  }

  if (saved === 0) {
    return {
      ok: false,
      reason: errors[0] || batch.error.message,
      code: batch.error.code,
      attempted: rows.length,
    };
  }

  return {
    ok: true,
    count: saved,
    mode: "row",
    partialErrors: errors.slice(0, 3),
    batchError: batch.error.message,
  };
}
