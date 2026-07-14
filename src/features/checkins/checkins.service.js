import { hasCheckin, upsertCheckin, getCheckin, readAllCheckins } from "./checkins.storage";
import { getSuggestedWorkout, getSuggestedWorkoutCheckin } from "@/features/plans/workout-suggestion";
import { getPlanMetaFromSync } from "@/features/session/backend-sync";

export function formatISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isCheckinFromCurrentPlan(checkin) {
  const planUpdatedAt = getPlanMetaFromSync()?.updatedAt;
  if (!planUpdatedAt || !checkin?.createdAt) return true;
  const planTs = Date.parse(planUpdatedAt);
  const checkinTs = Date.parse(checkin.createdAt);
  if (!Number.isFinite(planTs) || !Number.isFinite(checkinTs)) return true;
  // Margem de 2s para upserts quase simultâneos ao salvar a planilha.
  return checkinTs + 2000 >= planTs;
}

function hasCheckinForSlug(workoutSlug) {
  return readAllCheckins().some(
    (c) => c.workoutSlug === workoutSlug && isCheckinFromCurrentPlan(c)
  );
}

export function isWorkoutCheckedToday(workoutSlug) {
  const w = getSuggestedWorkout();
  if (!w || w.slug !== workoutSlug) return false;
  return hasCheckinForSlug(workoutSlug);
}

export function isWorkoutCheckedForBlock(block) {
  if (!block?.slug) return false;
  return hasCheckinForSlug(block.slug);
}

export async function saveTodayCheckin({ workoutSlug, effort, note }) {
  return saveWorkoutCheckin({ workoutSlug, effort, note });
}

export async function saveWorkoutCheckin({
  workoutSlug,
  effort,
  note,
  workoutTitle,
  planKm,
  checkinDate,
}) {
  const date =
    typeof checkinDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(checkinDate)
      ? checkinDate
      : formatISODate(new Date());
  const local = upsertCheckin({
    date,
    workoutSlug,
    effort: Number(effort),
    note: note?.trim() ?? "",
    createdAt: new Date().toISOString(),
    workoutTitle: workoutTitle?.trim?.() ?? "",
    planKm: planKm != null && Number.isFinite(Number(planKm)) ? Number(planKm) : null,
  });

  try {
    const payload = {
      workoutSlug,
      effort: Number(effort),
      notes: note?.trim() ?? "",
      checkinDate: date,
    };
    if (workoutTitle?.trim()) payload.workoutTitle = workoutTitle.trim();
    if (planKm != null && Number.isFinite(Number(planKm))) payload.planKm = Number(planKm);
    await fetch("/api/checkins", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* offline / sem Supabase */
  }

  return local;
}

export function isWorkoutChecked(date, workoutSlug) {
  return hasCheckin(date, workoutSlug);
}

export function getTodayCheckin() {
  const hit = getSuggestedWorkoutCheckin();
  if (hit) return hit;
  const w = getSuggestedWorkout();
  if (!w) return null;
  const date = formatISODate(new Date());
  return getCheckin(date, w.slug);
}
