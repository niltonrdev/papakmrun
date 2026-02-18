"use client";

import { useEffect } from "react";

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onClose?.()}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="text-base font-semibold">{title}</div>
            <button
              type="button"
              onClick={() => onClose?.()}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
