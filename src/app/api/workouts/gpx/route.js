import { NextResponse } from "next/server";
import { buildSyntheticWorkoutGpx } from "@/lib/gpx";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { resolveBlockForAuthenticatedUser, resolveTodayForUser } from "@/lib/plan-resolve";

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const slug = searchParams.get("slug");
  const today = searchParams.get("today") === "1" || searchParams.get("today") === "true";
  const week = searchParams.get("week") || "1";

  const supabase = await createClient();
  let block = null;
  if (slug) {
    const hit = await resolveBlockForAuthenticatedUser(supabase, slug);
    block = hit?.block ?? null;
  } else if (today) {
    block = await resolveTodayForUser(supabase, week);
  }

  if (!block) {
    return NextResponse.json(
      { error: "Treino não encontrado. Use ?slug= ou ?today=1&week=N." },
      { status: 404 }
    );
  }

  const gpx = buildSyntheticWorkoutGpx({
    title: `${block.title} · ${block.km} km`,
    description: block.description,
    km: block.km,
    zoneKey: block.zoneKey,
    workoutDateISO: block.workoutDateISO,
    originLat: env.gpxOriginLat,
    originLon: env.gpxOriginLon,
  });

  const fname = `papakm-${block.slug || "treino"}.gpx`;
  return new NextResponse(gpx, {
    status: 200,
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fname}"`,
    },
  });
}
