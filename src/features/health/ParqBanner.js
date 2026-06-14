"use client";

import { HeartPulse, ClipboardList } from "lucide-react";

export default function ParqBanner({ needsParq, pendingReview, onOpenForm }) {
  if (needsParq) {
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-papa-orange/40 bg-papa-orange/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ClipboardList size={20} className="mt-0.5 shrink-0 text-papa-orange" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-papa-orange">
              Questionário PAR-Q obrigatório
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/85">
              Antes de iniciar os treinos, preencha o questionário de prontidão física (PAR-Q).
              Seu status de saúde ficará como <strong>Não apto</strong> até o professor aprovar.
            </p>
          </div>
        </div>
        {onOpenForm && (
          <button
            type="button"
            onClick={onOpenForm}
            className="shrink-0 rounded-xl bg-papa-orange px-4 py-2.5 text-[11px] font-black uppercase text-white hover:brightness-110"
          >
            Preencher agora
          </button>
        )}
      </div>
    );
  }

  if (pendingReview) {
    return (
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
    );
  }

  return null;
}
