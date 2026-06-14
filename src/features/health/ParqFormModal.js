"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { PARQ_QUESTIONS } from "@/lib/health/parq";

function YesNoGroup({ name, value, onChange, disabled }) {
  return (
    <div className="flex gap-2">
      {[
        { v: "yes", label: "Sim" },
        { v: "no", label: "Não" },
      ].map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.v)}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs font-black uppercase transition ${
              active
                ? opt.v === "yes"
                  ? "border-amber-400/60 bg-amber-500/20 text-amber-100"
                  : "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white/80"
            } disabled:opacity-50`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ParqFormModal({ open, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [signature, setSignature] = useState("");
  const [liabilitySignature, setLiabilitySignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const hasYes = useMemo(
    () => PARQ_QUESTIONS.some((q) => answers[q.id] === "yes"),
    [answers]
  );

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSaving(false);
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/parq", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          fullName,
          age,
          signature,
          liabilitySignature: hasYes ? liabilitySignature : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível enviar.");
      onSubmitted?.(j);
    } catch (e) {
      setErr(e?.message || "Erro ao enviar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="Questionário de Prontidão Física (PAR-Q)" wide>
      <form onSubmit={submit} className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <p className="text-xs leading-relaxed text-white/60">
          Este questionário identifica a necessidade de avaliação médica antes do início da
          atividade física. Caso responda <strong className="text-white/80">SIM</strong> a uma ou
          mais perguntas, converse com seu médico antes de aumentar seu nível de atividade.
        </p>

        {err && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {err}
          </div>
        )}

        <ol className="space-y-4">
          {PARQ_QUESTIONS.map((q, i) => (
            <li key={q.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs leading-relaxed text-white/85">
                <span className="mr-1 font-black text-papa-orange">{i + 1}.</span>
                {q.text}
              </p>
              <YesNoGroup
                name={q.id}
                value={answers[q.id]}
                onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                disabled={saving}
              />
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Nome completo
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-papa-orange/50"
              placeholder="Seu nome completo"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Idade
            </label>
            <input
              required
              type="number"
              min={10}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-papa-orange/50"
              placeholder="Ex.: 32"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Data
            </label>
            <input
              readOnly
              value={new Date().toLocaleDateString("pt-BR")}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white/60"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Assinatura (digite seu nome completo)
            </label>
            <input
              required
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-papa-orange/50"
              placeholder="Assinatura digital"
            />
          </div>
        </div>

        {hasYes && (
          <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <h4 className="text-xs font-black uppercase tracking-wide text-amber-100">
              Termo de Responsabilidade
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-100/80">
              Estou ciente de que é recomendável conversar com um médico antes de aumentar meu
              nível atual de atividade física, por ter respondido SIM a uma ou mais perguntas do
              PAR-Q. Assumo plena responsabilidade por qualquer atividade física praticada sem o
              atendimento a essa recomendação.
            </p>
            <input
              required
              value={liabilitySignature}
              onChange={(e) => setLiabilitySignature(e.target.value)}
              className="w-full rounded-xl border border-amber-500/30 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/50"
              placeholder="Assinatura do termo (nome completo)"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-papa-orange py-3.5 text-sm font-black uppercase text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {saving ? "Enviando…" : "Enviar questionário"}
        </button>
      </form>
    </Modal>
  );
}
