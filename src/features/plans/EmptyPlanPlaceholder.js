"use client";

import { CalendarDays } from "lucide-react";

export default function EmptyPlanPlaceholder({ compact = false }) {
  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-white/10 bg-papa-card p-8 text-center"
          : "rounded-3xl border border-white/10 bg-papa-card p-8 sm:p-12 text-center shadow-2xl"
      }
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/30">
          <CalendarDays size={26} strokeWidth={2} />
        </div>
        <h3 className="text-xl font-black italic uppercase tracking-tight text-white">
          Planilha vazia
        </h3>
        <p className="text-sm leading-relaxed text-white/50">
          Seu professor ainda não prescreveu treinos para você. Quando a planilha for liberada,
          ela aparecerá aqui.
        </p>
      </div>
    </div>
  );
}
