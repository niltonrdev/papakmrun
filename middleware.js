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

function isAuthenticated({ user, req }) {
  if (user) return true;
  if (!env.supabaseConfigured) return hasLegacyAuth(req);
  if (env.isDevDemoAuth && hasLegacyAuth(req)) return true;
  return false;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const { response, user } = await handleSupabaseSession(req);

  if (isPublicPath(pathname)) {
    if (pathname === "/login" && isAuthenticated({ user, req })) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!isAuthenticated({ user, req })) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
