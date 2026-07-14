import { addDaysISO, renumberPlanWeeks } from "@/lib/plan-calendar";
import {
  WORKOUT_SLOT_OFFSETS,
  assignBlockSlugsForWeek,
  reindexWeekBlocks,
  segmentsToDescription,
  sortBlocksByWorkoutOrder,
  syncPlanBlockSlugs,
} from "@/features/plans/workout-blocks";

export const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"];

/** Mantido para importação de planilhas legadas por dia da semana. */
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

export function computeWorkoutDateByIndex(planStartMonday, weekKey, workoutIndex) {
  if (!planStartMonday) return null;
  const weekNumber = Math.max(1, Number(weekKey) || 1);
  const offset = WORKOUT_SLOT_OFFSETS[workoutIndex] ?? workoutIndex * 2 + 1;
  return addDaysISO(planStartMonday, (weekNumber - 1) * 7 + offset);
}

export function computeWorkoutDateISO(planStartMonday, weekKey, dayLabel, workoutIndex = 0) {
  const byDay = dayOffsetFromLabel(dayLabel);
  if (byDay != null && planStartMonday) {
    const weekNumber = Math.max(1, Number(weekKey) || 1);
    return addDaysISO(planStartMonday, (weekNumber - 1) * 7 + byDay);
  }
  return computeWorkoutDateByIndex(planStartMonday, weekKey, workoutIndex);
}

function makeBlock(weekKey, workoutNumber, planStartDate, preset = {}) {
  const idx = workoutNumber - 1;
  return {
    dayLabel: `Treino ${workoutNumber}`,
    workoutNumber,
    slug: preset.slug || `s${weekKey}-treino-${workoutNumber}`,
    km: preset.km ?? 6,
    zoneKey: preset.zoneKey ?? "z2",
    title: preset.title ?? "Treino",
    warmup: preset.warmup ?? "",
    mainPart: preset.mainPart ?? "",
    cooldown: preset.cooldown ?? "",
    description:
      preset.description ??
      segmentsToDescription({
        warmup: preset.warmup ?? "",
        mainPart: preset.mainPart ?? "Bloco principal conforme orientação.",
        cooldown: preset.cooldown ?? "",
      }),
    workoutDateISO: computeWorkoutDateByIndex(planStartDate, weekKey, idx),
  };
}

export function blankWeekBlocks(weekKey, planStartDate) {
  return [
    makeBlock(weekKey, 1, planStartDate, {
      title: "Rodagem",
      km: 6,
      zoneKey: "z2",
      warmup: "2 km (Z2)",
      mainPart: "Bloco principal em ritmo de referência.",
      cooldown: "1 km (Z1)",
    }),
    makeBlock(weekKey, 2, planStartDate, {
      title: "Intervalado",
      km: 8,
      zoneKey: "z3",
      warmup: "2 km (Z2)",
      mainPart: "Série principal conforme orientação do professor.",
      cooldown: "1 km (Z1)",
    }),
    makeBlock(weekKey, 3, planStartDate, {
      title: "Longo",
      km: 12,
      zoneKey: "z1",
      warmup: "2 km (Z2)",
      mainPart: "Ritmo fácil a moderado.",
      cooldown: "1 km (Z1)",
    }),
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
  return sortBlocksByWorkoutOrder(blocks);
}

export function syncBlockDerivedFields(block, planStartDate, weekKey, workoutIndex) {
  const next = { ...block };
  const segments = {
    warmup: next.warmup ?? "",
    mainPart: next.mainPart ?? "",
    cooldown: next.cooldown ?? "",
  };
  next.description = segmentsToDescription(segments);
  next.workoutDateISO =
    next.workoutDateISO ||
    computeWorkoutDateByIndex(planStartDate, weekKey, workoutIndex);
  return next;
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
  w.blocks[blockIdx] = syncBlockDerivedFields(block, planStartDate, weekKey, blockIdx);
  w.blocks = assignBlockSlugsForWeek(weekKey, w.blocks, planStartDate);
  return next;
}

export function addBlockToPlan(prev, weekKey, planStartDate) {
  if (!prev?.[weekKey]) return prev;
  const next = clonePlan(prev);
  const w = next[weekKey];
  const n = (w.blocks?.length || 0) + 1;
  const newBlock = makeBlock(weekKey, n, planStartDate, {
    title: "Treino",
    mainPart: "Ajuste o conteúdo conforme o aluno.",
  });
  w.blocks = assignBlockSlugsForWeek(weekKey, [...(w.blocks || []), newBlock], planStartDate);
  return next;
}

export function removeBlockFromPlan(prev, weekKey, blockIdx, planStartDate = null) {
  if (!prev?.[weekKey]) return prev;
  const next = clonePlan(prev);
  const w = next[weekKey];
  w.blocks = assignBlockSlugsForWeek(
    weekKey,
    (w.blocks || []).filter((_, idx) => idx !== blockIdx),
    planStartDate
  );
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
  return syncPlanBlockSlugs(next, planStartDate);
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
      next[wk] = {
        ...weekData,
        title: `Semana ${wk}`,
      };
    }
  });
  return syncPlanBlockSlugs(next, planStartDate);
}

export function removeWeekFromPlan(prev, weekKey, planStartDate = null) {
  if (!prev || Object.keys(prev).length <= 1) return prev;
  const next = clonePlan(prev);
  delete next[weekKey];
  return syncPlanBlockSlugs(renumberPlanWeeks(next), planStartDate);
}

export function slugifyTemplateKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
