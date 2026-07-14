"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, FileText, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PlanSpreadsheetEditor from "@/features/coach/PlanSpreadsheetEditor";
import {
  clonePlan,
  createBlankPlan,
  slugifyTemplateKey,
} from "@/features/coach/plan-editor-utils";
import { defaultPlanStartMonday } from "@/lib/plan-calendar";

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const rawKey =
    typeof params?.key === "string" ? params.key : params?.key?.[0] ?? "";
  const isNew = rawKey === "novo";

  const [templateKey, setTemplateKey] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [plan, setPlan] = useState(null);
  const [planStartDate] = useState(defaultPlanStartMonday());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const loadTemplate = useCallback(async () => {
    if (isNew) {
      setPlan(createBlankPlan(planStartDate));
      setTemplateKey("");
      setTemplateTitle("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSaveMsg("");
    try {
      const res = await fetch(
        `/api/coach/plan-template/${encodeURIComponent(rawKey)}`,
        { credentials: "include", cache: "no-store" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível carregar o template.");

      setTemplateKey(rawKey);
      setTemplateTitle(j.title || rawKey);
      setPlan(
        j.weeks && Object.keys(j.weeks).length
          ? clonePlan(j.weeks)
          : createBlankPlan(planStartDate)
      );
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao carregar template.");
      setPlan(createBlankPlan(planStartDate));
    } finally {
      setLoading(false);
    }
  }, [isNew, rawKey, planStartDate]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  async function handleSave() {
    const key = slugifyTemplateKey(isNew ? templateKey : rawKey);
    const title = templateTitle.trim() || key;
    if (!key) {
      setSaveMsg("Informe uma chave única para o template.");
      return;
    }
    if (!plan || !Object.keys(plan).length) {
      setSaveMsg("A planilha precisa ter ao menos uma semana.");
      return;
    }

    setSaving(true);
    setSaveMsg("Salvando…");
    try {
      const res = await fetch(`/api/coach/plan-template/${encodeURIComponent(key)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks: plan, title }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao salvar template.");

      setSaveMsg(`Template "${title}" salvo. Disponível ao clonar planilha de um aluno.`);
      if (isNew && key !== rawKey) {
        router.replace(`/admin/template/${encodeURIComponent(key)}`);
      }
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao salvar template.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 6000);
    }
  }

  async function handleDelete() {
    if (isNew) return;
    const key = rawKey;
    const label = templateTitle.trim() || key;
    if (!window.confirm(`Excluir o template "${label}"? Essa ação não pode ser desfeita.`)) {
      return;
    }
    setDeleting(true);
    setSaveMsg("Excluindo…");
    try {
      const res = await fetch(`/api/coach/plan-template/${encodeURIComponent(key)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 409 || j?.inUse) {
        const names = Array.isArray(j?.studentsUsing) ? j.studentsUsing.filter(Boolean) : [];
        const who = names.length ? ` Alunos: ${names.join(", ")}.` : "";
        setSaveMsg(
          `Não é possível excluir: o template está em uso por um ou mais alunos.${who}`
        );
        return;
      }
      if (!res.ok) throw new Error(j?.error || "Não foi possível excluir o template.");
      router.replace("/admin");
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao excluir template.");
    } finally {
      setDeleting(false);
      setTimeout(() => setSaveMsg(""), 8000);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-white/40 hover:text-papa-blue transition-colors font-black uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft size={16} /> Voltar para Gestão
        </Link>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isNew ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || saving || loading}
                className="border border-rose-400/40 text-rose-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-rose-500/10 disabled:opacity-50"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? "Excluindo…" : "Excluir template"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || deleting || loading}
              className="bg-papa-orange text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Salvando…" : "Salvar template"}
            </button>
          </div>
          {saveMsg ? (
            <span className="text-[10px] text-emerald-400 font-bold max-w-xs text-right">
              {saveMsg}
            </span>
          ) : null}
        </div>
      </div>

      <div className="bg-papa-card rounded-3xl border border-white/10 shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
            <FileText className="text-papa-orange" />
            {isNew ? "Nova planilha modelo" : "Editar planilha modelo"}
          </h1>
          <p className="text-xs text-white/45">
            Monte ou ajuste a planilha e salve como template. Ela ficará disponível na lista ao
            editar a planilha de um aluno.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-[9px] font-black uppercase text-white/30">
              Nome do modelo
              <input
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                placeholder="Ex.: Base 10 semanas"
                className="mt-1 block w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-papa-blue/40"
              />
            </label>
            <label className="text-[9px] font-black uppercase text-white/30">
              Chave única
              <input
                value={isNew ? templateKey : rawKey}
                onChange={(e) => setTemplateKey(slugifyTemplateKey(e.target.value))}
                readOnly={!isNew}
                placeholder="Ex.: base-10"
                className="mt-1 block w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white font-mono outline-none focus:border-papa-blue/40 disabled:opacity-60"
                disabled={!isNew}
              />
            </label>
          </div>
        </div>

        <PlanSpreadsheetEditor
          plan={plan}
          setPlan={setPlan}
          planStartDate={planStartDate}
          loading={loading}
          showPlanStartDate={false}
          showStatusColumn={false}
        />
      </div>
    </div>
  );
}
