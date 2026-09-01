export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWorkoutDatePast(workoutDateISO, today = todayISO()) {
  if (!workoutDateISO) return false;
  return String(workoutDateISO).slice(0, 10) < today;
}

function isoDate(value) {
  const s = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
}

function checkinSlug(checkin) {
  return String(checkin?.workoutSlug ?? checkin?.workout_slug ?? "");
}

function checkinDate(checkin) {
  return isoDate(checkin?.date ?? checkin?.checkin_date);
}

/**
 * Treino futuro só conta como feito se o check-in for no dia agendado.
 * Assim um template novo (ou data de início no futuro) não herda "FEITO"
 * de check-ins antigos com o mesmo slug (s1-treino-1).
 */
export function checkinAppliesToBlock(block, checkin) {
  if (!block?.slug || !checkin) return false;
  if (checkinSlug(checkin) !== String(block.slug)) return false;

  const workoutDate = isoDate(block.workoutDateISO);
  if (!workoutDate) return true;
  if (workoutDate <= todayISO()) return true;
  return checkinDate(checkin) === workoutDate;
}

export function blockHasCheckin(block, checkins) {
  if (!block?.slug || !Array.isArray(checkins)) return false;
  return checkins.some((c) => checkinAppliesToBlock(block, c));
}

export function activeCheckinSlugsForPlan(weeks, checkins) {
  const slugs = [];
  const seen = new Set();
  for (const week of Object.values(weeks || {})) {
    for (const block of week?.blocks || []) {
      if (!block?.slug || seen.has(block.slug)) continue;
      if (!blockHasCheckin(block, checkins)) continue;
      seen.add(block.slug);
      slugs.push(block.slug);
    }
  }
  return slugs;
}

export function recordsFromCheckinRows(rows) {
  return (rows || [])
    .map((row) => ({
      workoutSlug: row?.workout_slug ?? row?.workoutSlug ?? "",
      date: isoDate(row?.checkin_date ?? row?.date),
    }))
    .filter((row) => row.workoutSlug);
}
