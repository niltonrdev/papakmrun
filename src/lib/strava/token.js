import { env } from "@/lib/env";
import { refreshStravaToken } from "@/lib/strava/oauth";

export async function ensureStravaAccess(supabase, userId) {
  try {
    const { data: row, error } = await supabase
      .from("strava_connections")
      .select("refresh_token, access_token, expires_at, strava_athlete_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!row?.refresh_token) return null;

    const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
    const fresh = expires > Date.now() + 60_000 && row.access_token;

    if (fresh) {
      return { accessToken: row.access_token, stravaAthleteId: row.strava_athlete_id };
    }

    const token = await refreshStravaToken({
      clientId: env.stravaClientId,
      clientSecret: env.stravaClientSecret,
      refreshToken: row.refresh_token,
    });

    const newAccess = token.access_token;
    const newRefresh = token.refresh_token ?? row.refresh_token;
    const newExpires = token.expires_at
      ? new Date(token.expires_at * 1000).toISOString()
      : new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString();

    await supabase
      .from("strava_connections")
      .update({
        access_token: newAccess,
        refresh_token: newRefresh,
        expires_at: newExpires,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    return { accessToken: newAccess, stravaAthleteId: row.strava_athlete_id };
  } catch (e) {
    console.error("ensureStravaAccess", e);
    return null;
  }
}
