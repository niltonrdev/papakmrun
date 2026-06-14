import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function POST(_request, context) {
  const { id: raceId } = await context.params;
  if (!raceId) {
    return NextResponse.json({ error: "ID da prova obrigatório." }, { status: 400 });
  }
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

  const { data: race } = await supabase
    .from("group_races")
    .select("id")
    .eq("id", raceId)
    .maybeSingle();
  if (!race) {
    return NextResponse.json({ error: "Prova não encontrada." }, { status: 404 });
  }

  const { error } = await supabase.from("group_race_rsvps").upsert(
    {
      race_id: raceId,
      user_id: user.id,
    },
    { onConflict: "race_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, going: true });
}

export async function DELETE(_request, context) {
  const { id: raceId } = await context.params;
  if (!raceId) {
    return NextResponse.json({ error: "ID da prova obrigatório." }, { status: 400 });
  }
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

  const { error } = await supabase
    .from("group_race_rsvps")
    .delete()
    .eq("race_id", raceId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, going: false });
}
