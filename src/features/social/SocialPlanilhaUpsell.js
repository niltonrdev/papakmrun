"use client";

import Link from "next/link";
import { Sparkles, Lock, ArrowRight, MessageCircle } from "lucide-react";

/** Placeholder; defina NEXT_PUBLIC_WHATSAPP_CLUB_URL no .env.local com o wa.me correto. */
const DEFAULT_WHATSAPP_CLUB =
  "https://wa.me/5511999999999?text=" +
  encodeURIComponent(
    "Olá! Quero saber mais sobre o PapaKM Club e o acesso às planilhas."
  );

export default function SocialPlanilhaUpsell({ compact = false }) {
  const whatsappClubUrl =
    (typeof process.env.NEXT_PUBLIC_WHATSAPP_CLUB_URL === "string" &&
      process.env.NEXT_PUBLIC_WHATSAPP_CLUB_URL.trim()) ||
    DEFAULT_WHATSAPP_CLUB;

  return (
    <div
      className={
        compact
          ? "rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-black p-8 text-center shadow-2xl"
          : "rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-950 to-black p-8 md:p-12 text-center shadow-[0_0_60px_rgba(0,209,255,0.08)]"
      }
    >
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-papa-orange/30 bg-papa-orange/10 text-papa-orange">
          <Lock size={26} strokeWidth={2} />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-papa-blue">
          <Sparkles size={12} className="text-papa-orange" /> PapaKM Club
        </div>
        <h2 className="text-2xl font-black italic tracking-tight text-white md:text-3xl">
          Sua evolução com planilha — reservada para quem corre com método.
        </h2>
        <p className="text-sm leading-relaxed text-white/55">
          Treinos periodizados, zonas, exportação e acompanhamento do professor. Ative o plano
          premium com a equipe e desbloqueie tudo. Enquanto isso, o{" "}
          <span className="font-bold text-white/80">Feed</span> continua o seu recorte social:
          celebre, inspire e acompanhe a galera.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/perfil"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-papa-orange px-6 py-3 text-xs font-black uppercase text-white transition hover:brightness-110"
          >
            Conectar Strava
            <ArrowRight size={14} />
          </Link>
          <p className="text-[11px] text-white/40">
            Métricas de volume e ritmo preenchem aqui após a conexão.
          </p>
        </div>
        <p className="pt-2 text-[11px] text-white/35">
          Quer a planilha no seu calendário? Chame a equipe no WhatsApp e fale sobre o{" "}
          <span className="text-white/60">PapaKM Club</span>.
        </p>
        <a
          href={whatsappClubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-6 py-3 text-xs font-black uppercase text-emerald-200 transition hover:bg-emerald-500/20"
        >
          <MessageCircle size={16} strokeWidth={2} />
          WhatsApp — PapaKM Club
        </a>
      </div>
    </div>
  );
}
