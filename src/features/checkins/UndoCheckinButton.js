"use client";

import { useState } from "react";
import { CheckCircle2, Undo2 } from "lucide-react";
import { undoWorkoutCheckin } from "./checkins.service";

export default function UndoCheckinButton({
  workoutSlug,
  onUndone,
  compact = false,
  className = "",
}) {
  const [busy, setBusy] = useState(false);

  async function handleUndo() {
    if (!workoutSlug || busy) return;
    const ok = window.confirm("Desfazer o check-in deste treino?");
    if (!ok) return;
    setBusy(true);
    try {
      await undoWorkoutCheckin({ workoutSlug });
      onUndone?.();
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
          <CheckCircle2 size={12} /> Feito
        </span>
        <button
          type="button"
          onClick={handleUndo}
          disabled={busy}
          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-white/45 hover:text-white/80 disabled:opacity-40 transition-colors"
        >
          <Undo2 size={10} />
          {busy ? "…" : "Desfazer"}
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-4 py-2 rounded-xl border border-emerald-500/40 text-emerald-400 bg-emerald-500/10">
        <CheckCircle2 size={14} /> Feito
      </span>
      <button
        type="button"
        onClick={handleUndo}
        disabled={busy}
        className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-2 rounded-xl border border-white/15 text-white/55 hover:text-white hover:bg-white/5 disabled:opacity-40 transition-all"
      >
        <Undo2 size={12} />
        {busy ? "…" : "Desfazer"}
      </button>
    </div>
  );
}
