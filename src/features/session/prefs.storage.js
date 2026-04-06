const ACTIVE_WEEK_KEY = "papakm_active_week_v1";

export function readActiveWeekNumber() {
  if (typeof window === "undefined") return "1";
  const v = window.localStorage.getItem(ACTIVE_WEEK_KEY);
  return v && String(v).trim() ? String(v) : "1";
}

export function writeActiveWeekNumber(weekNumber) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_WEEK_KEY, String(weekNumber));
}
