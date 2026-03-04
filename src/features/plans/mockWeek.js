function getDateOfThisWeek(dayLabel) {
  const map = {
    "Terça": 2,
    "Quinta": 4,
    "Sábado": 6,
  };

  const targetDay = map[dayLabel];
  const now = new Date();
  const today = now.getDay();

  const diff = targetDay - today;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export const ZONES = {
  z1: { key: "z1", label: "Z1 - Regenerativo", paceMin: "05:25", paceMax: "05:40" },
  z2: { key: "z2", label: "Z2 - Fácil", paceMin: "04:55", paceMax: "05:10" },
  z3: { key: "z3", label: "Z3 - Moderado", paceMin: "04:35", paceMax: "04:49" },
  z4: { key: "z4", label: "Z4 - Limiar", paceMin: "04:15", paceMax: "04:30" },
  z5: { key: "z5", label: "Z5 - VO2max", paceMin: "03:55", paceMax: "04:10" },
};

export const MOCK_WEEK = {
  id: "week-1",
  title: "Semana 1 — Base",
  blocks: [
    {
      dayLabel: "Terça",
      slug: "terca",
      km: 6,
      zoneKey: "z2",
      title: "Ritmo",
      description:
        "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo.",
      workoutDateISO: getDateOfThisWeek("Terça"),
    },
    {
      dayLabel: "Quinta",
      slug: "quinta",
      km: 8,
      zoneKey: "z3",
      title: "Intervalado",
      description:
        "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo. 5x400m + 2km (Z1) + 5x400m + 2km.",
      workoutDateISO: getDateOfThisWeek("Quinta"),
    },
    {
      dayLabel: "Sábado",
      slug: "sabado",
      km: 12,
      zoneKey: "z1",
      title: "Longo",
      description:
        "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo. Pode variar entre Z1 e Z2.",
      workoutDateISO: getDateOfThisWeek("Sábado"),
    },
  ],
};


export const MOCK_PLAN = {
  "1": {
    id: "week-1",
    title: "Semana 1",
    phase: "Base",
    blocks: [
      { dayLabel: "Terça", slug: "terca-1", km: 6, zoneKey: "z2", title: "Ritmo", description: "Aquecimento + 1 km. 10' acima do pace alvo.", workoutDateISO: "2026-03-03" },
      { dayLabel: "Quinta", slug: "quinta-1", km: 8, zoneKey: "z3", title: "Intervalado", description: "5x400m + 2km (Z1) + 5x400m + 2km.", workoutDateISO: "2026-03-05" },
      { dayLabel: "Sábado", slug: "sabado-1", km: 12, zoneKey: "z1", title: "Longo", description: "Pode variar entre Z1 e Z2.", workoutDateISO: "2026-03-07" },
    ],
  },
  "2": {
    id: "week-2",
    title: "Semana 2",
    phase: "Base",
    blocks: [
      { dayLabel: "Terça", slug: "terca-2", km: 7, zoneKey: "z2", title: "Ritmo", description: "Aquecimento + 2 km. Foco em cadência.", workoutDateISO: "2026-03-10" },
      { dayLabel: "Quinta", slug: "quinta-2", km: 10, zoneKey: "z3", title: "Intervalado", description: "6x800m com 2' de descanso.", workoutDateISO: "2026-03-12" },
      { dayLabel: "Sábado", slug: "sabado-2", km: 14, zoneKey: "z1", title: "Longo", description: "Ritmo constante em Z1.", workoutDateISO: "2026-03-14" },
    ],
  },
  "3": {
    id: "week-3",
    title: "Semana 3",
    phase: "Pré-Competitiva", 
    blocks: [ 
      { dayLabel: "Terça", slug: "terca-1", km: 6, zoneKey: "z2", title: "Ritmo", description: "Aquecimento + 1 km. 10' acima do pace alvo.", workoutDateISO: "2026-03-03" },
      { dayLabel: "Quinta", slug: "quinta-1", km: 8, zoneKey: "z3", title: "Intervalado", description: "5x400m + 2km (Z1) + 5x400m + 2km.", workoutDateISO: "2026-03-05" },
      { dayLabel: "Sábado", slug: "sabado-1", km: 12, zoneKey: "z1", title: "Longo", description: "Pode variar entre Z1 e Z2.", workoutDateISO: "2026-03-07" },
     ]
  },
  "4": {
    id: "week-4",
    title: "Semana 4",
    phase: "Polimento",
    blocks: [ 
      { dayLabel: "Terça", slug: "terca-2", km: 7, zoneKey: "z2", title: "Ritmo", description: "Aquecimento + 2 km. Foco em cadência.", workoutDateISO: "2026-03-10" },
      { dayLabel: "Quinta", slug: "quinta-2", km: 10, zoneKey: "z3", title: "Intervalado", description: "6x800m com 2' de descanso.", workoutDateISO: "2026-03-12" },
      { dayLabel: "Sábado", slug: "sabado-2", km: 14, zoneKey: "z1", title: "Longo", description: "Ritmo constante em Z1.", workoutDateISO: "2026-03-14" },
     ]
  }
};