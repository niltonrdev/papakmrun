import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { normalizeRaceUrl } from "@/lib/group-races";

async function assertStaff(supabase, userId) {
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return me?.role === "admin" || me?.role === "coach";
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  if (!(await assertStaff(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (body.raceDate !== undefined) updates.race_date = body.raceDate || null;
  if (typeof body.location === "string") updates.location = body.location.trim();
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (body.raceUrl !== undefined || body.race_url !== undefined) {
    updates.race_url = normalizeRaceUrl(body.raceUrl ?? body.race_url ?? "");
  }

  const { error } = await supabase.from("group_races").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  if (!(await assertStaff(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { error } = await supabase.from("group_races").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
