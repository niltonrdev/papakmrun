import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { findWorkoutInPlanBySlug, getZoneByKey } from "@/features/plans/plans.service";
import { getWorkoutDisplayLabel } from "@/features/plans/workout-blocks";

export function getActivityFeed() {
  const checkins = readAllCheckins();

  const items = checkins
    .map((c) => {
      const found = findWorkoutInPlanBySlug(c.workoutSlug);
      const w = found?.block;
      const weekBlocks = found?.week?.blocks ?? [];
      const blockIndex = weekBlocks.findIndex((block) => block.slug === c.workoutSlug);
      const zone = w?.zoneKey ? getZoneByKey(w.zoneKey) : null;

      return {
        id: `${c.date}:${c.workoutSlug}`,
        date: c.date,
        createdAt: c.createdAt || null,
        workoutSlug: c.workoutSlug,
        effort: c.effort ?? null,
        note: c.note ?? "",
        dayLabel: w ? getWorkoutDisplayLabel(w, Math.max(blockIndex, 0)) : "Treino",
        title: w?.title ?? c.workoutSlug,
        km: w?.km ?? null,
        zoneKey: w?.zoneKey ?? null,
        zoneLabel: zone?.label ?? null,
        paceMin: zone?.paceMin ?? null,
        paceMax: zone?.paceMax ?? null,
      };
    })
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
      return tb - ta;
    });

  return items;
}

export function formatBR(dateISO) {
  const [y, m, d] = String(dateISO).split("-");
  if (!y || !m || !d) return dateISO;
  return `${d}/${m}/${y}`;
}
