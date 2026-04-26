import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { buildStravaAuthorizeUrl } from "@/lib/strava/oauth";

export async function GET() {
  if (!env.stravaConfigured) {
    return NextResponse.json(
      { error: "Strava não configurada (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI)." },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sessão necessária. Entre com e-mail/senha (Supabase)." }, { status: 401 });
  }

  const state = randomBytes(24).toString("hex");
  const res = NextResponse.redirect(
    buildStravaAuthorizeUrl({
      clientId: env.stravaClientId,
      redirectUri: env.stravaRedirectUri,
      state,
      scope: "read,activity:read_all",
    })
  );

  res.cookies.set("strava_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return res;
}
