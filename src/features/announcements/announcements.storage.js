const KEY = "papakm_announcement_active_v1";

export function readActiveAnnouncement() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(KEY) || "";
}

export function writeActiveAnnouncement(text) {
  if (typeof window === "undefined") return;
  const t = String(text || "").trim();
  if (!t) window.localStorage.removeItem(KEY);
  else window.localStorage.setItem(KEY, t);
}
