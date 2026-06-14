"use client";

import { useEffect, useState } from "react";

/**
 * Papel vindo de /api/me (Supabase). Em modo legacy/demo sem sessão, role fica null.
 */
export function useProfileRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);
  const [healthLabel, setHealthLabel] = useState("Não apto");

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
          setPlanStatus(j?.profile?.plan_status ?? null);
          setHealthLabel(j?.healthLabel ?? "Não apto");
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setPlanStatus(null);
          setHealthLabel("Não apto");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isStaff = role === "admin" || role === "coach";
  const isSocial = role === "social";
  const hasPlanAccess = role === "plan" || isStaff;

  return {
    loading,
    role,
    planStatus,
    isStaff,
    isSocial,
    planPending: planStatus === "pending",
    hasPlanAccess,
    healthLabel,
  };
}
