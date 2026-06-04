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

  let query = supabase
    .from("profiles")
    .select(
      "id, email, role, display_name, athlete_slug, active_week, selected_base_plan, plan_status, coach_id, created_at"
    )
    .in("role", ["plan", "social"]);

  if (me?.role === "coach") {
    query = query.or(`coach_id.eq.${user.id},coach_id.is.null`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  const coachIds = [
    ...new Set((data || []).map((r) => r.coach_id).filter(Boolean)),
  ];
  let coachMap = {};
  if (coachIds.length) {
    const { data: coaches } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", coachIds);
    for (const c of coaches || []) {
      coachMap[c.id] =
        c.display_name?.trim() ||
        (c.email ? String(c.email).split("@")[0] : "Professor");
    }
  }

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
    planStatus: r.plan_status || null,
    athleteSlug: r.athlete_slug || "",
    activeWeek: r.active_week || "1",
    selectedBasePlan: r.selected_base_plan || null,
    coachId: r.coach_id || null,
    coachName: r.coach_id ? coachMap[r.coach_id] || "Professor" : null,
  }));

  return NextResponse.json({ items });
}

