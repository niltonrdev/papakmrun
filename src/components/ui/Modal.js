"use client";
import { useEffect } from "react";

export default function Modal({ open, title, children, footer, onClose, wide = false }) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && onClose?.();
    const { overflow, paddingRight } = document.body.style;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onClose?.()}
        onTouchMove={(e) => e.preventDefault()}
      />
      <div className="absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          className={`pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-950 shadow-2xl sm:rounded-3xl sm:backdrop-blur ${
            wide ? "max-w-2xl" : "max-w-md"
          }`}
          style={{ maxHeight: "min(92dvh, calc(100dvh - env(safe-area-inset-bottom, 0px)))" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="text-base font-semibold">{title}</div>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
              >
                ✕
              </button>
            ) : (
              <span className="w-10" />
            )}
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [-webkit-overflow-scrolling:touch]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {children}
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-white/10 bg-slate-950 px-5 py-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
