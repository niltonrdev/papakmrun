import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser } from "@/lib/profiles/fetch-profile";
import {
  loadStudentPlanRow,
  resolveWeeksForUser,
  studentPlanPayload,
} from "@/lib/student-plan";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { profile, error: profileErr } = await fetchProfileForUser(supabase, user.id);
  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const planKey = profile?.selected_base_plan || "sub20";
  const activeWeek = profile?.active_week || "1";
  const { weeks, source, error, studentPlan } = await resolveWeeksForUser(
    supabase,
    user.id,
    planKey
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const custom = studentPlanPayload(studentPlan);

  return NextResponse.json({
    planKey,
    activeWeek: String(activeWeek),
    source,
    weeks: weeks ?? {},
    zones: custom?.zones ?? null,
    testDistance: custom?.testDistance ?? null,
    testTime: custom?.testTime ?? null,
    vRef: custom?.vRef ?? null,
  });
}
