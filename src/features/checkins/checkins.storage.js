const KEY = "papakm_checkins_v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function readAllCheckins() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

export function writeAllCheckins(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function upsertCheckin(checkin) {
  const all = readAllCheckins();
  const idx = all.findIndex(
    (c) => c.date === checkin.date && c.workoutSlug === checkin.workoutSlug
  );

  if (idx >= 0) all[idx] = checkin;
  else all.unshift(checkin);

  writeAllCheckins(all);
  return checkin;
}

export function hasCheckin(date, workoutSlug) {
  const all = readAllCheckins();
  return all.some((c) => c.date === date && c.workoutSlug === workoutSlug);
}

export function getCheckin(date, workoutSlug) {
  const all = readAllCheckins();
  return all.find((c) => c.date === date && c.workoutSlug === workoutSlug) ?? null;
}

export function clearAllCheckins() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
