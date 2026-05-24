import { findBlockBySlugInMock, getServerTodayWorkout } from "@/lib/plans-server";
import {
  findBlockBySlugInWeeksDict,
  loadWeeksDictionary,
  todayBlockFromWeeksDict,
} from "@/lib/plan-catalog";
import { resolveWeeksForUser } from "@/lib/student-plan";

export async function resolveWeeksForSession(supabase) {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("selected_base_plan")
    .eq("id", user.id)
    .maybeSingle();
  const planKey = profile?.selected_base_plan || "sub20";
  const resolved = await resolveWeeksForUser(supabase, user.id, planKey);
  if (resolved.error) return null;
  return resolved.weeks;
}

export async function resolveBlockForAuthenticatedUser(supabase, slug) {
  if (!slug) return null;
  const dict = await resolveWeeksForSession(supabase);
  if (dict) {
    const hit = findBlockBySlugInWeeksDict(dict, slug);
    if (hit) return hit;
  }
  return findBlockBySlugInMock(slug);
}

export async function resolveTodayForUser(supabase, weekNumber) {
  const dict = await resolveWeeksForSession(supabase);
  if (dict) {
    return todayBlockFromWeeksDict(dict, weekNumber);
  }
  return getServerTodayWorkout(weekNumber);
}
