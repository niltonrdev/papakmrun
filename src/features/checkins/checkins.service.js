import { hasCheckin, upsertCheckin, getCheckin, readAllCheckins } from "./checkins.storage";
import { getTodayWorkout } from "@/features/plans/plans.service";

export function formatISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasCheckinForSlug(workoutSlug) {
  return readAllCheckins().some((c) => c.workoutSlug === workoutSlug);
}

export function isWorkoutCheckedToday(workoutSlug) {
  const w = getTodayWorkout();
  if (!w || w.slug !== workoutSlug) return false;
  return hasCheckinForSlug(workoutSlug);
}

export function isWorkoutCheckedForBlock(block) {
  if (!block?.slug) return false;
  return hasCheckinForSlug(block.slug);
}

export function saveTodayCheckin({ workoutSlug, effort, note }) {
  const date = formatISODate(new Date());
  return upsertCheckin({
    date,
    workoutSlug,
    effort: Number(effort),
    note: note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  });
}

export function saveWorkoutCheckin({ workoutSlug, effort, note }) {
  const date = formatISODate(new Date());
  return upsertCheckin({
    date,
    workoutSlug,
    effort: Number(effort),
    note: note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  });
}

export function isWorkoutChecked(date, workoutSlug) {
  return hasCheckin(date, workoutSlug);
}

export function getTodayCheckin() {
  const w = getTodayWorkout();
  if (!w) return null;
  const hit = readAllCheckins().find((c) => c.workoutSlug === w.slug);
  if (hit) return hit;
  const date = formatISODate(new Date());
  return getCheckin(date, w.slug);
}
