function truthy(v) {
  if (v == null || v === "") return false;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  forceHttps:
    String(process.env.FORCE_HTTPS ?? "1").toLowerCase() !== "0",

  get supabaseConfigured() {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  },

  get stravaConfigured() {
    return Boolean(
      process.env.STRAVA_CLIENT_ID &&
        process.env.STRAVA_CLIENT_SECRET &&
        process.env.STRAVA_REDIRECT_URI
    );
  },

  stravaClientId: process.env.STRAVA_CLIENT_ID ?? "",
  stravaClientSecret: process.env.STRAVA_CLIENT_SECRET ?? "",
  stravaRedirectUri: process.env.STRAVA_REDIRECT_URI ?? "",

  /** Centro aproximado para GPX sintético do treino (grau decimal) */
  gpxOriginLat: Number(process.env.GPX_ORIGIN_LAT ?? "-15.7942"),
  gpxOriginLon: Number(process.env.GPX_ORIGIN_LON ?? "-47.8822"),

  /** Base pública da app (ex.: https://papakmrun.vercel.app) para OAuth */
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",

  isDevDemoAuth: truthy(process.env.PAPAKM_DEMO_AUTH),
};
