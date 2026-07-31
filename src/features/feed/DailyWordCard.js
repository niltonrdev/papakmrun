"use client";

import { BookOpen } from "lucide-react";
import { getDailyMessage } from "@/features/feed/dailyMessages";

export default function DailyWordCard() {
  const message = getDailyMessage();
  const label = message.type === "verse" ? "Palavra do dia" : "Mensagem do dia";

  return (
    <div className="p-5 rounded-3xl bg-papa-card border border-white/5">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen size={14} className="text-papa-blue shrink-0" aria-hidden />
        <span className="text-[10px] font-black text-white/30 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-sm text-white/90 leading-relaxed font-medium">
        {message.type === "verse" ? `“${message.text}”` : message.text}
      </p>
      {message.reference ? (
        <p className="mt-3 text-[11px] font-bold text-papa-blue/80 uppercase tracking-wide">
          {message.reference}
        </p>
      ) : null}
    </div>
  );
}
