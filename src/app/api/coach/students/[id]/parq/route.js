import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";
import { PARQ_QUESTIONS, isPlanilhaStudent } from "@/lib/health/parq";

export async function GET(_request, context) {
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

  const { data: student, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, email, role, plan_status, parq_submitted_at, parq_answers, health_approved_at, birth_date"
    )
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!student) {
    return NextResponse.json({ error: "Aluno não encontrado." }, { status: 404 });
  }
  if (!isPlanilhaStudent(student)) {
    return NextResponse.json({ error: "Aluno não é da planilha." }, { status: 400 });
  }
  if (!student.parq_submitted_at || !student.parq_answers) {
    return NextResponse.json({ error: "Aluno ainda não enviou o PAR-Q." }, { status: 404 });
  }

  const answers = student.parq_answers?.answers ?? {};
  const items = PARQ_QUESTIONS.map((q, i) => ({
    number: i + 1,
    id: q.id,
    text: q.text,
    answer: answers[q.id] === "yes" ? "Sim" : answers[q.id] === "no" ? "Não" : "—",
    isYes: answers[q.id] === "yes",
  }));

  return NextResponse.json({
    student: {
      id: student.id,
      name:
        student.display_name?.trim() ||
        (student.email ? String(student.email).split("@")[0] : "Aluno"),
      email: student.email ?? "",
      birthDate: student.birth_date ?? null,
    },
    submittedAt: student.parq_submitted_at,
    healthApproved: Boolean(student.health_approved_at),
    form: {
      fullName: student.parq_answers?.fullName ?? null,
      age: student.parq_answers?.age ?? null,
      signature: student.parq_answers?.signature ?? null,
      hasYes: Boolean(student.parq_answers?.hasYes),
      liabilitySigned: Boolean(student.parq_answers?.liabilitySigned),
      liabilitySignature: student.parq_answers?.liabilitySignature ?? null,
    },
    items,
  });
}
