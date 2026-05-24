import { loadWeeksDictionary } from "@/lib/plan-catalog";

export async function loadStudentPlanRow(supabase, userId) {
  if (!supabase || !userId) return { row: null, error: null };
  const { data, error } = await supabase
    .from("student_plans")
    .select(
      "user_id, source_plan_key, weeks, zones, test_distance, test_time, v_ref, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  return { row: data, error };
}

export function hasCustomWeeks(row) {
  return row?.weeks && typeof row.weeks === "object" && Object.keys(row.weeks).length > 0;
}

export async function resolveWeeksForUser(supabase, userId, planKey) {
  const { row, error } = await loadStudentPlanRow(supabase, userId);
  if (error) return { weeks: null, source: "error", error, studentPlan: row };
  if (hasCustomWeeks(row)) {
    return { weeks: row.weeks, source: "student", error: null, studentPlan: row };
  }
  const weeks = await loadWeeksDictionary(supabase, planKey);
  return { weeks, source: "template", error: null, studentPlan: row };
}

export function studentPlanPayload(row) {
  if (!row) return null;
  return {
    weeks: row.weeks ?? {},
    zones: row.zones ?? null,
    testDistance: row.test_distance ?? null,
    testTime: row.test_time ?? null,
    vRef: row.v_ref ?? null,
    sourcePlanKey: row.source_plan_key ?? null,
    updatedAt: row.updated_at ?? null,
  };
}
