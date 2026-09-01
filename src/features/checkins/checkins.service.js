import {
  hasCheckin,
  upsertCheckin,
  getCheckin,
  getCheckinBySlug,
  removeCheckinsBySlug,
  readAllCheckins,
} from "./checkins.storage";
import { checkinAppliesToBlock } from "@/features/checkins/checkin-match";
import { getSuggestedWorkout, getSuggestedWorkoutCheckin } from "@/features/plans/workout-suggestion";
export function formatISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
export function isWorkoutCheckedToday(workoutSlug) {
  const w = getSuggestedWorkout();
  if (!w || w.slug !== workoutSlug) return false;
  return isWorkoutCheckedForBlock(w);
}
export function isWorkoutCheckedForBlock(block) {
  if (!block?.slug) return false;
  return readAllCheckins().some((c) => checkinAppliesToBlock(block, c));
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
  photoUrl,
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
    photoUrl: photoUrl ?? null,
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
    if (photoUrl) payload.photoUrl = photoUrl;
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
export async function undoWorkoutCheckin({ workoutSlug }) {
  if (!workoutSlug) return false;
  const existing = getCheckinBySlug(workoutSlug);
  removeCheckinsBySlug(workoutSlug);
  try {
    const params = new URLSearchParams({ workoutSlug });
    if (existing?.date) params.set("checkinDate", existing.date);
    await fetch(`/api/checkins?${params.toString()}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    /* offline / sem Supabase */
  }
  return true;
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
