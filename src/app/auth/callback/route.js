import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const authError = url.searchParams.get("error_description") || url.searchParams.get("error");
  const next = url.searchParams.get("next") || "/dashboard";
  const base = url.origin;

  if (authError) {
    const login = new URL("/login", base);
    login.searchParams.set("error", String(authError));
    return NextResponse.redirect(login);
  }

  if (!code) {
    return NextResponse.redirect(`${base}/login?error=missing_code`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${base}/login?error=auth_unavailable`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const login = new URL("/login", base);
    login.searchParams.set("error", error.message);
    return NextResponse.redirect(login);
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  return NextResponse.redirect(`${base}${safeNext}`);
}
