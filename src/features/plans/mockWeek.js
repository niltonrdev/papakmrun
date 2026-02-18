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
    },
    {
      dayLabel: "Quinta",
      slug: "quinta",
      km: 8,
      zoneKey: "z3",
      title: "Intervalado",
      description:
        "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo. 5x400m + 2km (Z1) + 5x400m + 2km.",
    },
    {
      dayLabel: "Sábado",
      slug: "sabado",
      km: 12,
      zoneKey: "z1",
      title: "Longo",
      description:
        "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo. Pode variar entre Z1 e Z2.",
    },
  ],
};
