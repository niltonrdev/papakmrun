import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";
import { isPlanilhaStudent } from "@/lib/health/parq";

export async function POST(_request, context) {
  const { id: studentId } = await context.params;
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

  const { profile: me, error: meErr } = await fetchProfileForUser(supabase, user.id);
  if (meErr) {
    return NextResponse.json({ error: meErr.message }, { status: 500 });
  }
  if (!profileCapabilities(me).isStaff) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data: student, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, role, plan_status, parq_submitted_at, health_approved_at, display_name")
    .eq("id", studentId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }
  if (!isPlanilhaStudent(student)) {
    return NextResponse.json({ error: "Aluno não é da planilha." }, { status: 400 });
  }
  if (!student.parq_submitted_at) {
    return NextResponse.json({ error: "Aluno ainda não preencheu o PAR-Q." }, { status: 400 });
  }
  if (student.health_approved_at) {
    return NextResponse.json({ error: "Saúde já aprovada para este aluno." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      health_approved_at: new Date().toISOString(),
      health_approved_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId)
    .select("id, display_name, health_approved_at, parq_submitted_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
