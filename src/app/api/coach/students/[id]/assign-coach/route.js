import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";

export async function PATCH(request, context) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const coachId =
    body.coachId === null || body.coachId === ""
      ? null
      : typeof body.coachId === "string"
        ? body.coachId.trim()
        : null;

  if (coachId) {
    const { data: coach } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", coachId)
      .maybeSingle();
    if (!coach || (coach.role !== "coach" && coach.role !== "admin")) {
      return NextResponse.json({ error: "Professor inválido." }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ coach_id: coachId, updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, coachId });
}
