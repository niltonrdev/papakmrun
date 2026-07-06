import { MOCK_PLAN } from "./mockWeek";
import { normalizeFullPlan } from "./workout-blocks";

const KEY = "papakm_plan_by_athlete_v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function readPlanStore() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  const data = safeParse(raw, {});
  return data && typeof data === "object" ? data : {};
}

export function writePlanStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function readAthletePlan(athleteSlug) {
  const store = readPlanStore();
  const plan = store[athleteSlug];
  return plan && typeof plan === "object" ? plan : null;
}

export function writeAthletePlan(athleteSlug, plan) {
  const store = readPlanStore();
  store[athleteSlug] = plan;
  writePlanStore(store);
}

/** Plano salvo localmente; null se nunca sincronizado; {} se sincronizado sem prescrição. */
export function getMergedPlanForSlug(athleteSlug) {
  const stored = readAthletePlan(athleteSlug);
  if (stored !== null) return normalizeFullPlan(stored);
  return normalizeFullPlan({ ...MOCK_PLAN });
}

export function replaceAthletePlan(athleteSlug, fullPlan) {
  writeAthletePlan(athleteSlug, fullPlan);
}
