import { MOCK_PLAN } from "@/features/plans/mockWeek";

/** Plano alternativo (fallback em código quando ainda não há linha no banco). */
export const VOLUME_MOCK_PLAN = {
  "1": {
    id: "vol-week-1",
    title: "Semana 1 — Volume",
    phase: "Base aeróbia",
    blocks: [
      {
        dayLabel: "Terça",
        slug: "vol-s1-terca",
        km: 8,
        zoneKey: "z2",
        title: "Rodagem",
        description: "Ritmo confortável, foco em volume.",
        workoutDateISO: "2026-03-03",
      },
      {
        dayLabel: "Quinta",
        slug: "vol-s1-quinta",
        km: 10,
        zoneKey: "z2",
        title: "Progressivo leve",
        description: "Últimos 3 km um pouco mais rápidos.",
        workoutDateISO: "2026-03-05",
      },
      {
        dayLabel: "Sábado",
        slug: "vol-s1-sabado",
        km: 14,
        zoneKey: "z1",
        title: "Longão",
        description: "Hidratação e cadência constantes.",
        workoutDateISO: "2026-03-07",
      },
    ],
  },
  "2": {
    id: "vol-week-2",
    title: "Semana 2 — Volume",
    phase: "Base aeróbia",
    blocks: [
      {
        dayLabel: "Terça",
        slug: "vol-s2-terca",
        km: 9,
        zoneKey: "z2",
        title: "Rodagem",
        description: "Mesmo esforço, mais minutos.",
        workoutDateISO: "2026-03-10",
      },
      {
        dayLabel: "Quinta",
        slug: "vol-s2-quinta",
        km: 11,
        zoneKey: "z3",
        title: "Fartlek suave",
        description: "30' com surtos curtos de 1'.",
        workoutDateISO: "2026-03-12",
      },
      {
        dayLabel: "Sábado",
        slug: "vol-s2-sabado",
        km: 16,
        zoneKey: "z1",
        title: "Longo",
        description: "Nutrição e pacing estável.",
        workoutDateISO: "2026-03-14",
      },
    ],
  },
};

export const STATIC_TEMPLATE_CATALOG = [
  { plan_key: "sub20", title: "Plano Sub20 (5 km)" },
  { plan_key: "volume", title: "Plano Volume (meia / base)" },
];

export function fallbackWeeksForPlanKey(planKey) {
  const k = String(planKey || "sub20");
  if (k === "volume") return { ...VOLUME_MOCK_PLAN };
  return { ...MOCK_PLAN };
}

export function weekFromWeeksDict(weeksDict, weekNumber) {
  const wn = String(weekNumber ?? "1");
  const plan = weeksDict || MOCK_PLAN;
  return plan[wn] || plan["1"] || Object.values(plan)[0];
}

export function findBlockBySlugInWeeksDict(weeksDict, slug) {
  if (!slug || !weeksDict || typeof weeksDict !== "object") return null;
  for (const wk of Object.keys(weeksDict).sort((a, b) => Number(a) - Number(b))) {
    const b = weeksDict[wk]?.blocks?.find((x) => x.slug === slug);
    if (b) return { weekKey: wk, block: b };
  }
  return null;
}

const DAY_MAP = { 2: "Terça", 4: "Quinta", 6: "Sábado" };

export function todayBlockFromWeeksDict(weeksDict, weekNumber) {
  const day = new Date().getDay();
  const label = DAY_MAP[day];
  if (!label) return null;
  const week = weekFromWeeksDict(weeksDict, weekNumber);
  return week?.blocks?.find((b) => b.dayLabel === label) ?? null;
}

export async function loadWeeksDictionary(supabase, planKey) {
  const key = String(planKey || "sub20").trim() || "sub20";
  if (!supabase) return fallbackWeeksForPlanKey(key);

  const { data, error } = await supabase
    .from("plan_templates")
    .select("weeks")
    .eq("plan_key", key)
    .maybeSingle();

  if (error || !data?.weeks || typeof data.weeks !== "object") {
    return fallbackWeeksForPlanKey(key);
  }

  const w = data.weeks;
  if (!Object.keys(w).length) return fallbackWeeksForPlanKey(key);
  return w;
}
