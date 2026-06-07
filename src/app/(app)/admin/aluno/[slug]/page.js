"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Calculator,
  Save,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { computeZonesFromTest } from "@/features/plans/zones.calculator";
import { getMergedPlanForSlug } from "@/features/plans/plan.storage";
import { buildTemplatePlan, TEMPLATE_META } from "@/features/plans/templates";
import {
  addDaysISO,
  formatWeekRangeLabel,
  renumberPlanWeeks,
  defaultPlanStartMonday,
} from "@/lib/plan-calendar";
import { isWorkoutMissed, hasCheckinForSlug } from "@/features/checkins/missed-workout";

const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"];
const WEEKDAY_OPTIONS = [
  { label: "Segunda", offset: 0 },
  { label: "Terça", offset: 1 },
  { label: "Quarta", offset: 2 },
  { label: "Quinta", offset: 3 },
  { label: "Sexta", offset: 4 },
  { label: "Sábado", offset: 5 },
  { label: "Domingo", offset: 6 },
];

function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function dayOffsetFromLabel(dayLabel) {
  const normalized = normalizeText(dayLabel);
  const opt = WEEKDAY_OPTIONS.find((x) => normalizeText(x.label) === normalized);
  return opt ? opt.offset : null;
}

function computeWorkoutDateISO(planStartMonday, weekKey, dayLabel) {
  const offset = dayOffsetFromLabel(dayLabel);
  if (offset == null || !planStartMonday) return null;
  const weekNumber = Math.max(1, Number(weekKey) || 1);
  return addDaysISO(planStartMonday, (weekNumber - 1) * 7 + offset);
}

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

      setPlan(clonePlan(weeks));
      setPlanStartDate(
        planJson.planStartDate?.slice?.(0, 10) || defaultPlanStartMonday()
      );
      setDistanciaTeste(planJson.testDistance ?? 3);
      setTempoTeste(planJson.testTime ?? "");
      setZonas(planJson.zones ?? null);
      setCalcOpen(!planJson.zones && Boolean(planJson.testTime));
      setCheckinSlugs(Array.isArray(planJson.checkinSlugs) ? planJson.checkinSlugs : []);
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

  async function applyServerTemplate(planKey) {
    if (!planKey) return;
    try {
      const res = await fetch(
        `/api/coach/plan-template/${encodeURIComponent(planKey)}`,
        { credentials: "include" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha");
      setPlan(clonePlan(j.weeks || {}));
      setSaveMsg(`Template "${j.title || planKey}" aplicado.`);
      setTimeout(() => setSaveMsg(""), 4000);
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao carregar template.");
    }
  }

  const weekNumbers = useMemo(() => {
    if (!plan) return [];
    return Object.keys(plan).sort((a, b) => Number(a) - Number(b));
  }, [plan]);

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
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível salvar.");
      setSaveMsg("Alterações salvas no servidor.");
    } catch (e) {
      setSaveMsg(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 6000);
    }
  }

  function onTemplateChange(e) {
    const id = e.target.value;
    if (!id) return;
    if (id.startsWith("server:")) {
      applyServerTemplate(id.slice(7));
      e.target.value = "";
      return;
    }
    const built = buildTemplatePlan(id);
    if (!built) return;
    const next = clonePlan(built);
    setPlan(next);
    setSaveMsg(`Template ${TEMPLATE_META[id]?.label ?? id} aplicado (clique em Salvar).`);
    setTimeout(() => setSaveMsg(""), 4000);
    e.target.value = "";
  }

  function updateBlock(weekKey, blockIdx, field, value) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = clonePlan(prev);
      const w = next[weekKey];
      if (!w?.blocks?.[blockIdx]) return prev;
      const block = { ...w.blocks[blockIdx] };
      if (field === "km") {
        block.km = Number(value) || 0;
      } else {
        block[field] = value;
      }
      if (field === "dayLabel") {
        const iso = computeWorkoutDateISO(planStartDate, weekKey, value);
        if (iso) block.workoutDateISO = iso;
      }
      w.blocks[blockIdx] = block;
      w.blocks.sort((a, b) => {
        const ao = dayOffsetFromLabel(a.dayLabel);
        const bo = dayOffsetFromLabel(b.dayLabel);
        return (ao == null ? 999 : ao) - (bo == null ? 999 : bo);
      });
      return next;
    });
  }

  function addBlock(weekKey) {
    setPlan((prev) => {
      if (!prev?.[weekKey]) return prev;
      const next = clonePlan(prev);
      const w = next[weekKey];
      const used = new Set((w.blocks || []).map((b) => dayOffsetFromLabel(b.dayLabel)));
      const picked = WEEKDAY_OPTIONS.find((x) => !used.has(x.offset)) ?? WEEKDAY_OPTIONS[0];
      const blockIdx = (w.blocks?.length || 0) + 1;
      const workoutDateISO = computeWorkoutDateISO(planStartDate, weekKey, picked.label);
      const newBlock = {
        dayLabel: picked.label,
        slug: `s${weekKey}-custom-${Date.now()}-${blockIdx}`,
        km: 6,
        zoneKey: "z2",
        title: "Treino",
        description: "Ajuste o conteúdo conforme o aluno.",
        workoutDateISO: workoutDateISO ?? null,
      };
      w.blocks = [...(w.blocks || []), newBlock].sort((a, b) => {
        const ao = dayOffsetFromLabel(a.dayLabel);
        const bo = dayOffsetFromLabel(b.dayLabel);
        return (ao == null ? 999 : ao) - (bo == null ? 999 : bo);
      });
      return next;
    });
  }

  function removeBlock(weekKey, blockIdx) {
    setPlan((prev) => {
      if (!prev?.[weekKey]) return prev;
      const next = clonePlan(prev);
      const w = next[weekKey];
      w.blocks = (w.blocks || []).filter((_, idx) => idx !== blockIdx);
      return next;
    });
  }

  function blankWeekBlocks(weekKey) {
    return [
      {
        dayLabel: "Terça",
        slug: `s${weekKey}-terca`,
        km: 6,
        zoneKey: "z2",
        title: "Ritmo",
        description: "Aquecimento + bloco principal.",
        workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Terça"),
      },
      {
        dayLabel: "Quinta",
        slug: `s${weekKey}-quinta`,
        km: 8,
        zoneKey: "z3",
        title: "Intervalado",
        description: "Bloco principal conforme orientação.",
        workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Quinta"),
      },
      {
        dayLabel: "Sábado",
        slug: `s${weekKey}-sabado`,
        km: 12,
        zoneKey: "z1",
        title: "Longo",
        description: "Ritmo fácil a moderado.",
        workoutDateISO: computeWorkoutDateISO(planStartDate, weekKey, "Sábado"),
      },
    ];
  }

  function addWeek() {
    setPlan((prev) => {
      const base = prev && Object.keys(prev).length ? prev : {};
      const nums = Object.keys(base).map(Number);
      const n = (nums.length ? Math.max(...nums) : 0) + 1;
      const next = clonePlan(base);
      next[String(n)] = {
        id: `week-${n}`,
        title: `Semana ${n}`,
        phase: "Personalizado",
        blocks: blankWeekBlocks(String(n)),
      };
      return next;
    });
  }

  function insertWeekAfter(afterWeekKey) {
    setPlan((prev) => {
      if (!prev) return prev;
      const keys = Object.keys(prev).sort((a, b) => Number(a) - Number(b));
      const ordered = [];
      for (const k of keys) {
        ordered.push(prev[k]);
        if (k === String(afterWeekKey)) {
          ordered.push(null);
        }
      }
      const next = {};
      ordered.forEach((weekData, idx) => {
        const wk = String(idx + 1);
        if (weekData === null) {
          next[wk] = {
            id: `week-${wk}`,
            title: `Semana ${wk}`,
            phase: "Personalizado",
            blocks: blankWeekBlocks(wk),
          };
        } else {
          next[wk] = { ...weekData, title: `Semana ${wk}` };
        }
      });
      return next;
    });
  }

  function removeWeek(weekKey) {
    setPlan((prev) => {
      if (!prev || Object.keys(prev).length <= 1) return prev;
      const next = clonePlan(prev);
      delete next[weekKey];
      return renumberPlanWeeks(next);
    });
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
      setPlan(clonePlan(j.weeks));
      setSaveMsg("Planilha importada. Revise e salve se necessário.");
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
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                Editor em grade: ajuste km, zona e observações por semana. O calendário do aluno
                avança automaticamente a partir da data de início.
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <label className="text-[9px] font-black uppercase text-white/30">
                  Início semana 1 (segunda)
                  <input
                    type="date"
                    value={planStartDate}
                    onChange={(e) => setPlanStartDate(e.target.value)}
                    className="mt-1 block rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
                  />
                </label>
                {studentId && (
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
                )}
              </div>
            </div>

            {!plan || loading ? (
              <div className="min-h-[200px] flex items-center justify-center text-white/30 text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando planilha…
              </div>
            ) : (
              <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2">
                {weekNumbers.map((wk) => {
                  const week = plan[wk];
                  return (
                    <div
                      key={wk}
                      className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-black text-white uppercase italic tracking-tight">
                            {week.title} — {week.phase}
                          </h3>
                          <p className="text-[10px] text-papa-blue/80 font-bold mt-1">
                            {formatWeekRangeLabel(planStartDate, wk)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => insertWeekAfter(wk)}
                            className="px-2 py-1 rounded-lg border border-white/10 text-[9px] font-black uppercase text-white/50 hover:text-white"
                          >
                            + Semana após
                          </button>
                          <button
                            type="button"
                            onClick={() => removeWeek(wk)}
                            disabled={weekNumbers.length <= 1}
                            className="px-2 py-1 rounded-lg border border-rose-400/30 text-[9px] font-black uppercase text-rose-300 hover:bg-rose-500/10 disabled:opacity-30"
                          >
                            Remover semana
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="text-[9px] font-black uppercase text-white/30 border-b border-white/10">
                              <th className="pb-2 pr-2">Dia</th>
                              <th className="pb-2 pr-2">Km</th>
                              <th className="pb-2 pr-2">Zona</th>
                              <th className="pb-2 pr-2">Status</th>
                              <th className="pb-2">Observações</th>
                              <th className="pb-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="text-white/80">
                            {(week.blocks ?? []).map((b, idx) => {
                              const workoutDateISO =
                                b.workoutDateISO ||
                                computeWorkoutDateISO(planStartDate, wk, b.dayLabel);
                              const blockWithDate = { ...b, workoutDateISO };
                              const done = hasCheckinForSlug(b.slug, checkinSlugs);
                              const missed = isWorkoutMissed(blockWithDate, checkinSlugs);
                              return (
                              <tr key={b.slug} className="border-b border-white/5 align-top">
                                <td className="py-2 pr-2 font-bold text-white whitespace-nowrap">
                                  <select
                                    value={b.dayLabel}
                                    onChange={(e) =>
                                      updateBlock(wk, idx, "dayLabel", e.target.value)
                                    }
                                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-black uppercase"
                                  >
                                    {WEEKDAY_OPTIONS.map((opt) => (
                                      <option key={opt.label} value={opt.label} className="bg-papa-dark">
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 pr-2">
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={b.km}
                                    onChange={(e) =>
                                      updateBlock(wk, idx, "km", e.target.value)
                                    }
                                    className="w-16 bg-black/30 border border-white/10 rounded-lg px-2 py-1 font-mono text-white"
                                  />
                                </td>
                                <td className="py-2 pr-2">
                                  <select
                                    value={b.zoneKey}
                                    onChange={(e) =>
                                      updateBlock(wk, idx, "zoneKey", e.target.value)
                                    }
                                    className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-black uppercase"
                                  >
                                    {ZONE_KEYS.map((zk) => (
                                      <option key={zk} value={zk} className="bg-papa-dark">
                                        {zk}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 pr-2 whitespace-nowrap">
                                  {done ? (
                                    <span className="text-[9px] font-black uppercase text-emerald-400">
                                      Feito
                                    </span>
                                  ) : missed ? (
                                    <span className="text-[9px] font-black uppercase text-red-400">
                                      Treino não feito
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase text-white/30">
                                      Pendente
                                    </span>
                                  )}
                                </td>
                                <td className="py-2">
                                  <textarea
                                    value={b.description}
                                    onChange={(e) =>
                                      updateBlock(wk, idx, "description", e.target.value)
                                    }
                                    rows={2}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white/90 resize-y min-h-[48px]"
                                  />
                                </td>
                                <td className="py-2 pl-2 text-right">
                                  <button
                                    type="button"
                                    onClick={() => removeBlock(wk, idx)}
                                    className="inline-flex items-center justify-center p-1.5 rounded-lg border border-rose-400/30 text-rose-300 hover:bg-rose-500/10"
                                    title="Remover treino"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => addBlock(wk)}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase hover:bg-white/10 inline-flex items-center gap-2"
                        >
                          <Plus size={12} /> Adicionar treino na semana
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={addWeek}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 inline-flex items-center gap-2"
              >
                <Activity size={14} /> Adicionar semana
              </button>
            </div>
          </div>
      </div>
    </div>
  );
}
