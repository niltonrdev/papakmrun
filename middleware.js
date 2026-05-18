import { NextResponse } from "next/server";
import { handleSupabaseSession } from "@/lib/supabase/middleware";
import { env } from "@/lib/env";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api/health")) return true;
  if (pathname.startsWith("/api/strava/callback")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/brand")) return true;
  return false;
}

function hasLegacyAuth(req) {
  return Boolean(req.cookies.get("papakm_auth")?.value);
}

function legacyRoleFromCookie(req) {
  const v = req.cookies.get("papakm_auth")?.value;
  if (!v) return null;
  const parts = String(v).split("|");
  return parts[1] || null;
}

function isAuthenticated({ user, req }) {
  if (user) return true;
  if (!env.supabaseConfigured) return hasLegacyAuth(req);
  if (env.isDevDemoAuth && hasLegacyAuth(req)) return true;
  return false;
}

function isHttpsRequest(req) {
  const proto = req.headers.get("x-forwarded-proto");
  return proto === "https" || req.nextUrl.protocol === "https:";
}

function withSecurityHeaders(res, req) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org https://www.strava.com",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://*.supabase.co https://www.strava.com",
    "font-src 'self' data:",
  ].join("; ");

  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Content-Security-Policy", csp);
  if (env.NODE_ENV === "production" && isHttpsRequest(req)) {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return res;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (env.NODE_ENV === "production" && env.forceHttps && !isHttpsRequest(req)) {
    const secureUrl = req.nextUrl.clone();
    secureUrl.protocol = "https:";
    return withSecurityHeaders(NextResponse.redirect(secureUrl, 308), req);
  }

  const { response, user } = await handleSupabaseSession(req);

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && isAuthenticated({ user, req })) {
      const url = req.nextUrl.clone();
      const role = legacyRoleFromCookie(req);
      url.pathname = role === "admin" || role === "coach" ? "/admin" : "/dashboard";
      return withSecurityHeaders(NextResponse.redirect(url), req);
    }
    return withSecurityHeaders(response, req);
  }

  if (!isAuthenticated({ user, req })) {
    if (pathname.startsWith("/api")) {
      return withSecurityHeaders(
        NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
        req
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(url), req);
  }

  return withSecurityHeaders(response, req);
}

export const config = {
  matcher: ["/:path*"],
};
