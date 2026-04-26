import { MOCK_PLAN } from "@/features/plans/mockWeek";

export function getServerWeekPlan(weekNumber) {
  const wn = String(weekNumber ?? 1);
  const plan = MOCK_PLAN;
  return plan[wn] || plan["1"] || Object.values(plan)[0];
}

const DAY_MAP = { 2: "Terça", 4: "Quinta", 6: "Sábado" };

export function getServerTodayWorkout(weekNumber) {
  const day = new Date().getDay();
  const label = DAY_MAP[day];
  if (!label) return null;
  const week = getServerWeekPlan(weekNumber);
  return week?.blocks?.find((b) => b.dayLabel === label) ?? null;
}

export function findBlockBySlugInMock(slug) {
  if (!slug) return null;
  for (const wk of Object.keys(MOCK_PLAN).sort((a, b) => Number(a) - Number(b))) {
    const b = MOCK_PLAN[wk]?.blocks?.find((x) => x.slug === slug);
    if (b) return { weekKey: wk, block: b };
  }
  return null;
}
