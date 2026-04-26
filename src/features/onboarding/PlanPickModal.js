"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

export default function PlanPickModal({ open, onDone }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    let c = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/plan/templates", { credentials: "include" });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Falha ao carregar planos.");
        if (!c) setItems(Array.isArray(j.items) ? j.items : []);
      } catch (e) {
        if (!c) setErr(e?.message || "Erro");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [open]);

  async function choose(planKey) {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedBasePlan: planKey }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível salvar.");
      onDone?.(j);
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Escolha sua planilha base">
      <p className="text-sm text-white/60 mb-4">
        Seu professor pode editar estes modelos no painel. Você pode trocar depois com o suporte (por enquanto, uma escolha inicial).
      </p>
      {err && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {err}
        </div>
      )}
      {loading ? (
        <div className="text-sm text-white/40">Carregando opções…</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.plan_key}
              type="button"
              disabled={saving}
              onClick={() => choose(it.plan_key)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left text-sm font-bold text-white hover:border-papa-blue/40 hover:bg-white/10 disabled:opacity-40"
            >
              <span>{it.title}</span>
              <span className="text-[10px] font-mono text-white/30">{it.plan_key}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
