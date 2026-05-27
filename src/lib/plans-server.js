import { MOCK_PLAN } from "@/features/plans/mockWeek";

export function getServerWeekPlan(weekNumber) {
  const wn = String(weekNumber ?? 1);
  const plan = MOCK_PLAN;
  return plan[wn] || plan["1"] || Object.values(plan)[0];
}

export function getServerTodayWorkout(weekNumber) {
  const week = getServerWeekPlan(weekNumber);
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

export function findBlockBySlugInMock(slug) {
  if (!slug) return null;
  for (const wk of Object.keys(MOCK_PLAN).sort((a, b) => Number(a) - Number(b))) {
    const b = MOCK_PLAN[wk]?.blocks?.find((x) => x.slug === slug);
    if (b) return { weekKey: wk, block: b };
  }
  return null;
}
