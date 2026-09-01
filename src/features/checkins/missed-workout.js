import { readAllCheckins } from "@/features/checkins/checkins.storage";
import {
  todayISO,
  isWorkoutDatePast,
  checkinAppliesToBlock,
} from "@/features/checkins/checkin-match";

export { todayISO, isWorkoutDatePast };

export function hasCheckinForSlug(workoutSlug, checkinSlugs) {
  if (!workoutSlug) return false;
  if (checkinSlugs instanceof Set) return checkinSlugs.has(workoutSlug);
  if (Array.isArray(checkinSlugs)) {
    if (!checkinSlugs.length) return false;
    if (typeof checkinSlugs[0] === "string") return checkinSlugs.includes(workoutSlug);
    return checkinSlugs.some((c) => checkinAppliesToBlock({ slug: workoutSlug }, c));
  }
  return readAllCheckins().some((c) => checkinAppliesToBlock({ slug: workoutSlug }, c));
}

export function hasCheckinForBlock(block, checkinSlugs) {
  if (!block?.slug) return false;
  if (Array.isArray(checkinSlugs) && checkinSlugs.length && typeof checkinSlugs[0] !== "string") {
    return checkinSlugs.some((c) => checkinAppliesToBlock(block, c));
  }
  if (checkinSlugs == null) {
    return readAllCheckins().some((c) => checkinAppliesToBlock(block, c));
  }
  return hasCheckinForSlug(block.slug, checkinSlugs);
}

/** Treino agendado já passou e o aluno não fez check-in. */
export function isWorkoutMissed(block, checkinSlugs) {
  if (!block?.slug) return false;
  if (!isWorkoutDatePast(block.workoutDateISO)) return false;
  return !hasCheckinForBlock(block, checkinSlugs);
}
