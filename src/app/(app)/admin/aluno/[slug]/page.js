"use client";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  Calculator,
  Save,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { computeZonesFromTest } from "@/features/plans/zones.calculator";
import { getMergedPlanForSlug } from "@/features/plans/plan.storage";
import { buildTemplatePlan, TEMPLATE_META } from "@/features/plans/templates";
import { defaultPlanStartMonday, normalizePlanStartMonday } from "@/lib/plan-calendar";
import PlanSpreadsheetEditor from "@/features/coach/PlanSpreadsheetEditor";
import { clonePlan } from "@/features/coach/plan-editor-utils";
import { syncPlanBlockSlugs } from "@/features/plans/workout-blocks";

export default function DetalheAlunoPage() {
  const params = useParams();
  const slug =
    typeof params?.slug === "string" ? params.slug : params?.slug?.[0] ?? "";

  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [distanciaTeste, setDistanciaTeste] = useState(3);
  const [tempoTeste, setTempoTeste] = useState("");
  const [zonas, setZonas] = useState(null);
  const [plan, setPlan] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [calcOpen, setCalcOpen] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(defaultPlanStartMonday());
  const [importBusy, setImportBusy] = useState(false);
  const [serverTemplates, setServerTemplates] = useState([]);
  const [checkinSlugs, setCheckinSlugs] = useState([]);
  const [sourcePlanKey, setSourcePlanKey] = useState(null);
  const [resetCheckinsOnSave, setResetCheckinsOnSave] = useState(false);

  const loadStudentPlan = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setSaveMsg("");
    try {
      const listRes = await fetch("/api/coach/students", { credentials: "include" });
      const listJson = await listRes.json();
      if (!listRes.ok) throw new Error(listJson?.error || "Não foi possível listar alunos.");

      const match = (listJson.items || []).find(
        (s) => s.athleteSlug === slug || s.id === slug
      );
      if (!match?.id) {
        throw new Error("Aluno não encontrado no servidor.");
      }

      setStudentId(match.id);
      setStudentName(match.name || match.email || slug);

      const planRes = await fetch(`/api/coach/students/${match.id}/plan`, {
        credentials: "include",
        cache: "no-store",
      });
      const planJson = await planRes.json();
      if (!planRes.ok) throw new Error(planJson?.error || "Não foi possível carregar a planilha.");

      const weeks =
        planJson.weeks && Object.keys(planJson.weeks).length
          ? planJson.weeks
          : clonePlan(getMergedPlanForSlug(slug));

      const planStart = normalizePlanStartMonday(
        planJson.planStartDate?.slice?.(0, 10) || defaultPlanStartMonday()
      );

      setPlan(syncPlanBlockSlugs(clonePlan(weeks), planStart));
      setPlanStartDate(planStart);
      setDistanciaTeste(planJson.testDistance ?? 3);
      setTempoTeste(planJson.testTime ?? "");
      setZonas(planJson.zones ?? null);
      setCalcOpen(!planJson.zones && Boolean(planJson.testTime));
      setCheckinSlugs(Array.isArray(planJson.checkinSlugs) ? planJson.checkinSlugs : []);
      setSourcePlanKey(planJson.sourcePlanKey || null);
      setResetCheckinsOnSave(false);
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao carregar aluno.");
      setPlan(clonePlan(getMergedPlanForSlug(slug)));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadStudentPlan();
  }, [loadStudentPlan]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/coach/plan-templates", { credentials: "include" });
        const j = await res.json();
        if (res.ok) setServerTemplates(Array.isArray(j.items) ? j.items : []);
      } catch {
        setServerTemplates([]);
      }
    })();
  }, []);

  function applyPlanReplacement(weeks, nextSourceKey, successMsg) {
    setPlan(syncPlanBlockSlugs(clonePlan(weeks || {}), planStartDate));
    setSourcePlanKey(nextSourceKey);
    setCheckinSlugs([]);
    setResetCheckinsOnSave(true);
    setSaveMsg(successMsg);
    setTimeout(() => setSaveMsg(""), 6000);
  }

  function confirmReplacePlan() {
    return window.confirm(
      "Clonar este template substitui a planilha atual. Os treinos feitos do plano anterior voltam para pendente e, ao salvar, os check-ins antigos serão zerados. Continuar?"
    );
  }

  async function applyServerTemplate(planKey) {
    if (!planKey) return;
    if (!confirmReplacePlan()) return;
    try {
      const res = await fetch(
        `/api/coach/plan-template/${encodeURIComponent(planKey)}`,
        { credentials: "include" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha");
      applyPlanReplacement(
        j.weeks || {},
        planKey,
        `Template "${j.title || planKey}" aplicado. Treinos ficam pendentes; clique em Salvar para gravar e zerar os check-ins do plano anterior.`
      );
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao carregar template.");
    }
  }

  function calcularZonas() {
    try {
      const { zonesRecord } = computeZonesFromTest(distanciaTeste, tempoTeste);
      setZonas(zonesRecord);
      setCalcOpen(true);
      setSaveMsg("");
    } catch {
      setSaveMsg("Informe o tempo do teste em MM:SS.");
    }
  }

  async function handleSalvarAlteracoes() {
    if (!studentId || !plan) {
      setSaveMsg("Aluno não carregado. Recarregue a página.");
      return;
    }
    setSaving(true);
    setSaveMsg("Salvando…");
    let vRef = null;
    try {
      if (tempoTeste) {
        vRef = computeZonesFromTest(distanciaTeste, tempoTeste).vRef;
      }
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch(`/api/coach/students/${studentId}/plan`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeks: plan,
          zones: zonas,
          testDistance: distanciaTeste,
          testTime: tempoTeste,
          vRef,
          planStartDate,
          sourcePlanKey: sourcePlanKey || null,
          resetCheckins: resetCheckinsOnSave,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível salvar.");
      setCheckinSlugs(Array.isArray(j.checkinSlugs) ? j.checkinSlugs : []);
      setResetCheckinsOnSave(false);
      setSaveMsg(
        resetCheckinsOnSave
          ? j.checkinsCleared > 0
            ? `Planilha salva. ${j.checkinsCleared} check-in(s) do plano anterior foram zerados.`
            : "Planilha salva. Os treinos do novo template ficam pendentes."
          : j.checkinsCleared > 0
            ? `Alterações salvas. ${j.checkinsCleared} check-in(s) de treinos removidos foram limpos.`
            : "Alterações salvas. Check-ins dos treinos feitos foram mantidos."
      );
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 6000);
    }
  }

  function onTemplateChange(e) {
    const id = e.target.value;
    e.target.value = "";
    if (!id) return;
    if (id.startsWith("server:")) {
      applyServerTemplate(id.slice(7));
      return;
    }
    if (!confirmReplacePlan()) return;
    const built = buildTemplatePlan(id);
    if (!built) return;
    applyPlanReplacement(
      built,
      id,
      `Template ${TEMPLATE_META[id]?.label ?? id} aplicado. Treinos ficam pendentes; clique em Salvar para gravar e zerar os check-ins do plano anterior.`
    );
  }

  async function handleImportCsv(file) {
    if (!studentId || !file) return;
    setImportBusy(true);
    setSaveMsg("Importando…");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/coach/students/${studentId}/plan/import`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha na importação.");
      applyPlanReplacement(
        j.weeks,
        sourcePlanKey,
        "Planilha importada. Treinos ficam pendentes (check-ins do plano anterior foram zerados)."
      );
    } catch (e) {
      setSaveMsg(e?.message || "Erro na importação.");
    } finally {
      setImportBusy(false);
    }
  }

  const rec = studentName ? { name: studentName, slug } : null;
  const calcSummary = [
    distanciaTeste === 2.4 ? "2.4K" : `${distanciaTeste}K`,
    tempoTeste || null,
    zonas ? `${Object.keys(zonas).length} zonas` : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
          <button
            type="button"
            onClick={handleSalvarAlteracoes}
            disabled={saving || loading || !studentId}
            className="bg-emerald-500 text-papa-dark px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          {saveMsg ? (
            <span className="text-[10px] text-emerald-400 font-bold max-w-xs text-right">
              {saveMsg}
            </span>
          ) : null}
        </div>
      </div>

      {rec && (
        <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">
          {rec.name} · {slug}
        </div>
      )}

      <div className="bg-papa-card rounded-3xl border border-white/10 shadow-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setCalcOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-papa-blue/10 text-papa-blue">
              <Calculator size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-white italic uppercase leading-none">
                Calculadora de Zonas
              </h2>
              {!calcOpen && calcSummary ? (
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide mt-1 truncate">
                  {calcSummary}
                </p>
              ) : !calcOpen ? (
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wide mt-1">
                  Clique para calcular paces do teste
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-white/30">
            <span className="text-[9px] font-black uppercase hidden sm:inline">
              {calcOpen ? "Recolher" : "Expandir"}
            </span>
            {calcOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {calcOpen ? (
          <div className="border-t border-white/10 px-5 pb-5 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              <div className="lg:col-span-4">
                <label className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2 block">
                  Distância do teste
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2.4, 3, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistanciaTeste(d)}
                      className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                        distanciaTeste === d
                          ? "bg-papa-blue text-papa-dark border-papa-blue"
                          : "bg-white/5 text-white/40 border-white/5"
                      }`}
                    >
                      {d === 2.4 ? "2.4K" : `${d}K`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4">
                <label className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2 block">
                  Tempo total (MM:SS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempoTeste}
                    onChange={(e) => setTempoTeste(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-papa-blue transition-all"
                    placeholder="MM:SS"
                  />
                  <button
                    type="button"
                    onClick={calcularZonas}
                    className="px-3 py-2 bg-papa-blue rounded-xl text-papa-dark hover:bg-papa-blue/90 transition-all"
                    title="Calcular paces"
                  >
                    <Calculator size={18} />
                  </button>
                </div>
              </div>

              {zonas ? (
                <div className="lg:col-span-4">
                  <label className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2 block">
                    Zonas calculadas
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
                    {Object.entries(zonas).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${value.color}`} />
                          <span className="text-[9px] font-black text-white/50 uppercase truncate">
                            {value.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-white shrink-0">
                          {value.pace ?? `${value.paceMin} - ${value.paceMax}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-6">
          <div className="bg-papa-card p-6 sm:p-8 rounded-[32px] border border-white/10 shadow-2xl">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                  <FileText className="text-papa-orange" /> Planilha do Aluno
                </h2>
                <div className="relative w-full sm:w-auto">
                  <select
                    defaultValue=""
                    onChange={onTemplateChange}
                    className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase outline-none focus:border-papa-blue/40 appearance-none pr-10 cursor-pointer transition-all hover:bg-white/10"
                  >
                    <option value="" disabled className="bg-papa-card text-white">
                      Clonar template…
                    </option>
                    <option value="base8" className="bg-papa-card text-white">
                      {TEMPLATE_META.base8.label}
                    </option>
                    <option value="base12" className="bg-papa-card text-white">
                      {TEMPLATE_META.base12.label}
                    </option>
                    <option value="peak16" className="bg-papa-card text-white">
                      {TEMPLATE_META.peak16.label}
                    </option>
                    <option value="maintenance" className="bg-papa-card text-white">
                      {TEMPLATE_META.maintenance.label}
                    </option>
                    {serverTemplates.map((t) => (
                      <option
                        key={t.planKey}
                        value={`server:${t.planKey}`}
                        className="bg-papa-card text-white"
                      >
                        {t.title || t.planKey} (servidor)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>

            <PlanSpreadsheetEditor
              plan={plan}
              setPlan={setPlan}
              planStartDate={planStartDate}
              setPlanStartDate={setPlanStartDate}
              loading={loading}
              checkinSlugs={checkinSlugs}
              showPlanStartDate
              showStatusColumn
              toolbarExtra={
                studentId ? (
                  <>
                    <a
                      href={`/api/coach/students/${studentId}/plan/export`}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-white/80 hover:bg-white/10"
                    >
                      Exportar Excel (CSV)
                    </a>
                    <label className="rounded-xl border border-papa-blue/30 bg-papa-blue/10 px-4 py-2 text-[10px] font-black uppercase text-papa-blue cursor-pointer hover:bg-papa-blue/20">
                      {importBusy ? "Importando…" : "Importar Excel"}
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls,.txt"
                        className="hidden"
                        disabled={importBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImportCsv(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </>
                ) : null
              }
            />
          </div>
      </div>
    </div>
  );
}
