import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerWeekPlan, getServerTodayWorkout } from "@/lib/plans-server";
import { loadWeeksDictionary, todayBlockFromWeeksDict, weekFromWeeksDict } from "@/lib/plan-catalog";

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const week = searchParams.get("week") || "1";

  let activeWeek = week;
  let planKey = "sub20";
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_week, selected_base_plan")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.selected_base_plan) {
        planKey = String(profile.selected_base_plan);
      }
      if (profile?.active_week && !searchParams.get("week")) {
        activeWeek = profile.active_week;
      }
    }
  }

  let plan;
  let today;
  if (supabase) {
    const dict = await loadWeeksDictionary(supabase, planKey);
    plan = weekFromWeeksDict(dict, activeWeek);
    today = todayBlockFromWeeksDict(dict, activeWeek);
  } else {
    plan = getServerWeekPlan(activeWeek);
    today = getServerTodayWorkout(activeWeek);
  }

  return NextResponse.json({
    weekKey: String(activeWeek),
    week: plan,
    today,
    planKey,
  });
}
