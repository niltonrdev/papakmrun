import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getAllWeekNumbers } from "@/features/plans/plans.service";
import {
  getBlockSegments,
  getWorkoutDisplayLabel,
  sortBlocksByWorkoutOrder,
} from "@/features/plans/workout-blocks";
import { getPlanMetaFromSync } from "@/features/session/backend-sync";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function enrichBlock(block, weekKey, index) {
  return {
    ...block,
    weekKey,
    workoutIndex: index,
    workoutLabel: getWorkoutDisplayLabel(block, index),
    segments: getBlockSegments(block),
  };
}

function blockDateISO(block) {
  const d = block?.workoutDateISO;
  return typeof d === "string" && d.length >= 10 ? d.slice(0, 10) : null;
}

/**
 * Sugestão do dia:
 * 1) treino de hoje (por data) sem check-in
 * 2) treino atrasado mais antigo sem check-in
 * 3) próximo treino pendente a partir da semana ativa
 */
export function getSuggestedWorkout() {
  const today = todayISO();
  const activeWeek = String(readActiveWeekNumber());
  const weekNumbers = getAllWeekNumbers().sort((a, b) => Number(a) - Number(b));
  if (!weekNumbers.length) return null;

  const startIdx = weekNumbers.indexOf(activeWeek);
  const ordered =
    startIdx >= 0
      ? [...weekNumbers.slice(startIdx), ...weekNumbers.slice(0, startIdx)]
      : weekNumbers;

  let todayHit = null;
  let overdueHit = null;
  let nextHit = null;

  for (const weekKey of ordered) {
    const week = getWeekPlan(weekKey);
    const blocks = sortBlocksByWorkoutOrder(week?.blocks ?? []);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!block?.slug || isChecked(block.slug)) continue;

      const enriched = enrichBlock(block, weekKey, i);
      const date = blockDateISO(block);

      if (date === today) {
        todayHit = enriched;
        break;
      }
      if (date && date < today && !overdueHit) {
        overdueHit = enriched;
      }
      if (!nextHit) nextHit = enriched;
    }
    if (todayHit) break;
  }

  return todayHit || overdueHit || nextHit;
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
