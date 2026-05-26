import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_KINDS = new Set(["strava", "checkin"]);

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

async function countLikes(supabase, activityKind, activityId) {
  const { count, error } = await supabase
    .from("feed_likes")
    .select("id", { count: "exact", head: true })
    .eq("activity_kind", activityKind)
    .eq("activity_id", activityId);
  if (error) return null;
  return count ?? 0;
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

  if (!ALLOWED_KINDS.has(activityKind) || !isUuid(activityId)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { error: insertError } = await supabase
    .from("feed_likes")
    .insert({
      user_id: user.id,
      activity_kind: activityKind,
      activity_id: activityId,
    });

  let likedByMe = true;

  if (insertError) {
    if (insertError.code === "23505") {
      const { error: deleteError } = await supabase
        .from("feed_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("activity_kind", activityKind)
        .eq("activity_id", activityId);
      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
      likedByMe = false;
    } else {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  const likeCount = await countLikes(supabase, activityKind, activityId);

  return NextResponse.json({
    ok: true,
    likedByMe,
    likeCount: likeCount ?? 0,
  });
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
  const activityKind = body?.activityKind;
  const activityId = body?.activityId;

  if (!ALLOWED_KINDS.has(activityKind) || !isUuid(activityId)) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("feed_likes")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_kind", activityKind)
    .eq("activity_id", activityId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const likeCount = await countLikes(supabase, activityKind, activityId);

  return NextResponse.json({
    ok: true,
    likedByMe: false,
    likeCount: likeCount ?? 0,
  });
}
