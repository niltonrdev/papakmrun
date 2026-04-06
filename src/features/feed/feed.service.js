"use client";

import { readAllCheckins, clearAllCheckins } from "@/features/checkins/checkins.storage";
import { findWorkoutInPlanBySlug, getZoneByKey } from "@/features/plans/plans.service";
import { FEED_AUTHORS, FEED_PHRASES, pickRandom } from "./feed.mock";

function formatBR(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

export function getFeedItems() {
  const checkins = readAllCheckins();
  const sorted = [...checkins].sort((a, b) => (a.date < b.date ? 1 : -1));

  return sorted.map((c, idx) => {
    const found = findWorkoutInPlanBySlug(c.workoutSlug);
    const workout = found?.block;
    const author = FEED_AUTHORS[idx % FEED_AUTHORS.length];
    const zone = workout?.zoneKey ? getZoneByKey(workout.zoneKey) : null;

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

export function clearFeedDemo() {
  clearAllCheckins();
}
