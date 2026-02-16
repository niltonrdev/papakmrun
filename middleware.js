import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/brand")) return true; // imagens em /public/brand
  return false;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const auth = req.cookies.get("papakm_auth")?.value;

  if (isPublicPath(pathname)) {
    // se está logado e tenta ir no login, manda pro dashboard
    if (pathname === "/login" && auth) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Qualquer outra rota exige auth
  if (!auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
