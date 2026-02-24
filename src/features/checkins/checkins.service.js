import { hasCheckin, upsertCheckin, getCheckin } from "./checkins.storage";
import { getTodayWorkout } from "@/features/plans/plans.service";

export function formatISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    effort: Number(effort),
    note: note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  });
}

export function saveWorkoutCheckin({ date, workoutSlug, effort, note }) {
  // date deve vir como "YYYY-MM-DD"
  return upsertCheckin({
    date,
    workoutSlug,
    effort,
    note,
    createdAt: new Date().toISOString(), // útil pro mural depois
  });
}

export function isWorkoutChecked(date, workoutSlug) {
  return hasCheckin(date, workoutSlug);
} 
export function getTodayCheckin() {
  const w = getTodayWorkout();
  if (!w) return null;
  const date = formatISODate(new Date());
  return getCheckin(date, w.slug);
}
