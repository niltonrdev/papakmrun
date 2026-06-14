"use client";

import { useCallback, useEffect, useState } from "react";
import { healthStatusFromProfile } from "@/lib/health/parq";

const INITIAL = {
  loading: true,
  needsParq: false,
  pendingReview: false,
  healthLabel: "—",
  healthApt: false,
  isPlanilhaStudent: false,
};

export function useParqStatus() {
  const [state, setState] = useState(INITIAL);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setState({ ...INITIAL, loading: false });
        return;
      }
      const j = await res.json();
      const profile = j?.profile ?? null;
      const health = healthStatusFromProfile(profile);

      setState({
        loading: false,
        needsParq: Boolean(j?.needsParq ?? health.needsParq),
        pendingReview: Boolean(j?.healthPendingReview ?? health.pendingReview),
        healthLabel: j?.healthLabel ?? health.label,
        healthApt: Boolean(j?.healthApt ?? health.apt),
        isPlanilhaStudent: health.needsParq || health.pendingReview || health.apt || profile?.plan_status === "pending" || profile?.role === "plan",
      });
    } catch {
      setState({ ...INITIAL, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
