const KEY = "papakm_library_snippets_v1";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function readLibraryItems() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return [];
  const data = safeParse(raw, []);
  return Array.isArray(data) ? data : [];
}

export function writeLibraryItems(items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addLibraryItem({ title, description, zoneKey = "z2", defaultKm = 8 }) {
  const items = readLibraryItems();
  items.unshift({
    id: `lib-${Date.now()}`,
    title: String(title || "Treino").trim(),
    description: String(description || "").trim(),
    zoneKey,
    defaultKm: Number(defaultKm) || 8,
    createdAt: new Date().toISOString(),
  });
  writeLibraryItems(items);
}

export function removeLibraryItem(id) {
  writeLibraryItems(readLibraryItems().filter((x) => x.id !== id));
}
