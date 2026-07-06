/** Espaçamento típico na semana: Terça, Quinta, Sábado (offsets a partir da segunda). */
export const WORKOUT_SLOT_OFFSETS = [1, 3, 5, 0, 2, 4, 6];

const LEGACY_DAY_ORDER = {
  segunda: 0,
  terca: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sabado: 5,
  domingo: 6,
};

function normalizeLegacyDayKey(dayLabel) {
  return String(dayLabel || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function legacyDaySortKey(dayLabel) {
  return LEGACY_DAY_ORDER[normalizeLegacyDayKey(dayLabel)] ?? 99;
}

export function getWorkoutNumber(block, index) {
  const n = Number(block?.workoutNumber);
  if (Number.isFinite(n) && n > 0) return n;
  return (index ?? 0) + 1;
}

export function getWorkoutDisplayLabel(block, index) {
  const n = getWorkoutNumber(block, index);
  const label = block?.dayLabel?.trim();
  if (label && /^treino\s+\d+$/i.test(label)) return label;
  return `Treino ${n}`;
}

export function sortBlocksByWorkoutOrder(blocks) {
  return [...(blocks || [])]
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const an = Number(a.block.workoutNumber);
      const bn = Number(b.block.workoutNumber);
      if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
      if (Number.isFinite(an) && !Number.isFinite(bn)) return -1;
      if (!Number.isFinite(an) && Number.isFinite(bn)) return 1;

      const dayDiff =
        legacyDaySortKey(a.block.dayLabel) - legacyDaySortKey(b.block.dayLabel);
      if (dayDiff !== 0) return dayDiff;
      return a.index - b.index;
    })
    .map(({ block }) => block);
}

export function reindexWeekBlocks(blocks) {
  return sortBlocksByWorkoutOrder(blocks || []).map((block, idx) => {
    const n = idx + 1;
    return {
      ...block,
      workoutNumber: n,
      dayLabel: `Treino ${n}`,
    };
  });
}

function cleanSegmentText(value) {
  return String(value || "")
    .trim()
    .replace(/^[.\-–—]+\s*/, "");
}

export function parseDescriptionToSegments(description) {
  const d = String(description || "").trim();
  if (!d) return { warmup: "", mainPart: "", cooldown: "" };

  let remainder = d;
  let cooldown = "";
  const coolMatch = remainder.match(/\b(.*?desaquecimento.*)$/i);
  if (coolMatch) {
    cooldown = cleanSegmentText(coolMatch[1]);
    remainder = remainder.slice(0, coolMatch.index).trim();
  }

  let warmup = "";
  let mainPart = cleanSegmentText(remainder);
  const warmMatch = remainder.match(/^(.+?\baquecimento\b)\s*(.*)$/is);
  if (warmMatch) {
    warmup = cleanSegmentText(warmMatch[1]);
    mainPart = cleanSegmentText(warmMatch[2]) || mainPart;
  } else if (!remainder) {
    mainPart = cleanSegmentText(d);
  }

  if (!warmup && !cooldown && !mainPart) {
    mainPart = cleanSegmentText(d);
  }

  return { warmup, mainPart, cooldown };
}

export function normalizePlanWeek(week) {
  if (!week?.blocks?.length) return week;
  return { ...week, blocks: reindexWeekBlocks(week.blocks) };
}

export function normalizeFullPlan(plan) {
  if (!plan || typeof plan !== "object") return plan;
  const next = {};
  for (const [weekKey, week] of Object.entries(plan)) {
    next[weekKey] = normalizePlanWeek(week);
  }
  return next;
}

export function getBlockSegments(block) {
  const hasStructured =
    block?.warmup?.trim() || block?.mainPart?.trim() || block?.cooldown?.trim();
  if (hasStructured) {
    return {
      warmup: block.warmup?.trim() || "",
      mainPart: block.mainPart?.trim() || block.description?.trim() || "",
      cooldown: block.cooldown?.trim() || "",
    };
  }
  return parseDescriptionToSegments(block?.description || "");
}

export function segmentsToDescription(segments) {
  const parts = [segments.warmup, segments.mainPart, segments.cooldown]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  return parts.join(". ");
}
