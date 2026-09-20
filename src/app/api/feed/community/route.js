import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

const PAGE_LIMIT = 60;
const FEED_DAYS = 7;

function cutoffDateIso(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return toIsoDate(d);
}

function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function mondayOfCurrentWeek() {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toIsoDate(d);
}

function roundKm(n) {
  if (n == null || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 10) / 10;
}

export async function GET(request) {
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

  const { searchParams } = request.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") || PAGE_LIMIT), 150);
  const days = Math.min(
    Math.max(Number(searchParams.get("days") || FEED_DAYS), 1),
    60
  );
  const cutoff = cutoffDateIso(days);
  const weekStart = mondayOfCurrentWeek();

  const selectCols =
    "id, user_id, workout_slug, checkin_date, effort, notes, workout_title, plan_km, author_name, created_at";

  const checkinsRes = await supabase
    .from("checkins")
    .select(selectCols)
    .gte("checkin_date", cutoff)
    .order("checkin_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (checkinsRes.error) {
    return NextResponse.json({ error: checkinsRes.error.message }, { status: 500 });
  }

  const rows = checkinsRes.data || [];
  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

  let profilesById = new Map();
  const weekKmByUser = new Map();

  if (userIds.length > 0) {
    const [rpc, profsRes, weekRes] = await Promise.all([
      supabase.rpc("get_public_profiles", { target_ids: userIds }),
      supabase
        .from("profiles")
        .select("id, display_name, athlete_slug, avatar_url")
        .in("id", userIds),
      supabase
        .from("checkins")
        .select("user_id, plan_km")
        .in("user_id", userIds)
        .gte("checkin_date", weekStart),
    ]);

    if (!rpc.error && Array.isArray(rpc.data)) {
      profilesById = new Map(rpc.data.map((p) => [p.id, p]));
    } else if (Array.isArray(profsRes.data)) {
      profilesById = new Map(profsRes.data.map((p) => [p.id, p]));
    }

    for (const r of weekRes.data || []) {
      const prev = weekKmByUser.get(r.user_id) || 0;
      weekKmByUser.set(r.user_id, prev + (r.plan_km != null ? Number(r.plan_km) : 0));
    }
  }

  function authorFor(userId, fallback) {
    const p = profilesById.get(userId);
    return {
      id: userId,
      name:
        p?.display_name?.trim() ||
        fallback?.trim() ||
        p?.athlete_slug ||
        "Atleta",
      avatarUrl: p?.avatar_url || null,
      slug: p?.athlete_slug || null,
    };
  }

  const items = rows.map((r) => {
    return {
      kind: "checkin",
      id: `checkin-${r.id}`,
      activityKind: "checkin",
      activityId: r.id,
      dateISO: r.checkin_date,
      createdAt: r.created_at,
      title: r.workout_title?.trim() || "Treino",
      workoutSlug: r.workout_slug,
      distanceKm: roundKm(r.plan_km),
      effort: r.effort ?? null,
      note: r.notes ?? "",
      weekKm: roundKm(weekKmByUser.get(r.user_id) || 0) || 0,
      author: authorFor(r.user_id, r.author_name),
    };
  });

  const activityUuids = items.map((it) => it.activityId).filter(Boolean);
  const likeCounts = new Map();
  const commentCounts = new Map();
  const myLikes = new Set();

  if (activityUuids.length > 0) {
    const [allLikesRes, myLikesRes, allCommentsRes] = await Promise.all([
      supabase
        .from("feed_likes")
        .select("activity_kind, activity_id")
        .eq("activity_kind", "checkin")
        .in("activity_id", activityUuids),
      supabase
        .from("feed_likes")
        .select("activity_kind, activity_id")
        .eq("user_id", user.id)
        .eq("activity_kind", "checkin")
        .in("activity_id", activityUuids),
      supabase
        .from("feed_comments")
        .select("activity_kind, activity_id")
        .eq("activity_kind", "checkin")
        .in("activity_id", activityUuids),
    ]);

    for (const r of allLikesRes.data || []) {
      const k = `${r.activity_kind}::${r.activity_id}`;
      likeCounts.set(k, (likeCounts.get(k) || 0) + 1);
    }
    for (const r of myLikesRes.data || []) {
      myLikes.add(`${r.activity_kind}::${r.activity_id}`);
    }
    for (const r of allCommentsRes.data || []) {
      const k = `${r.activity_kind}::${r.activity_id}`;
      commentCounts.set(k, (commentCounts.get(k) || 0) + 1);
    }
  }

  for (const it of items) {
    const k = `${it.activityKind}::${it.activityId}`;
    it.likeCount = likeCounts.get(k) || 0;
    it.commentCount = commentCounts.get(k) || 0;
    it.likedByMe = myLikes.has(k);
  }

  return NextResponse.json({ items, days, cutoff, weekStart });
}
