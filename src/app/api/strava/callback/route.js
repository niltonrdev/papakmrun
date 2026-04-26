import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { exchangeStravaCode } from "@/lib/strava/oauth";

export async function GET(request) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  const base = env.appUrl || url.origin;

  if (err) {
    return NextResponse.redirect(`${base}/perfil?strava=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${base}/perfil?strava=invalid`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${base}/perfil?strava=nodb`);
  }

  const cookieState = request.cookies.get("strava_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${base}/perfil?strava=state`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${base}/login?next=/perfil`);
  }

  if (!env.stravaConfigured) {
    return NextResponse.redirect(`${base}/perfil?strava=config`);
  }

  try {
    const token = await exchangeStravaCode({
      clientId: env.stravaClientId,
      clientSecret: env.stravaClientSecret,
      code,
    });

    const athleteId = token.athlete?.id;
    if (!athleteId) {
      return NextResponse.redirect(`${base}/perfil?strava=noathlete`);
    }

    const expiresAt = token.expires_at
      ? new Date(token.expires_at * 1000).toISOString()
      : new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString();

    const { error } = await supabase.from("strava_connections").upsert(
      {
        user_id: user.id,
        strava_athlete_id: athleteId,
        refresh_token: token.refresh_token,
        access_token: token.access_token,
        expires_at: expiresAt,
        scope: token.scope ?? "read,activity:read_all",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error(error);
      return NextResponse.redirect(`${base}/perfil?strava=db`);
    }

    const res = NextResponse.redirect(`${base}/perfil?strava=ok`);
    res.cookies.set("strava_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(`${base}/perfil?strava=token`);
  }
}
