import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan } from "@/features/plans/plans.service";
import {
  getBlockSegments,
  getWorkoutDisplayLabel,
  sortBlocksByWorkoutOrder,
} from "@/features/plans/workout-blocks";

function isChecked(slug) {
  return readAllCheckins().some((c) => c.workoutSlug === slug);
}

/** Próximo treino da semana ativa sem check-in (Treino 1 → 2 → 3…). */
export function getSuggestedWorkout() {
  const week = getWeekPlan(readActiveWeekNumber());
  const blocks = sortBlocksByWorkoutOrder(week?.blocks ?? []);
  if (!blocks.length) return null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block?.slug || isChecked(block.slug)) continue;
    return {
      ...block,
      workoutIndex: i,
      workoutLabel: getWorkoutDisplayLabel(block, i),
      segments: getBlockSegments(block),
    };
  }
  return null;
}

export function getSuggestedWorkoutCheckin() {
  const w = getSuggestedWorkout();
  if (!w) return null;
  return readAllCheckins().find((c) => c.workoutSlug === w.slug) ?? null;
}
