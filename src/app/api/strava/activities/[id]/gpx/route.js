import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureStravaAccess } from "@/lib/strava/token";
import { getActivityStreams, stravaFetch } from "@/lib/strava/api";
import { buildGpxFromStravaLatLng } from "@/lib/gpx";

export async function GET(request, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }

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

  const session = await ensureStravaAccess(supabase, user.id);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Strava não ligado." }, { status: 400 });
  }

  try {
    const activity = await stravaFetch(`/activities/${id}`, session.accessToken);
    const streams = await getActivityStreams(session.accessToken, id, ["latlng"]);
    const latlng = streams?.latlng?.data;
    if (!latlng?.length) {
      return NextResponse.json(
        { error: "Esta atividade não tem GPS (lat/lng). Exporte o treino do plano em GPX sintético." },
        { status: 422 }
      );
    }
    const gpx = buildGpxFromStravaLatLng(latlng, activity.name, activity.start_date);
    const safeName = String(activity.name || `strava-${id}`).replace(/[^\w\-]+/g, "_");
    return new NextResponse(gpx, {
      status: 200,
      headers: {
        "Content-Type": "application/gpx+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}.gpx"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Falha ao gerar GPX" }, { status: 502 });
  }
}
