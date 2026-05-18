"use client";

import { createClient } from "@/lib/supabase/client";

export function setAuthRoleCookie(role) {
  if (typeof document === "undefined") return;
  const value = role ? `1|${role}` : "";
  document.cookie = value
    ? `papakm_auth=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    : "papakm_auth=; path=/; max-age=0; SameSite=Lax";
}

export async function logout() {
  try {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
  setAuthRoleCookie(null);
  window.location.href = "/login";
}
