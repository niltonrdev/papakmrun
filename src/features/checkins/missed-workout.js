import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getPlanMetaFromSync } from "@/features/session/backend-sync";

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

function isCheckinFromCurrentPlan(checkin) {
  const planUpdatedAt = getPlanMetaFromSync()?.updatedAt;
  if (!planUpdatedAt || !checkin?.createdAt) return true;
  const planTs = Date.parse(planUpdatedAt);
  const checkinTs = Date.parse(checkin.createdAt);
  if (!Number.isFinite(planTs) || !Number.isFinite(checkinTs)) return true;
  return checkinTs + 2000 >= planTs;
}

export function hasCheckinForSlug(workoutSlug, checkinSlugs) {
  if (!workoutSlug) return false;
  if (checkinSlugs instanceof Set) return checkinSlugs.has(workoutSlug);
  if (Array.isArray(checkinSlugs)) return checkinSlugs.includes(workoutSlug);
  return readAllCheckins().some(
    (c) => c.workoutSlug === workoutSlug && isCheckinFromCurrentPlan(c)
  );
}

/** Treino agendado já passou e o aluno não fez check-in. */
export function isWorkoutMissed(block, checkinSlugs) {
  if (!block?.slug) return false;
  if (!isWorkoutDatePast(block.workoutDateISO)) return false;
  return !hasCheckinForSlug(block.slug, checkinSlugs);
}
