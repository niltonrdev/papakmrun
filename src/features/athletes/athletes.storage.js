import { ZONES } from "@/features/plans/mockWeek";

const CURRENT_KEY = "papakm_current_athlete_slug_v1";
const STORE_KEY = "papakm_athletes_v1";

const DEFAULT_SLUG = "nilton-rodrigues";

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function defaultAthleteRecord(slug) {
  return {
    slug,
    name: "Nilton Rodrigues",
    goal: "Sub 20min 5km",
    distanciaTeste: 3,
    tempoTeste: "",
    vRef: null,
    zonesRecord: null,
  };
}

export function readAthletesStore() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) return {};
  const data = safeParse(raw, {});
  return data && typeof data === "object" ? data : {};
}

export function writeAthletesStore(store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function getCurrentAthleteSlug() {
  if (typeof window === "undefined") return DEFAULT_SLUG;
  return window.localStorage.getItem(CURRENT_KEY) || DEFAULT_SLUG;
}

export function setCurrentAthleteSlug(slug) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_KEY, slug);
}

export function getAthleteRecord(slug) {
  const store = readAthletesStore();
  if (store[slug]) return { ...defaultAthleteRecord(slug), ...store[slug], slug };
  return defaultAthleteRecord(slug);
}

export function saveAthleteRecord(slug, partial) {
  const store = readAthletesStore();
  const prev = store[slug] || {};
  store[slug] = { ...prev, ...partial, slug };
  writeAthletesStore(store);
}

export function getZonesForAthlete(slug) {
  const rec = getAthleteRecord(slug);
  if (rec.zonesRecord && typeof rec.zonesRecord === "object") {
    const out = {};
    for (const key of Object.keys(rec.zonesRecord)) {
      const z = rec.zonesRecord[key];
      out[key] = {
        key,
        label: z.label,
        paceMin: z.paceMin,
        paceMax: z.paceMax,
      };
    }
    return out;
  }
  return { ...ZONES };
}
