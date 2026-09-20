"use client";

import { Camera } from "lucide-react";
import { getCheckinForBlock } from "./checkins.service";

export default function CheckinPhotoButton({ block, onClick, compact = false, className = "" }) {
  const existing = getCheckinForBlock(block);
  const hasPhoto = Boolean(existing?.photoUrl);
  const label = hasPhoto ? "Trocar foto" : "Adicionar foto";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        compact
          ? `inline-flex items-center gap-1 text-[9px] font-bold uppercase text-white/55 hover:text-white transition-colors ${className}`
          : `inline-flex items-center gap-1.5 text-[11px] font-black uppercase px-3 py-2 rounded-xl border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-all ${className}`
      }
    >
      <Camera size={compact ? 10 : 12} />
      {label}
    </button>
  );
}
