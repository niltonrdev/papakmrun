import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

async function assertStaff(supabase, userId) {
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return me?.role === "admin" || me?.role === "coach";
}

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [], reason: "legacy" });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  if (!(await assertStaff(supabase, user.id))) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("coach_library")
    .select("id, title, description, zone_key, default_km, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      zoneKey: r.zone_key,
      defaultKm: r.default_km,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(request) {
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

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Título obrigatório." }, { status: 400 });

  const row = {
    title,
    description: typeof body.description === "string" ? body.description.trim() : "",
    zone_key: body.zoneKey || "z2",
    default_km: body.defaultKm != null ? Number(body.defaultKm) : 8,
    created_by: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("coach_library")
    .insert(row)
    .select("id, title, description, zone_key, default_km")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    item: {
      id: data.id,
      title: data.title,
      description: data.description,
      zoneKey: data.zone_key,
      defaultKm: data.default_km,
    },
  });
}
