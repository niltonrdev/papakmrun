"use client";

import { useEffect, useState } from "react";

/**
 * Papel vindo de /api/me (Supabase). Em modo legacy/demo sem sessão, role fica null.
 */
export function useProfileRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) {
            setRole(null);
            setLoading(false);
          }
          return;
        }
        const j = await res.json();
        if (!cancelled) {
          setRole(j?.profile?.role ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    role,
    isSocial: role === "social",
  };
}
