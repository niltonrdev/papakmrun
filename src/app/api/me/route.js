import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { fetchProfileForUser, profileCapabilities } from "@/lib/profiles/fetch-profile";

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ backend: "legacy" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ backend: "legacy" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null, profile: null }, { status: 401 });
  }

  const { profile, error } = await fetchProfileForUser(supabase, user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const caps = profileCapabilities(profile);
  const needsPlanPicker =
    !profile?.selected_base_plan || String(profile.selected_base_plan).trim() === "";

  return NextResponse.json({
    backend: "supabase",
    user: { id: user.id, email: user.email },
    profile: profile ?? null,
    needsPlanPicker,
    ...caps,
  });
}

export async function PATCH(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const updates = {};
  if (body.selectedBasePlan !== undefined) {
    const v = body.selectedBasePlan;
    updates.selected_base_plan =
      v == null || String(v).trim() === "" ? null : String(v).trim();
  }
  if (body.activeWeek !== undefined && body.activeWeek != null) {
    updates.active_week = String(body.activeWeek).trim() || "1";
  }
  if (body.displayName !== undefined && typeof body.displayName === "string") {
    updates.display_name = body.displayName.trim() || null;
  }
  if (body.bio !== undefined && typeof body.bio === "string") {
    updates.bio = body.bio.trim().slice(0, 500) || null;
  }
  if (body.city !== undefined && typeof body.city === "string") {
    updates.city = body.city.trim().slice(0, 120) || null;
  }
  if (body.country !== undefined && typeof body.country === "string") {
    updates.country = body.country.trim().slice(0, 80) || null;
  }
  if (body.avatarUrl !== undefined && typeof body.avatarUrl === "string") {
    updates.avatar_url = body.avatarUrl.trim() || null;
  }
  if (body.bannerUrl !== undefined && typeof body.bannerUrl === "string") {
    updates.banner_url = body.bannerUrl.trim() || null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select(
      "role, athlete_slug, display_name, active_week, selected_base_plan, plan_status, bio, city, country, avatar_url, banner_url"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profile: data,
    needsPlanPicker:
      !data?.selected_base_plan || String(data.selected_base_plan).trim() === "",
  });
}

