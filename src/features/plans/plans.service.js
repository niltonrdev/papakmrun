import { getMergedPlanForSlug } from "@/features/plans/plan.storage";
import { getCurrentAthleteSlug, getZonesForAthlete } from "@/features/athletes/athletes.storage";
import { readActiveWeekNumber } from "@/features/session/prefs.storage";

export { getMergedPlanForSlug as getMergedPlanForAthleteSlug };

function resolvedPlanForSlug(slug) {
  return getMergedPlanForSlug(slug);
}

function currentSlug() {
  return getCurrentAthleteSlug();
}

export function getWeekPlan(weekNumber) {
  const slug = currentSlug();
  const plan = resolvedPlanForSlug(slug);
  const wn = String(weekNumber ?? readActiveWeekNumber());
  return plan[wn] || plan["1"] || Object.values(plan)[0];
}

export function getWeekPlanForAthlete(slug, weekNumber) {
  const plan = resolvedPlanForSlug(slug);
  const wn = String(weekNumber ?? "1");
  return plan[wn] || plan["1"] || Object.values(plan)[0];
}

export function getAllWeekNumbers() {
  return Object.keys(resolvedPlanForSlug(currentSlug())).sort(
    (a, b) => Number(a) - Number(b)
  );
}

export function getAllWeekNumbersForAthlete(slug) {
  return Object.keys(resolvedPlanForSlug(slug)).sort((a, b) => Number(a) - Number(b));
}

function zonesRecordForSlug(slug) {
  return getZonesForAthlete(slug);
}

export function getZones() {
  return Object.values(zonesRecordForSlug(currentSlug()));
}

export function getZonesForSlug(slug) {
  return Object.values(zonesRecordForSlug(slug));
}

export function getZoneByKey(key) {
  const z = zonesRecordForSlug(currentSlug())[key];
  return z ?? null;
}

export function getZoneByKeyForAthlete(slug, key) {
  return zonesRecordForSlug(slug)[key] ?? null;
}

export function getTodayWorkout() {
  const wn = readActiveWeekNumber();
  const week = getWeekPlan(wn);
  const todayISO = new Date().toISOString().slice(0, 10);
  const byDate = week?.blocks?.find((b) => b.workoutDateISO === todayISO);
  if (byDate) return byDate;
  const day = new Date().getDay();
  const dayMap = {
    0: "Domingo",
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
    6: "Sábado",
  };
  const label = dayMap[day];
  if (!label) return null;
  return week?.blocks?.find((b) => b.dayLabel === label) ?? null;
}

export function findWorkoutInPlanBySlug(workoutSlug, athleteSlug) {
  const slug = athleteSlug ?? currentSlug();
  const plan = resolvedPlanForSlug(slug);
  for (const wk of Object.keys(plan).sort((a, b) => Number(a) - Number(b))) {
    const b = plan[wk]?.blocks?.find((x) => x.slug === workoutSlug);
    if (b) return { weekKey: wk, week: plan[wk], block: b };
  }
  return null;
}

export function getAllPlanWorkouts(athleteSlug) {
  const slug = athleteSlug ?? currentSlug();
  const plan = resolvedPlanForSlug(slug);
  const list = [];
  for (const wk of Object.keys(plan).sort((a, b) => Number(a) - Number(b))) {
    for (const b of plan[wk]?.blocks ?? []) {
      list.push({ ...b, weekKey: wk });
    }
  }
  return list;
}
