import { decodePolyline, downsamplePoints } from "@/lib/strava/polyline";

export function isRunActivity(a) {
  const t = a?.type;
  return t === "Run" || t === "Trail Run" || t === "VirtualRun";
}

/** Volume semanal no mapa (inclui trilha / hike). */
export function isDistanceSport(a) {
  const t = a?.type;
  return isRunActivity(a) || t === "Hike" || t === "Walk";
}

export function activityMapPoints(activity) {
  const enc = activity?.map?.summary_polyline;
  if (!enc) return [];
  return downsamplePoints(decodePolyline(enc), 450);
}

export function formatDurationFromSeconds(sec) {
  if (sec == null || sec <= 0) return "—";
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function formatPacePerKm(movingTimeSec, distanceMeters) {
  if (!movingTimeSec || !distanceMeters || distanceMeters <= 0) return "—";
  const km = distanceMeters / 1000;
  const secPerKm = movingTimeSec / km;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function localYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayKeyFromDate(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return localYmd(x);
}

/**
 * Últimas `weekCount` semanas (segunda local), km somados por atividades Run.
 */
export function buildWeeklyRunKm(activities, weekCount = 12) {
  const runs = (activities || []).filter((a) => isDistanceSport(a) && a?.distance > 0);
  const byWeek = new Map();
  for (const a of runs) {
    const k = mondayKeyFromDate(a.start_date_local || a.start_date);
    if (!k) continue;
    const km = Number(a.distance) / 1000;
    byWeek.set(k, (byWeek.get(k) || 0) + km);
  }
  const thisMonday = mondayKeyFromDate(new Date());
  const anchor = thisMonday
    ? new Date(`${thisMonday}T12:00:00`)
    : new Date();
  const weekStarts = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const w = new Date(anchor);
    w.setDate(anchor.getDate() - i * 7);
    const key = mondayKeyFromDate(w);
    if (key) weekStarts.push(key);
  }
  return weekStarts.map((weekStart) => ({
    weekStart,
    km: Math.round((byWeek.get(weekStart) || 0) * 10) / 10,
  }));
}

const PR_BUCKETS = [
  { key: "400 m", minM: 380, maxM: 480 },
  { key: "1 km", minM: 950, maxM: 1100 },
  { key: "5 km", minM: 4800, maxM: 5200 },
  { key: "10 km", minM: 9800, maxM: 10300 },
  { key: "15 km", minM: 14500, maxM: 15500 },
  { key: "21 km", minM: 20500, maxM: 21500 },
  { key: "42 km", minM: 41500, maxM: 44500 },
];

/**
 * Melhores tempos por faixa de distância (heurística sobre corridas no Strava).
 */
export function extractPersonalRecords(activities, maxAgeDays = 365) {
  const cutoff = Date.now() - maxAgeDays * 864e5;
  const runs = (activities || []).filter((a) => {
    if (!isRunActivity(a) || !a?.distance || !a?.moving_time) return false;
    const t = new Date(a.start_date_local || a.start_date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });

  const out = [];
  for (const b of PR_BUCKETS) {
    let best = null;
    for (const a of runs) {
      const d = Number(a.distance);
      if (d < b.minM || d > b.maxM) continue;
      const mt = Number(a.moving_time);
      if (!best || mt < best.moving_time) {
        best = {
          label: b.key,
          moving_time: mt,
          distance: d,
          date: a.start_date_local || a.start_date,
          name: a.name,
        };
      }
    }
    if (best) {
      out.push({
        label: best.label,
        time: formatDurationFromSeconds(best.moving_time),
        pace: formatPacePerKm(best.moving_time, best.distance),
        date: new Date(best.date).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        activityName: best.name,
      });
    }
  }
  return out;
}

/**
 * “Previsões” conservadoras: reutiliza melhores marcas recentes como referência (sem modelo preditivo).
 */
export function buildPredictionsFromPRs(prRecords, activities) {
  const preds = [];
  const findBest = (label, minM, maxM) => {
    const runs = (activities || []).filter(
      (a) =>
        isRunActivity(a) &&
        a?.distance >= minM &&
        a?.distance <= maxM &&
        a?.moving_time > 0
    );
    if (!runs.length) return null;
    runs.sort((a, b) => a.moving_time - b.moving_time);
    const a = runs[0];
    return {
      label,
      time: formatDurationFromSeconds(a.moving_time),
      pace: formatPacePerKm(a.moving_time, a.distance),
      hint: "Referência: melhor corrida nessa distância no Strava",
    };
  }
  const five = findBest("5K", 4800, 5200);
  const ten = findBest("10K", 9800, 10300);
  const hm = findBest("21K", 20500, 21500);
  if (five) preds.push(five);
  if (ten) preds.push(ten);
  if (hm) preds.push(hm);
  if (!preds.length && prRecords?.length) {
    preds.push({
      label: prRecords[0].label,
      time: prRecords[0].time,
      pace: prRecords[0].pace,
      hint: "Referência: melhor marca estimada pelo Strava",
    });
  }
  return preds;
}
