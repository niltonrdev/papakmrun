import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { STATIC_TEMPLATE_CATALOG } from "@/lib/plan-catalog";

export async function GET() {
  if (!env.supabaseConfigured) {
    return NextResponse.json({ items: STATIC_TEMPLATE_CATALOG });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ items: STATIC_TEMPLATE_CATALOG });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("plan_templates")
    .select("plan_key, title")
    .order("plan_key");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data?.length) {
    return NextResponse.json({ items: STATIC_TEMPLATE_CATALOG });
  }

  return NextResponse.json({
    items: data.map((r) => ({ plan_key: r.plan_key, title: r.title })),
  });
}
