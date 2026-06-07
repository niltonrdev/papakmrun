const KEY = "papakm_announcement_active_v1";
const DISMISS_KEY = "papakm_announcement_dismissed_id_v1";

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

export function readDismissedAnnouncementId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DISMISS_KEY);
}

export function writeDismissedAnnouncementId(id) {
  if (typeof window === "undefined") return;
  if (id == null || id === "") window.localStorage.removeItem(DISMISS_KEY);
  else window.localStorage.setItem(DISMISS_KEY, String(id));
}
