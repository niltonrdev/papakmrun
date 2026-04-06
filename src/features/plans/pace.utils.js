/** "MM:SS" or "M:SS" per km -> total seconds for distance km at that pace */
export function paceToSecondsPerKm(paceStr) {
  const s = String(paceStr || "").trim();
  const parts = s.split(":");
  if (parts.length < 2) return 0;
  const min = Number(parts[0]) || 0;
  const sec = Number(parts[1]) || 0;
  return min * 60 + sec;
}

export function formatDurationFromSeconds(totalSec) {
  const s = Math.round(Math.max(0, totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/** Midpoint of paceMin / paceMax ("04:55" style) */
export function estimateTimeForKm(km, paceMin, paceMax) {
  const a = paceToSecondsPerKm(paceMin);
  const b = paceToSecondsPerKm(paceMax);
  if (!a && !b) return "—";
  const mid = a && b ? (a + b) / 2 : a || b;
  return formatDurationFromSeconds(km * mid);
}

export function sumTimesSeconds(timeStrings) {
  let total = 0;
  for (const t of timeStrings) {
    const parts = String(t || "").split(":");
    if (parts.length === 2) {
      total += (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
    } else if (parts.length === 3) {
      total +=
        (Number(parts[0]) || 0) * 3600 +
        (Number(parts[1]) || 0) * 60 +
        (Number(parts[2]) || 0);
    }
  }
  return total;
}
