import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getAllWeekNumbers } from "@/features/plans/plans.service";
import {
  getBlockSegments,
  getWorkoutDisplayLabel,
  sortBlocksByWorkoutOrder,
} from "@/features/plans/workout-blocks";

function isChecked(slug) {
  return readAllCheckins().some((c) => c.workoutSlug === slug);
}

/** Próximo treino sem check-in, começando pela semana ativa. */
export function getSuggestedWorkout() {
  const activeWeek = String(readActiveWeekNumber());
  const weekNumbers = getAllWeekNumbers().sort((a, b) => Number(a) - Number(b));
  if (!weekNumbers.length) return null;

  const startIdx = weekNumbers.indexOf(activeWeek);
  const ordered =
    startIdx >= 0
      ? [...weekNumbers.slice(startIdx), ...weekNumbers.slice(0, startIdx)]
      : weekNumbers;

  for (const weekKey of ordered) {
    const week = getWeekPlan(weekKey);
    const blocks = sortBlocksByWorkoutOrder(week?.blocks ?? []);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block?.slug || isChecked(block.slug)) continue;
      return {
        ...block,
        weekKey,
        workoutIndex: i,
        workoutLabel: getWorkoutDisplayLabel(block, i),
        segments: getBlockSegments(block),
      };
    }
  }
  return null;
}

export function getSuggestedWorkoutCheckin() {
  const w = getSuggestedWorkout();
  if (!w) return null;
  return readAllCheckins().find((c) => c.workoutSlug === w.slug) ?? null;
}
