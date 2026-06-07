import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { calcPoints, getWeekRangeISO } from "@/features/ranking/ranking.service";

export async function GET(request) {
  const { startISO, endISO } = getWeekRangeISO(new Date());
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 10), 25);

  if (!env.supabaseConfigured) {
    return NextResponse.json({ range: { startISO, endISO }, items: [], reason: "legacy" });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ range: { startISO, endISO }, items: [], reason: "no_supabase" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("checkins")
    .select("checkin_date, effort, notes, author_name, user_id")
    .gte("checkin_date", startISO)
    .lte("checkin_date", endISO);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byUser = new Map();

  for (const row of data || []) {
    const name = row.author_name?.trim() || "Atleta";
    const key = row.user_id || name;
    const prev = byUser.get(key) || { name, points: 0, workouts: 0 };
    prev.points += calcPoints({
      effort: row.effort,
      note: row.notes ?? "",
    });
    prev.workouts += 1;
    byUser.set(key, prev);
  }

  const sorted = Array.from(byUser.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.workouts - a.workouts;
  });

  const items = sorted.slice(0, limit).map((x) => ({
    ...x,
    note: `${x.workouts} treino${x.workouts === 1 ? "" : "s"}`,
  }));

  return NextResponse.json({ range: { startISO, endISO }, items });
}
