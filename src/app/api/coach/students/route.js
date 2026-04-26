import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

function isCoachRole(role) {
  return role === "admin" || role === "coach";
}

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [], reason: "legacy" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ items: [], reason: "no_supabase" });
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

  if (!isCoachRole(me?.role)) {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, display_name, athlete_slug, active_week, selected_base_plan")
    .in("role", ["plan", "social"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data || []).map((r) => ({
    id: r.id,
    name:
      r.display_name?.trim() ||
      (r.email ? String(r.email).split("@")[0] : null) ||
      r.athlete_slug ||
      "Aluno",
    email: r.email ?? "",
    role: r.role,
    athleteSlug: r.athlete_slug || "",
    activeWeek: r.active_week || "1",
    selectedBasePlan: r.selected_base_plan || null,
  }));

  return NextResponse.json({ items });
}

