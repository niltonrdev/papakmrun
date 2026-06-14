"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ParqFormModal from "@/features/health/ParqFormModal";
import ParqBanner from "@/features/health/ParqBanner";
import { useParqStatus } from "@/features/health/useParqStatus";

export default function ParqGate() {
  const pathname = usePathname();
  const { loading, needsParq, pendingReview, refresh } = useParqStatus();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  useEffect(() => {
    if (!loading && needsParq) {
      setShowForm(true);
    }
  }, [loading, needsParq]);

  function onSubmitted() {
    setShowForm(false);
    refresh();
  }

  if (loading) return null;

  return (
    <>
      <ParqFormModal open={showForm} onSubmitted={onSubmitted} />
      <ParqBanner
        needsParq={needsParq}
        pendingReview={pendingReview}
        onOpenForm={() => setShowForm(true)}
      />
    </>
  );
}
