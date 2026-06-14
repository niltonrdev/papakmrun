"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HeartPulse } from "lucide-react";
import ParqFormModal from "@/features/health/ParqFormModal";

export default function ParqGate() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [needsParq, setNeedsParq] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/parq", { credentials: "include", cache: "no-store" });
      if (!res.ok) {
        setNeedsParq(false);
        setPendingReview(false);
        setShowForm(false);
        return;
      }
      const j = await res.json();
      setNeedsParq(Boolean(j.needsParq));
      setPendingReview(Boolean(j.pendingReview));
      setShowForm(Boolean(j.needsParq));
    } catch {
      setNeedsParq(false);
      setPendingReview(false);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  function onSubmitted() {
    setShowForm(false);
    setNeedsParq(false);
    setPendingReview(true);
  }

  if (loading) return null;

  return (
    <>
      <ParqFormModal open={showForm} onSubmitted={onSubmitted} />

      {pendingReview && !needsParq && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
          <HeartPulse size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="leading-relaxed">
            <span className="font-black uppercase text-[10px] tracking-widest text-amber-200">
              PAR-Q enviado
            </span>
            <br />
            Aguardando aprovação do professor. Seu status de saúde será atualizado após a
            confirmação.
          </p>
        </div>
      )}
    </>
  );
}
