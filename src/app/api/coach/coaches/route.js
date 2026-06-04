import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: [] });
  }
  const supabase = await createClient();
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
    .from("profiles")
    .select("id, display_name, email, athlete_slug")
    .in("role", ["admin", "coach"])
    .order("display_name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    items: (data || []).map((r) => ({
      id: r.id,
      name:
        r.display_name?.trim() ||
        (r.email ? String(r.email).split("@")[0] : "Professor"),
      email: r.email ?? "",
    })),
  });
}
