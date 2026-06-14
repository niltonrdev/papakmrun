import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import {
  enrichRacesWithRsvps,
  mapRaceRow,
  normalizeRaceUrl,
} from "@/lib/group-races";

function isStaff(role) {
  return role === "admin" || role === "coach";
}

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [] });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ items: [] });

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
  const staff = isStaff(me?.role);

  const { data, error } = await supabase
    .from("group_races")
    .select("id, title, race_date, location, description, race_url, created_at")
    .order("race_date", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const races = (data || []).map(mapRaceRow);
  const items = await enrichRacesWithRsvps(supabase, user.id, races, staff);

  return NextResponse.json({ items });
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

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!isStaff(me?.role)) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });
  }

  const row = {
    title,
    race_date: body.raceDate || null,
    location: typeof body.location === "string" ? body.location.trim() : null,
    description:
      typeof body.description === "string" ? body.description.trim() : null,
    race_url: normalizeRaceUrl(body.raceUrl ?? body.race_url ?? ""),
    created_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("group_races")
    .insert(row)
    .select("id, title, race_date, location, description, race_url")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: mapRaceRow(data) });
}
