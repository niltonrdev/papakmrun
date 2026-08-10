import { getCurrentAthleteSlug } from "@/features/athletes/athletes.storage";

function keyForCurrentAthlete() {
  const slug = getCurrentAthleteSlug();
  return `papakm_checkins_v1:${slug || "default"}`;
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function readAllCheckins() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(keyForCurrentAthlete());
  if (!raw) return [];
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

export function writeAllCheckins(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyForCurrentAthlete(), JSON.stringify(items));
}

export function upsertCheckin(checkin) {
  const all = readAllCheckins();
  const idx = all.findIndex(
    (c) => c.date === checkin.date && c.workoutSlug === checkin.workoutSlug
  );

  const merged = {
    ...((idx >= 0 && all[idx]) || {}),
    ...checkin,
  };

  if (idx >= 0) all[idx] = merged;
  else all.unshift(merged);

  writeAllCheckins(all);
  return merged;
}

export function hasCheckin(date, workoutSlug) {
  const all = readAllCheckins();
  return all.some((c) => c.date === date && c.workoutSlug === workoutSlug);
}

export function getCheckin(date, workoutSlug) {
  const all = readAllCheckins();
  return all.find((c) => c.date === date && c.workoutSlug === workoutSlug) ?? null;
}

export function getCheckinBySlug(workoutSlug) {
  if (!workoutSlug) return null;
  const all = readAllCheckins();
  return all.find((c) => c.workoutSlug === workoutSlug) ?? null;
}

export function removeCheckinsBySlug(workoutSlug) {
  if (!workoutSlug) return [];
  const all = readAllCheckins();
  const next = all.filter((c) => c.workoutSlug !== workoutSlug);
  writeAllCheckins(next);
  return next;
}

export function clearAllCheckins() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyForCurrentAthlete());
}
