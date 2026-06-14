const FULL_FIELDS =
  "role, athlete_slug, display_name, active_week, selected_base_plan, plan_status, bio, city, country, avatar_url, banner_url, parq_submitted_at, parq_answers, health_approved_at, health_approved_by";

const CORE_FIELDS =
  "role, athlete_slug, display_name, active_week, selected_base_plan";

function isMissingRpc(error) {
  const code = error?.code;
  const msg = String(error?.message || "").toLowerCase();
  return (
    code === "42883" ||
    code === "PGRST202" ||
    msg.includes("get_my_profile") ||
    msg.includes("could not find the function")
  );
}

export async function fetchProfileForUser(supabase, userId) {
  const rpc = await supabase.rpc("get_my_profile");
  if (!rpc.error && rpc.data && typeof rpc.data === "object") {
    return { profile: rpc.data, error: null };
  }
  if (rpc.error && !isMissingRpc(rpc.error)) {
    return { profile: null, error: rpc.error };
  }

  const full = await supabase.from("profiles").select(FULL_FIELDS).eq("id", userId).maybeSingle();
  if (!full.error) return { profile: full.data, error: null };

  const core = await supabase.from("profiles").select(CORE_FIELDS).eq("id", userId).maybeSingle();
  if (!core.error) return { profile: core.data, error: null };

  return { profile: null, error: core.error || full.error };
}

import { healthStatusFromProfile } from "@/lib/health/parq";

export function profileCapabilities(profile) {
  const role = profile?.role ?? null;
  const isStaff = role === "admin" || role === "coach";
  const health = healthStatusFromProfile(profile);
  return {
    role,
    isStaff,
    hasPlanAccess: role === "plan" || isStaff,
    planPending: profile?.plan_status === "pending",
    needsParq: health.needsParq,
    healthPendingReview: health.pendingReview,
    healthApt: health.apt,
    healthLabel: health.label,
  };
}
