// src/features/feed/feed.service.js
"use client";

import { readAllCheckins, clearAllCheckins } from "@/features/checkins/checkins.storage";
import { MOCK_WEEK, ZONES } from "@/features/plans/mockWeek";
import { FEED_AUTHORS, FEED_PHRASES, pickRandom } from "./feed.mock";

// 1) Index para achar treino (título, km, zona...) a partir do workoutSlug
function buildWorkoutIndex() {
  const map = {};
  for (const w of MOCK_WEEK.blocks) {
    map[w.slug] = w;
  }
  return map;
}

const WORKOUT_BY_SLUG = buildWorkoutIndex();

function formatBR(isoDate) {
  // isoDate: "YYYY-MM-DD"
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function getFeedItems() {
  // 2) lê todos os check-ins do localStorage
  const checkins = readAllCheckins();

  // 3) ordena por data desc (mais recente em cima)
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? 1 : -1));

  // 4) transforma check-in -> item de feed
  return sorted.map((c, idx) => {
    const workout = WORKOUT_BY_SLUG[c.workoutSlug];

    const author = FEED_AUTHORS[idx % FEED_AUTHORS.length];

    const zone = workout?.zoneKey ? ZONES[workout.zoneKey] : null;

    return {
      id: `${c.date}-${c.workoutSlug}`,
      dateISO: c.date,
      dateLabel: `${formatBR(c.date)} • ${workout?.dayLabel ?? ""}`.trim(),
      workoutTitle: workout?.title ?? c.workoutSlug,
      km: workout?.km ?? null,

      zoneKey: workout?.zoneKey ?? null,
      zoneLabel: zone?.label ?? null,
      paceMin: zone?.paceMin ?? null,
      paceMax: zone?.paceMax ?? null,

      effort: c.effort ?? null,
      note: c.note?.trim() ? c.note.trim() : "Sem nota",

      authorName: author.name,
      authorId: author.id,

      phrase: pickRandom(FEED_PHRASES),

      createdAt: c.createdAt ?? null,
    };
  });
}

// botão "Limpar (demo)" no feed
export function clearFeedDemo() {
  clearAllCheckins();
}