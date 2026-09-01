import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";
import { csvToPlanWeeks, decodeCsvTextFromBuffer } from "@/lib/plan-excel";
import { defaultPlanStartMonday } from "@/lib/plan-calendar";

export async function POST(request, context) {
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

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file.text !== "function") {
    return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const text = decodeCsvTextFromBuffer(buffer);
  const weeks = csvToPlanWeeks(text);
  if (!Object.keys(weeks).length) {
    return NextResponse.json({ error: "Planilha vazia ou formato inválido." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("student_plans")
    .select("plan_start_date")
    .eq("user_id", studentId)
    .maybeSingle();

  const row = {
    user_id: studentId,
    weeks,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
    plan_start_date: existing?.plan_start_date || defaultPlanStartMonday(),
  };

  const { error } = await supabase
    .from("student_plans")
    .upsert(row, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("checkins").delete().eq("user_id", studentId);

  return NextResponse.json({ ok: true, weeks });
}
