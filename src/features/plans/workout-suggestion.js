import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getAllWeekNumbers } from "@/features/plans/plans.service";
import {
  getBlockSegments,
  getWorkoutDisplayLabel,
  sortBlocksByWorkoutOrder,
} from "@/features/plans/workout-blocks";
import { getPlanMetaFromSync } from "@/features/session/backend-sync";

function isCheckinFromCurrentPlan(checkin) {
  const planUpdatedAt = getPlanMetaFromSync()?.updatedAt;
  if (!planUpdatedAt || !checkin?.createdAt) return true;
  const planTs = Date.parse(planUpdatedAt);
  const checkinTs = Date.parse(checkin.createdAt);
  if (!Number.isFinite(planTs) || !Number.isFinite(checkinTs)) return true;
  return checkinTs + 2000 >= planTs;
}

function isChecked(slug) {
  return readAllCheckins().some(
    (c) => c.workoutSlug === slug && isCheckinFromCurrentPlan(c)
  );
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
  return (
    readAllCheckins().find(
      (c) => c.workoutSlug === w.slug && isCheckinFromCurrentPlan(c)
    ) ?? null
  );
}
