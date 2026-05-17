import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isCoachRole(role) {
  return role === "admin" || role === "coach";
}

export async function POST(_request, { params }) {
  const studentId = params?.id;
  if (!studentId) {
    return NextResponse.json({ error: "ID do aluno obrigatório." }, { status: 400 });
  }

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

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!isCoachRole(me?.role)) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data: student, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, role, plan_status, display_name, email")
    .eq("id", studentId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }
  if (student.plan_status !== "pending") {
    return NextResponse.json(
      { error: "Este aluno não está aguardando aprovação de planilha." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: "plan",
      plan_status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .select("id, role, plan_status, display_name, email, athlete_slug")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
