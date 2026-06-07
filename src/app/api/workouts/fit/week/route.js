import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { buildWorkoutFitFromBlock } from "@/lib/fit";
import { loadWeeksDictionary, weekFromWeeksDict } from "@/lib/plan-catalog";
import { loadStudentPlanRow, resolveWeeksForUser, studentPlanPayload } from "@/lib/student-plan";
import { ZONES as DEFAULT_ZONES } from "@/features/plans/mockWeek";

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  let activeWeek = searchParams.get("week") || "1";
  let planKey = "sub20";
  let userId = null;

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
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

  let dict;
  if (supabase && userId) {
    const resolved = await resolveWeeksForUser(supabase, userId, planKey);
    dict = resolved.weeks ?? {};
  } else {
    dict = await loadWeeksDictionary(supabase, planKey);
  }
  const week = weekFromWeeksDict(dict, activeWeek);
  const blocks = week?.blocks ?? [];

  if (!blocks.length) {
    return NextResponse.json({ error: "Semana sem treinos para exportar." }, { status: 404 });
  }

  let zones = DEFAULT_ZONES;
  if (supabase && userId) {
    const { row } = await loadStudentPlanRow(supabase, userId);
    const custom = studentPlanPayload(row);
    if (custom?.zones) zones = custom.zones;
  }

  const zip = new JSZip();
  for (const block of blocks) {
    const fit = buildWorkoutFitFromBlock(block, zones);
    const fname = `papakm-${block.slug || "treino"}.fit`;
    zip.file(fname, fit);
  }

  const out = await zip.generateAsync({ type: "uint8array" });
  const zipName = `papakm-semana-${activeWeek}.zip`;

  return new NextResponse(out, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipName}"`,
    },
  });
}

