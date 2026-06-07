import { NextResponse } from "next/server";
import { buildWorkoutFitFromBlock } from "@/lib/fit";
import { createClient } from "@/lib/supabase/server";
import { resolveBlockForAuthenticatedUser, resolveTodayForUser } from "@/lib/plan-resolve";
import { loadStudentPlanRow, studentPlanPayload } from "@/lib/student-plan";
import { ZONES as DEFAULT_ZONES } from "@/features/plans/mockWeek";

async function resolveZonesForUser(supabase) {
  if (!supabase) return DEFAULT_ZONES;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return DEFAULT_ZONES;
  const { row } = await loadStudentPlanRow(supabase, user.id);
  const custom = studentPlanPayload(row);
  return custom?.zones && typeof custom.zones === "object" ? custom.zones : DEFAULT_ZONES;
}

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");
  const today = searchParams.get("today") === "1" || searchParams.get("today") === "true";
  const week = searchParams.get("week") || "1";

  const supabase = await createClient();
  let block = null;
  if (slug) {
    const hit = await resolveBlockForAuthenticatedUser(supabase, slug);
    block = hit?.block ?? null;
  } else if (today) {
    block = await resolveTodayForUser(supabase, week);
  }

  if (!block) {
    return NextResponse.json(
      { error: "Treino não encontrado. Use ?slug= ou ?today=1&week=N." },
      { status: 404 }
    );
  }

  const fit = buildWorkoutFitFromBlock(block, await resolveZonesForUser(supabase));
  const fname = `papakm-${block.slug || "treino"}.fit`;

  return new NextResponse(fit, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}

