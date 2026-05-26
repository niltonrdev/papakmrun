import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_KINDS = new Set(["strava", "checkin"]);
const MAX_BODY = 800;

function isUuid(value) {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

async function readPayload(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function buildItems(supabase, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const ids = Array.from(
    new Set(rows.map((r) => r.user_id).filter(Boolean))
  );

  const profilesById = new Map();
  if (ids.length > 0) {
    const rpc = await supabase.rpc("get_public_profiles", { target_ids: ids });
    if (!rpc.error && Array.isArray(rpc.data)) {
      for (const p of rpc.data) profilesById.set(p.id, p);
    }
  }

  return rows.map((r) => {
    const p = profilesById.get(r.user_id);
    return {
      id: r.id,
      body: r.body,
      createdAt: r.created_at,
      author: {
        id: r.user_id,
        name:
          p?.display_name?.trim() ||
          r.author_name?.trim() ||
          p?.athlete_slug ||
          "Atleta",
        avatarUrl: p?.avatar_url || null,
        slug: p?.athlete_slug || null,
      },
    };
  });
}

export async function GET(request) {
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

  const { searchParams } = request.nextUrl;
  const activityKind = searchParams.get("activityKind");
  const activityId = searchParams.get("activityId");
  const limit = Math.min(Number(searchParams.get("limit") || 80), 200);

  if (!ALLOWED_KINDS.has(activityKind) || !isUuid(activityId)) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feed_comments")
    .select("id, user_id, activity_kind, activity_id, body, author_name, created_at")
    .eq("activity_kind", activityKind)
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = await buildItems(supabase, data || []);
  return NextResponse.json({ items });
}

export async function POST(request) {
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

  const body = await readPayload(request);
  const activityKind = body?.activityKind;
  const activityId = body?.activityId;
  const text = typeof body?.body === "string" ? body.body.trim() : "";

  if (!ALLOWED_KINDS.has(activityKind) || !isUuid(activityId)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "Comentário vazio." }, { status: 400 });
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json(
      { error: `Comentário muito longo (máx. ${MAX_BODY} caracteres).` },
      { status: 400 }
    );
  }

  const rpc = await supabase.rpc("get_public_profile", { target_id: user.id });
  const profile = Array.isArray(rpc?.data) ? rpc.data[0] : null;
  const authorName =
    profile?.display_name?.trim() ||
    profile?.athlete_slug?.trim() ||
    (user.email ? String(user.email).split("@")[0] : "Atleta");

  const { data, error } = await supabase
    .from("feed_comments")
    .insert({
      user_id: user.id,
      activity_kind: activityKind,
      activity_id: activityId,
      body: text,
      author_name: authorName,
    })
    .select("id, user_id, activity_kind, activity_id, body, author_name, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const [item] = await buildItems(supabase, [data]);
  return NextResponse.json({ ok: true, item });
}

export async function DELETE(request) {
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

  const body = await readPayload(request);
  const commentId = body?.commentId;

  if (!isUuid(commentId)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("feed_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
