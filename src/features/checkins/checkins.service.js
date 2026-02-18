import { getTodayWorkout } from "@/features/plans/plans.service";
import { getCheckin, hasCheckin, upsertCheckin } from "./checkins.storage";

export function formatISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayCheckin() {
  const w = getTodayWorkout();
  if (!w) return null;
  const date = formatISODate(new Date());
  return getCheckin(date, w.slug);
}

export function isWorkoutCheckedToday(workoutSlug) {
  const date = formatISODate(new Date());
  return hasCheckin(date, workoutSlug);
}

export function saveTodayCheckin({ workoutSlug, effort, note }) {
  const date = formatISODate(new Date());
  return upsertCheckin({
    date,
    workoutSlug,
    effort, // 1..5
    note: note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  });
}
