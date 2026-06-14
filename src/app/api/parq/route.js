import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser } from "@/lib/profiles/fetch-profile";
import { PARQ_QUESTIONS, healthStatusFromProfile, isPlanilhaStudent } from "@/lib/health/parq";

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

  const { profile, error } = await fetchProfileForUser(supabase, user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const health = healthStatusFromProfile(profile);

  return NextResponse.json({
    questions: PARQ_QUESTIONS,
    needsParq: health.needsParq,
    pendingReview: health.pendingReview,
    healthApt: health.apt,
    healthLabel: health.label,
    submittedAt: profile?.parq_submitted_at ?? null,
    isPlanilhaStudent: isPlanilhaStudent(profile),
  });
}

export async function POST(request) {
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

  if (!isPlanilhaStudent(profile)) {
    return NextResponse.json({ error: "Questionário disponível apenas para alunos planilha." }, { status: 403 });
  }

  if (profile?.parq_submitted_at) {
    return NextResponse.json({ error: "Questionário já enviado." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const answers = body?.answers;
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Respostas inválidas." }, { status: 400 });
  }

  for (const q of PARQ_QUESTIONS) {
    const v = answers[q.id];
    if (v !== "yes" && v !== "no") {
      return NextResponse.json({ error: `Responda a pergunta ${q.id.replace("q", "")}.` }, { status: 400 });
    }
  }

  const fullName = String(body.fullName || "").trim();
  const age = String(body.age || "").trim();
  const signature = String(body.signature || "").trim();

  if (!fullName || fullName.length < 3) {
    return NextResponse.json({ error: "Informe seu nome completo." }, { status: 400 });
  }
  if (!age || Number.isNaN(Number(age)) || Number(age) < 10 || Number(age) > 120) {
    return NextResponse.json({ error: "Informe uma idade válida." }, { status: 400 });
  }
  if (!signature || signature.length < 3) {
    return NextResponse.json({ error: "Assine digitalmente com seu nome completo." }, { status: 400 });
  }

  const hasYes = PARQ_QUESTIONS.some((q) => answers[q.id] === "yes");
  if (hasYes) {
    const liabilitySignature = String(body.liabilitySignature || "").trim();
    if (!liabilitySignature || liabilitySignature.length < 3) {
      return NextResponse.json(
        { error: "Assine o Termo de Responsabilidade (obrigatório quando há resposta SIM)." },
        { status: 400 }
      );
    }
  }

  const payload = {
    answers,
    fullName,
    age: Number(age),
    signature,
    hasYes,
    liabilitySigned: hasYes,
    liabilitySignature: hasYes ? String(body.liabilitySignature || "").trim() : null,
    submittedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update({
      parq_answers: payload,
      parq_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("parq_submitted_at, health_approved_at, role, plan_status")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const health = healthStatusFromProfile(data);

  return NextResponse.json({
    ok: true,
    pendingReview: health.pendingReview,
    healthLabel: health.label,
    submittedAt: data?.parq_submitted_at ?? null,
  });
}
