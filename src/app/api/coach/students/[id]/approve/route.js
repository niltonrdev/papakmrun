import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";

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

  const rpc = await supabase.rpc("approve_plan_student", { target_id: studentId });
  if (!rpc.error && rpc.data) {
    return NextResponse.json({ ok: true, profile: rpc.data });
  }

  const rpcMsg = String(rpc.error?.message || "").toLowerCase();
  if (
    rpc.error &&
    !rpcMsg.includes("approve_plan_student") &&
    rpc.error?.code !== "42883" &&
    rpc.error?.code !== "PGRST202"
  ) {
    if (rpcMsg.includes("not_pending")) {
      return NextResponse.json(
        { error: "Este aluno não está aguardando aprovação de planilha." },
        { status: 400 }
      );
    }
    if (rpcMsg.includes("forbidden")) {
      return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
    }
    return NextResponse.json({ error: rpc.error.message }, { status: 500 });
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
