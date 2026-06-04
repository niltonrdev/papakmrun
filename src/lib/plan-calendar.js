const MS_DAY = 86400000;

/** Segunda-feira da semana que contém a data (ISO YYYY-MM-DD). */
export function mondayOfWeekContaining(isoDate) {
  const d = new Date(`${isoDate}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setTime(d.getTime() + days * MS_DAY);
  return d.toISOString().slice(0, 10);
}

/** Intervalo Seg–Dom da semana N (1-based) a partir da segunda da semana 1. */
export function weekDateRange(planStartMonday, weekNum) {
  const n = Math.max(1, Number(weekNum) || 1);
  const start = addDaysISO(planStartMonday, (n - 1) * 7);
  const end = addDaysISO(start, 6);
  return { start, end };
}

export function formatDateBR(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y.slice(-2)}`;
}

export function formatWeekRangeLabel(planStartMonday, weekNum) {
  const { start, end } = weekDateRange(planStartMonday, weekNum);
  return `${formatDateBR(start)} à ${formatDateBR(end)}`;
}

/**
 * Semana ativa pelo calendário: quantas semanas completas desde o início (mín. 1).
 * @param {string} planStartMonday ISO segunda da semana 1
 * @param {number} maxWeeks última semana do plano
 */
export function computeCalendarWeek(planStartMonday, maxWeeks = 52) {
  if (!planStartMonday) return "1";
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const start = new Date(`${planStartMonday}T12:00:00`);
  const diffDays = Math.floor((today - start) / MS_DAY);
  const weekIndex = Math.floor(diffDays / 7) + 1;
  const capped = Math.max(1, Math.min(weekIndex, maxWeeks || weekIndex));
  return String(capped);
}

export function defaultPlanStartMonday() {
  return mondayOfWeekContaining(new Date().toISOString().slice(0, 10));
}

export function renumberPlanWeeks(plan) {
  if (!plan || typeof plan !== "object") return {};
  const keys = Object.keys(plan).sort((a, b) => Number(a) - Number(b));
  const next = {};
  keys.forEach((oldKey, idx) => {
    const n = String(idx + 1);
    const w = { ...plan[oldKey] };
    w.title = w.title?.replace(/Semana\s+\d+/i, `Semana ${n}`) || `Semana ${n}`;
    if (Array.isArray(w.blocks)) {
      w.blocks = w.blocks.map((b) => ({
        ...b,
        slug: b.slug?.replace(/^s\d+/, `s${n}`) ?? b.slug,
      }));
    }
    next[n] = w;
  });
  return next;
}
