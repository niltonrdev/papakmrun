import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { buildStravaAuthorizeUrl } from "@/lib/strava/oauth";

function wantsJson(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json");
}

export async function GET(request) {
  const origin = request.nextUrl.origin;

  if (!env.stravaConfigured) {
    if (wantsJson(request)) {
      return NextResponse.json(
        {
          error:
            "Strava não configurada (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI).",
        },
        { status: 503 }
      );
    }
    const u = new URL(`${origin}/perfil`);
    u.searchParams.set("strava", "config");
    return NextResponse.redirect(u);
  }

  const supabase = await createClient();
  if (!supabase) {
    if (wantsJson(request)) {
      return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
    }
    const u = new URL(`${origin}/perfil`);
    u.searchParams.set("strava", "nodb");
    return NextResponse.redirect(u);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    if (wantsJson(request)) {
      return NextResponse.json(
        { error: "Sessão necessária. Entre com e-mail/senha (Supabase)." },
        { status: 401 }
      );
    }
    const u = new URL(`${origin}/login`);
    u.searchParams.set("next", "/perfil");
    return NextResponse.redirect(u);
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
