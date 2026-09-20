"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check } from "lucide-react";
import { PAPAKM_TERMS_PATH, STRAVA_LEGAL } from "@/lib/strava/legal";

const PERMISSIONS = [
  { id: "public", label: "Ver dados sobre seu perfil público", required: true, checked: true },
  { id: "profile", label: "Ver seu perfil completo do Strava", required: false, checked: true },
  { id: "private", label: "Ver dados sobre suas atividades privadas", required: false, checked: true },
];

export default function StravaConnectDialog({ open, onClose, connectHref = "/api/strava/connect" }) {
  const [appUrl, setAppUrl] = useState("https://papakm.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="strava-auth-title"
        className="relative z-[121] flex w-full max-w-[420px] flex-col overflow-hidden rounded-t-3xl bg-white text-neutral-900 shadow-2xl sm:rounded-3xl"
        style={{ maxHeight: "min(92dvh, calc(100dvh - env(safe-area-inset-bottom, 0px)))" }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-8 text-center">
          <p className="text-left text-2xl font-black tracking-tight text-[#fc4c02]">STRAVA</p>

          <div className="mx-auto mt-8 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-black">
            <div className="relative h-16 w-16">
              <Image
                src="/brand/papakm-logo.jpg"
                alt="PapaKM"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <h2
            id="strava-auth-title"
            className="mt-6 text-xl font-bold leading-snug text-neutral-900"
          >
            Autorizar PapaKM a conectar-se ao Strava
          </h2>
          <p className="mt-2 break-all text-sm text-[#0070cc]">{appUrl}</p>

          <div className="mt-8 text-left">
            <p className="mb-3 text-base font-bold text-neutral-900">PapaKM poderá:</p>
            <ul className="space-y-3">
              {PERMISSIONS.map((p) => (
                <li key={p.id} className="flex items-start gap-3">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-[#fc4c02] bg-[#fc4c02] text-white"
                    aria-hidden
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="pt-0.5 text-[15px] leading-snug text-neutral-800">
                    {p.label}
                    {p.required ? (
                      <span className="text-neutral-500"> (obrigatório)</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="shrink-0 space-y-3 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          <a
            href={connectHref}
            className="flex w-full items-center justify-center rounded-full bg-[#fc4c02] py-3.5 text-base font-bold text-white hover:brightness-110"
          >
            Autorizar
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full border-2 border-neutral-300 bg-white py-3.5 text-base font-bold text-neutral-800 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <p className="pt-2 text-center text-[11px] leading-relaxed text-neutral-500">
            Para revogar o acesso a um aplicativo, acesse suas{" "}
            <a
              href={STRAVA_LEGAL.settingsApps}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0070cc] underline underline-offset-2 hover:text-[#005499]"
            >
              configurações
            </a>{" "}
            a qualquer momento.
          </p>
          <p className="pb-2 text-center text-[11px] leading-relaxed text-neutral-500">
            Ao autorizar um aplicativo, você concorda com nossos{" "}
            <a
              href={PAPAKM_TERMS_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0070cc] underline underline-offset-2 hover:text-[#005499]"
            >
              Termos de serviço
            </a>{" "}
            e com o{" "}
            <a
              href={STRAVA_LEGAL.apiAgreement}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0070cc] underline underline-offset-2 hover:text-[#005499]"
            >
              Contrato de uso da API do Strava
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function StravaConnectButton({ className, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      <StravaConnectDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
