const KEY = "papakm_pain_feedback_v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function readAllPainFeedback() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

export function writeAllPainFeedback(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addPainFeedback(entry) {
  const all = readAllPainFeedback();
  all.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...entry,
  });
  writeAllPainFeedback(all);
}

export function countUnreadPain() {
  return readAllPainFeedback().filter((p) => !p.read).length;
}

export function markAllPainRead() {
  const all = readAllPainFeedback().map((p) => ({ ...p, read: true }));
  writeAllPainFeedback(all);
}
