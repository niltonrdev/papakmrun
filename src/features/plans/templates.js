const MS_DAY = 86400000;

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setTime(d.getTime() + days * MS_DAY);
  return d.toISOString().slice(0, 10);
}

export function weekDatesForTemplateWeek(weekNum) {
  const w = weekNum - 1;
  const terca = addDays("2026-03-03", w * 7);
  return {
    ter: terca,
    qui: addDays(terca, 2),
    sab: addDays(terca, 4),
  };
}

function block(weekNum, kind, overrides = {}) {
  const d = weekDatesForTemplateWeek(weekNum);
  const map = {
    terca: {
      dayLabel: "Terça",
      slug: `s${weekNum}-terca`,
      title: "Ritmo",
      zoneKey: "z2",
      description: "Aquecimento (mobilidade articular) + 1 km. 10' acima do pace alvo.",
      workoutDateISO: d.ter,
      km: 6,
    },
    quinta: {
      dayLabel: "Quinta",
      slug: `s${weekNum}-quinta`,
      title: "Intervalado",
      zoneKey: "z3",
      description: "Aquecimento + 1 km. Bloco principal conforme orientação do professor.",
      workoutDateISO: d.qui,
      km: 8,
    },
    sabado: {
      dayLabel: "Sábado",
      slug: `s${weekNum}-sabado`,
      title: "Longo",
      zoneKey: "z1",
      description: "Ritmo constante. Pode variar entre Z1 e Z2.",
      workoutDateISO: d.sab,
      km: 12,
    },
  };
  return { ...map[kind], ...overrides };
}

/** Base 8 semanas — progressão leve de volume */
export function buildBase8Plan() {
  const plan = {};
  const progression = [
    { kmT: 6, kmQ: 8, kmS: 12 },
    { kmT: 7, kmQ: 10, kmS: 14 },
    { kmT: 6, kmQ: 9, kmS: 13 },
    { kmT: 7, kmQ: 10, kmS: 15 },
    { kmT: 8, kmQ: 11, kmS: 16 },
    { kmT: 7, kmQ: 10, kmS: 14 },
    { kmT: 6, kmQ: 8, kmS: 12 },
    { kmT: 5, kmQ: 6, kmS: 10 },
  ];
  for (let w = 1; w <= 8; w++) {
    const p = progression[w - 1];
    plan[String(w)] = {
      id: `week-${w}`,
      title: `Semana ${w}`,
      phase: w <= 4 ? "Base" : w <= 6 ? "Desenvolvimento" : "Deload",
      blocks: [
        block(w, "terca", { km: p.kmT }),
        block(w, "quinta", { km: p.kmQ }),
        block(w, "sabado", { km: p.kmS }),
      ],
    };
  }
  return plan;
}

export function buildBase12Plan() {
  const base = buildBase8Plan();
  const plan = { ...base };
  const extra = [
    { kmT: 8, kmQ: 12, kmS: 18, phase: "Pré-competitiva" },
    { kmT: 7, kmQ: 10, kmS: 16, phase: "Pré-competitiva" },
    { kmT: 6, kmQ: 8, kmS: 14, phase: "Pré-competitiva" },
    { kmT: 5, kmQ: 6, kmS: 10, phase: "Afinamento" },
  ];
  for (let i = 0; i < 4; i++) {
    const w = 9 + i;
    const p = extra[i];
    plan[String(w)] = {
      id: `week-${w}`,
      title: `Semana ${w}`,
      phase: p.phase,
      blocks: [
        block(w, "terca", { km: p.kmT }),
        block(w, "quinta", {
          km: p.kmQ,
          zoneKey: i >= 2 ? "z4" : "z3",
          title: i >= 2 ? "Limiar" : "Intervalado",
          description:
            i >= 2
              ? "Trotes longos + blocos em ritmo de limiar."
              : "Bloco principal conforme orientação do professor.",
        }),
        block(w, "sabado", { km: p.kmS }),
      ],
    };
  }
  return plan;
}

export function buildPeak16Plan() {
  const twelve = buildBase12Plan();
  const plan = { ...twelve };
  for (let w = 13; w <= 16; w++) {
    const d = weekDatesForTemplateWeek(w);
    plan[String(w)] = {
      id: `week-${w}`,
      title: `Semana ${w}`,
      phase: w === 16 ? "Competição" : "Pico",
      blocks: [
        {
          dayLabel: "Terça",
          slug: `s${w}-terca`,
          km: w === 16 ? 4 : 6,
          zoneKey: "z3",
          title: "Ritmo",
          description: w === 16 ? "Ativação leve." : "Ritmo moderado + strides.",
          workoutDateISO: d.ter,
        },
        {
          dayLabel: "Quinta",
          slug: `s${w}-quinta`,
          km: w === 16 ? 3 : 7,
          zoneKey: w >= 14 ? "z5" : "z4",
          title: w === 16 ? "Estimulação" : "Velocidade",
          description: w === 16 ? "Trote + passadas curtas." : "Blocos curtos em alta intensidade.",
          workoutDateISO: d.qui,
        },
        {
          dayLabel: "Sábado",
          slug: `s${w}-sabado`,
          km: w === 16 ? 8 : 12 + (w - 13) * 2,
          zoneKey: w === 16 ? "z2" : "z1",
          title: "Longo / Prova",
          description: w === 16 ? "Ritmo confortável ou prova alvo." : "Volume com folga para absorção.",
          workoutDateISO: d.sab,
        },
      ],
    };
  }
  return plan;
}

export function buildMaintenancePlan() {
  const plan = {};
  for (let w = 1; w <= 4; w++) {
    plan[String(w)] = {
      id: `week-m${w}`,
      title: `Manutenção ${w}`,
      phase: "Manutenção",
      blocks: [
        block(w, "terca", { km: 5, zoneKey: "z2", title: "Leve" }),
        block(w, "quinta", { km: 6, zoneKey: "z2", title: "Estabilidade" }),
        block(w, "sabado", { km: 10, zoneKey: "z1", title: "Longo fácil" }),
      ],
    };
  }
  return plan;
}

export const TEMPLATE_META = {
  base8: { id: "base8", label: "8 Semanas - Base", build: buildBase8Plan },
  base12: { id: "base12", label: "12 Semanas - Intermediário", build: buildBase12Plan },
  peak16: { id: "peak16", label: "16 Semanas - Performance", build: buildPeak16Plan },
  maintenance: { id: "maintenance", label: "Manutenção", build: buildMaintenancePlan },
};

export function buildTemplatePlan(templateId) {
  const meta = TEMPLATE_META[templateId];
  if (!meta) return null;
  return meta.build();
}
