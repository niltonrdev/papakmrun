"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";

function AnswerBadge({ isYes }) {
  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
        isYes
          ? "border border-amber-500/40 bg-amber-500/15 text-amber-200"
          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {isYes ? "Sim" : "Não"}
    </span>
  );
}

export default function ParqReviewModal({
  open,
  studentId,
  studentName,
  canApprove = true,
  onClose,
  onApproved,
}) {
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !studentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      setData(null);
      try {
        const res = await fetch(`/api/coach/students/${studentId}/parq`, {
          credentials: "include",
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Não foi possível carregar o PAR-Q.");
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled) setErr(e?.message || "Erro ao carregar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, studentId]);

  async function approve() {
    if (!studentId) return;
    setApproving(true);
    setErr("");
    try {
      const res = await fetch(`/api/coach/students/${studentId}/approve-health`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível aprovar.");
      onApproved?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "Erro ao aprovar.");
    } finally {
      setApproving(false);
    }
  }

  const title = studentName ? `PAR-Q — ${studentName}` : "Questionário PAR-Q";

  return (
    <Modal open={open} title={title} wide onClose={onClose}>
      {loading && <p className="text-sm text-white/50">Carregando respostas…</p>}

      {err && (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {err}
        </div>
      )}

      {data && !loading && (
        <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs sm:grid-cols-2">
            <div>
              <span className="text-white/40">Nome no formulário:</span>{" "}
              <span className="font-bold text-white">{data.form.fullName || "—"}</span>
            </div>
            <div>
              <span className="text-white/40">Idade informada:</span>{" "}
              <span className="font-bold text-white">{data.form.age ?? "—"}</span>
            </div>
            {data.student.birthDate && (
              <div>
                <span className="text-white/40">Data nasc. cadastro:</span>{" "}
                <span className="font-bold text-white">
                  {new Date(`${data.student.birthDate}T12:00:00`).toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}
            <div>
              <span className="text-white/40">Enviado em:</span>{" "}
              <span className="font-bold text-white">
                {data.submittedAt
                  ? new Date(data.submittedAt).toLocaleString("pt-BR")
                  : "—"}
              </span>
            </div>
          </div>

          {data.form.hasYes && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
              Aluno respondeu <strong>SIM</strong> a uma ou mais perguntas e assinou o termo de
              responsabilidade.
            </div>
          )}

          <ol className="space-y-3">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="flex-1 text-xs leading-relaxed text-white/85">
                    <span className="mr-1 font-black text-papa-orange">{item.number}.</span>
                    {item.text}
                  </p>
                  <AnswerBadge isYes={item.isYes} />
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/70">
            <p>
              <span className="text-white/40">Assinatura:</span> {data.form.signature || "—"}
            </p>
            {data.form.liabilitySignature && (
              <p className="mt-2">
                <span className="text-white/40">Termo de responsabilidade:</span>{" "}
                {data.form.liabilitySignature}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {canApprove && !data.healthApproved && (
              <button
                type="button"
                disabled={approving}
                onClick={approve}
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-[11px] font-black uppercase text-white hover:bg-emerald-400 disabled:opacity-50"
              >
                {approving ? "Aprovando…" : "Aprovar saúde"}
              </button>
            )}
            {data.healthApproved && (
              <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-[11px] font-black uppercase text-emerald-200">
                Saúde já aprovada
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-[11px] font-black uppercase text-white/70 hover:bg-white/5"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
