import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";

function findWorkoutBySlug(week, slug) {
  return week?.blocks?.find((b) => b.slug === slug) || null;
}

export function getActivityFeed() {
  // localStorage -> só funciona no client, mas quem chama isso será page/client
  const checkins = readAllCheckins(); // [{date, workoutSlug, effort, note, createdAt}, ...]
  const week = getWeekPlan(); // MOCK_WEEK

  const items = checkins
    .map((c) => {
      const w = findWorkoutBySlug(week, c.workoutSlug);
      const zone = w?.zoneKey ? getZoneByKey(w.zoneKey) : null;

      return {
        id: `${c.date}:${c.workoutSlug}`,
        date: c.date, // YYYY-MM-DD (data do treino)
        createdAt: c.createdAt || null,
        workoutSlug: c.workoutSlug,

        // dados do check-in
        effort: c.effort ?? null,
        note: c.note ?? "",

        // dados do treino (mockWeek)
        dayLabel: w?.dayLabel ?? "Treino",
        title: w?.title ?? c.workoutSlug,
        km: w?.km ?? null,
        zoneKey: w?.zoneKey ?? null,
        zoneLabel: zone?.label ?? null,
        paceMin: zone?.paceMin ?? null,
        paceMax: zone?.paceMax ?? null,
      };
    })
    // mais recentes primeiro (createdAt se existir; fallback: date)
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date).getTime();
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date).getTime();
      return tb - ta;
    });

  return items;
}

export function formatBR(dateISO) {
  // dateISO = "YYYY-MM-DD"
  // evita Intl em server; isso vai rodar no client
  const [y, m, d] = String(dateISO).split("-");
  if (!y || !m || !d) return dateISO;
  return `${d}/${m}/${y}`;
}