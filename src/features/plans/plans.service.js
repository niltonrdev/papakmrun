import { MOCK_WEEK, ZONES } from "./mockWeek";

export function getWeekPlan() {
  return MOCK_WEEK;
}

export function getZones() {
  return Object.values(ZONES);
}

export function getZoneByKey(key) {
  return ZONES[key] ?? null;
}

export function getTodayWorkout() {
  // V1: mapeia dia da semana -> treino
  // JS: 0=Dom,1=Seg,2=Ter,3=Qua,4=Qui,5=Sex,6=Sab
  const day = new Date().getDay();
  const map = {
    2: "terca",
    4: "quinta",
    6: "sabado",
  };

  const slug = map[day];
  if (!slug) return null;

  const week = getWeekPlan();
  return week.blocks.find((b) => b.slug === slug) ?? null;
}
