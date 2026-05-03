const STRAVA_AUTH = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN = "https://www.strava.com/oauth/token";

export function buildStravaAuthorizeUrl({ clientId, redirectUri, state, scope }) {
  const u = new URL(STRAVA_AUTH);
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("approval_prompt", "auto");
  u.searchParams.set("scope", scope || "read,activity:read_all");
  if (state) u.searchParams.set("state", state);
  return u.toString();
}

export async function exchangeStravaCode({ clientId, clientSecret, code, redirectUri }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
  });
  if (redirectUri) {
    body.set("redirect_uri", redirectUri);
  }
  const res = await fetch(STRAVA_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Strava token exchange failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function refreshStravaToken({ clientId, clientSecret, refreshToken }) {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(STRAVA_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Strava refresh failed: ${res.status} ${t}`);
  }
  return res.json();
}
