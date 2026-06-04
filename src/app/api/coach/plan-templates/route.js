import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [] });
  }
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ items: [] });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin" && me?.role !== "coach") {
    return NextResponse.json({ error: "Apenas professor/admin." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("plan_templates")
    .select("plan_key, title, updated_at")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data || []).map((r) => ({
      planKey: r.plan_key,
      title: r.title,
      updatedAt: r.updated_at,
    })),
  });
}
