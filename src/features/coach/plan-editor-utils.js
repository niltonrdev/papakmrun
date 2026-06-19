import { addDaysISO, renumberPlanWeeks } from "@/lib/plan-calendar";

export const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"];

export const WEEKDAY_OPTIONS = [
  { label: "Segunda", offset: 0 },
  { label: "Terça", offset: 1 },
  { label: "Quarta", offset: 2 },
  { label: "Quinta", offset: 3 },
  { label: "Sexta", offset: 4 },
  { label: "Sábado", offset: 5 },
  { label: "Domingo", offset: 6 },
];

export function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan));
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function dayOffsetFromLabel(dayLabel) {
  const normalized = normalizeText(dayLabel);
  const opt = WEEKDAY_OPTIONS.find((x) => normalizeText(x.label) === normalized);
  return opt ? opt.offset : null;
}

export function computeWorkoutDateISO(planStartMonday, weekKey, dayLabel) {
  const offset = dayOffsetFromLabel(dayLabel);
  if (offset == null || !planStartMonday) return null;
  const weekNumber = Math.max(1, Number(weekKey) || 1);
  return addDaysISO(planStartMonday, (weekNumber - 1) * 7 + offset);
}

export function blankWeekBlocks(weekKey, planStartDate) {
  return [
    {
      dayLabel: "Terça",
      slug: `s${weekKey}-terca`,
      km: 6,
      zoneKey: "z2",
      title: "Ritmo",
      description: "Aquecimento + bloco principal.",
      workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Terça"),
    },
    {
      dayLabel: "Quinta",
      slug: `s${weekKey}-quinta`,
      km: 8,
      zoneKey: "z3",
      title: "Intervalado",
      description: "Bloco principal conforme orientação.",
      workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Quinta"),
    },
    {
      dayLabel: "Sábado",
      slug: `s${weekKey}-sabado`,
      km: 12,
      zoneKey: "z1",
      title: "Longo",
      description: "Ritmo fácil a moderado.",
      workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Sábado"),
    },
  ];
}

export function createBlankPlan(planStartDate = null) {
  return {
    "1": {
      id: "week-1",
      title: "Semana 1",
      phase: "Base",
      blocks: blankWeekBlocks("1", planStartDate),
    },
  };
}

export function sortBlocksByDay(blocks) {
  return [...(blocks || [])].sort((a, b) => {
    const ao = dayOffsetFromLabel(a.dayLabel);
    const bo = dayOffsetFromLabel(b.dayLabel);
    return (ao == null ? 999 : ao) - (bo == null ? 999 : bo);
  });
}

export function updateBlockInPlan(prev, weekKey, blockIdx, field, value, planStartDate) {
  if (!prev) return prev;
  const next = clonePlan(prev);
  const w = next[weekKey];
  if (!w?.blocks?.[blockIdx]) return prev;
  const block = { ...w.blocks[blockIdx] };
  if (field === "km") {
    block.km = Number(value) || 0;
  } else {
    block[field] = value;
  }
  if (field === "dayLabel") {
    const iso = computeWorkoutDateISO(planStartDate, weekKey, value);
    if (iso) block.workoutDateISO = iso;
  }
  w.blocks[blockIdx] = block;
  w.blocks = sortBlocksByDay(w.blocks);
  return next;
}

export function addBlockToPlan(prev, weekKey, planStartDate) {
  if (!prev?.[weekKey]) return prev;
  const next = clonePlan(prev);
  const w = next[weekKey];
  const used = new Set((w.blocks || []).map((b) => dayOffsetFromLabel(b.dayLabel)));
  const picked = WEEKDAY_OPTIONS.find((x) => !used.has(x.offset)) ?? WEEKDAY_OPTIONS[0];
  const blockIdx = (w.blocks?.length || 0) + 1;
  const workoutDateISO = computeWorkoutDateISO(planStartDate, weekKey, picked.label);
  const newBlock = {
    dayLabel: picked.label,
    slug: `s${weekKey}-custom-${Date.now()}-${blockIdx}`,
    km: 6,
    zoneKey: "z2",
    title: "Treino",
    description: "Ajuste o conteúdo conforme o aluno.",
    workoutDateISO: workoutDateISO ?? null,
  };
  w.blocks = sortBlocksByDay([...(w.blocks || []), newBlock]);
  return next;
}

export function removeBlockFromPlan(prev, weekKey, blockIdx) {
  if (!prev?.[weekKey]) return prev;
  const next = clonePlan(prev);
  const w = next[weekKey];
  w.blocks = (w.blocks || []).filter((_, idx) => idx !== blockIdx);
  return next;
}

export function addWeekToPlan(prev, planStartDate) {
  const base = prev && Object.keys(prev).length ? prev : {};
  const nums = Object.keys(base).map(Number);
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  const next = clonePlan(base);
  next[String(n)] = {
    id: `week-${n}`,
    title: `Semana ${n}`,
    phase: "Personalizado",
    blocks: blankWeekBlocks(String(n), planStartDate),
  };
  return next;
}

export function insertWeekAfterInPlan(prev, afterWeekKey, planStartDate) {
  if (!prev) return prev;
  const keys = Object.keys(prev).sort((a, b) => Number(a) - Number(b));
  const ordered = [];
  for (const k of keys) {
    ordered.push(prev[k]);
    if (k === String(afterWeekKey)) {
      ordered.push(null);
    }
  }
  const next = {};
  ordered.forEach((weekData, idx) => {
    const wk = String(idx + 1);
    if (weekData === null) {
      next[wk] = {
        id: `week-${wk}`,
        title: `Semana ${wk}`,
        phase: "Personalizado",
        blocks: blankWeekBlocks(wk, planStartDate),
      };
    } else {
      next[wk] = { ...weekData, title: `Semana ${wk}` };
    }
  });
  return next;
}

export function removeWeekFromPlan(prev, weekKey) {
  if (!prev || Object.keys(prev).length <= 1) return prev;
  const next = clonePlan(prev);
  delete next[weekKey];
  return renumberPlanWeeks(next);
}

export function slugifyTemplateKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
