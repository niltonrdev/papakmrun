import { readAllCheckins } from "@/features/checkins/checkins.storage";

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWorkoutDatePast(workoutDateISO) {
  if (!workoutDateISO) return false;
  return String(workoutDateISO).slice(0, 10) < todayISO();
}

export function hasCheckinForSlug(workoutSlug, checkinSlugs) {
  if (!workoutSlug) return false;
  if (checkinSlugs instanceof Set) return checkinSlugs.has(workoutSlug);
  if (Array.isArray(checkinSlugs)) return checkinSlugs.includes(workoutSlug);
  return readAllCheckins().some((c) => c.workoutSlug === workoutSlug);
}

/** Treino agendado já passou e o aluno não fez check-in. */
export function isWorkoutMissed(block, checkinSlugs) {
  if (!block?.slug) return false;
  if (!isWorkoutDatePast(block.workoutDateISO)) return false;
  return !hasCheckinForSlug(block.slug, checkinSlugs);
}
