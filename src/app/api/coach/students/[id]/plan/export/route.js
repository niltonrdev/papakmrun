import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";
import { loadStudentPlanRow } from "@/lib/student-plan";
import { loadWeeksDictionary } from "@/lib/plan-catalog";
import { planWeeksToCsv } from "@/lib/plan-excel";
import { defaultPlanStartMonday } from "@/lib/plan-calendar";

export async function GET(_request, context) {
  const { id: studentId } = await context.params;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const { profile, error: profileErr } = await fetchProfileForUser(supabase, user.id);
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  if (!profileCapabilities(profile).isStaff) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data: student } = await supabase
    .from("profiles")
    .select("athlete_slug, selected_base_plan")
    .eq("id", studentId)
    .maybeSingle();

  const { row } = await loadStudentPlanRow(supabase, studentId);
  let weeks = row?.weeks;
  if (!weeks || !Object.keys(weeks).length) {
    weeks = await loadWeeksDictionary(
      supabase,
      student?.selected_base_plan || "sub20"
    );
  }

  const planStart =
    row?.plan_start_date || defaultPlanStartMonday();
  const csv = planWeeksToCsv(weeks ?? {}, planStart);
  const slug = student?.athlete_slug || studentId;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="planilha-${slug}.csv"`,
    },
  });
}
