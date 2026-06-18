"use client";

import { useEffect, useState } from "react";
import { healthStatusFromProfile } from "@/lib/health/parq";

/**
 * Papel vindo de /api/me (Supabase). Em modo legacy/demo sem sessão, role fica null.
 */
export function useProfileRole() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [planStatus, setPlanStatus] = useState(null);
  const [healthLabel, setHealthLabel] = useState("—");
  const [needsParq, setNeedsParq] = useState(false);
  const [healthPendingReview, setHealthPendingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setRole(null);
            setLoading(false);
          }
          return;
        }
        const j = await res.json();
        const profile = j?.profile ?? null;
        const health = healthStatusFromProfile(profile);
        if (!cancelled) {
          setRole(profile?.role ?? null);
          setPlanStatus(profile?.plan_status ?? null);
          setHealthLabel(j?.healthLabel ?? health.label);
          setNeedsParq(Boolean(j?.needsParq ?? health.needsParq));
          setHealthPendingReview(Boolean(j?.healthPendingReview ?? health.pendingReview));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setPlanStatus(null);
          setHealthLabel("—");
          setNeedsParq(false);
          setHealthPendingReview(false);
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
  const hasPlanAccess = role === "plan";

  return {
    loading,
    role,
    planStatus,
    isStaff,
    isSocial,
    planPending: planStatus === "pending",
    hasPlanAccess,
    healthLabel,
    needsParq,
    healthPendingReview,
  };
}
