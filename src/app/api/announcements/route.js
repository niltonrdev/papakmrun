import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

async function assertCoach(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin" || profile?.role === "coach";
}

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ body: null, reason: "legacy" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ body: null, reason: "no_supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("club_announcements")
    .select("id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data?.id ?? null,
    body: data?.body ?? null,
    createdAt: data?.created_at ?? null,
  });
}

export async function POST(request) {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
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

  if (!(await assertCoach(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor ou admin." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Texto do aviso obrigatório." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("club_announcements")
    .insert({ body: text, created_by: user.id })
    .select("id, body, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, announcement: data });
}
