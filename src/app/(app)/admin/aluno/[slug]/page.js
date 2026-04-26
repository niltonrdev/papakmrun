"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Calculator,
  Save,
  FileText,
  Activity,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { computeZonesFromTest } from "@/features/plans/zones.calculator";
import { getAthleteRecord, saveAthleteRecord } from "@/features/athletes/athletes.storage";
import { getMergedPlanForSlug, replaceAthletePlan } from "@/features/plans/plan.storage";
import { buildTemplatePlan, TEMPLATE_META, weekDatesForTemplateWeek } from "@/features/plans/templates";

const ZONE_KEYS = ["z1", "z2", "z3", "z4", "z5"];

function clonePlan(plan) {
  return JSON.parse(JSON.stringify(plan));
}

export default function DetalheAlunoPage() {
  const params = useParams();
  const slug =
    typeof params?.slug === "string" ? params.slug : params?.slug?.[0] ?? "";

  const [distanciaTeste, setDistanciaTeste] = useState(3);
  const [tempoTeste, setTempoTeste] = useState("");
  const [zonas, setZonas] = useState(null);
  const [plan, setPlan] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (!slug) return;
    const rec = getAthleteRecord(slug);
    setDistanciaTeste(rec.distanciaTeste ?? 3);
    setTempoTeste(rec.tempoTeste ?? "");
    setZonas(rec.zonesRecord ?? null);
    setPlan(clonePlan(getMergedPlanForSlug(slug)));
  }, [slug]);

  const weekNumbers = useMemo(() => {
    if (!plan) return [];
    return Object.keys(plan).sort((a, b) => Number(a) - Number(b));
  }, [plan]);

  function calcularZonas() {
    try {
      const { zonesRecord } = computeZonesFromTest(distanciaTeste, tempoTeste);
      setZonas(zonesRecord);
      setSaveMsg("");
    } catch {
      setSaveMsg("Informe o tempo do teste em MM:SS.");
    }
  }

  function handleSalvarAlteracoes() {
    if (!slug) return;
    let vRef = null;
    try {
      if (tempoTeste) {
        vRef = computeZonesFromTest(distanciaTeste, tempoTeste).vRef;
      }
    } catch {
      /* ignore */
    }
    if (plan) replaceAthletePlan(slug, plan);
    if (zonas) {
      saveAthleteRecord(slug, {
        distanciaTeste,
        tempoTeste,
        vRef,
        zonesRecord: zonas,
      });
    } else {
      saveAthleteRecord(slug, {
        distanciaTeste,
        tempoTeste,
        vRef,
      });
    }
    setSaveMsg("Alterações salvas.");
    setTimeout(() => setSaveMsg(""), 5000);
  }

  function onTemplateChange(e) {
    const id = e.target.value;
    if (!id || !slug) return;
    const built = buildTemplatePlan(id);
    if (!built) return;
    const next = clonePlan(built);
    setPlan(next);
    replaceAthletePlan(slug, next);
    setSaveMsg(`Template ${TEMPLATE_META[id]?.label ?? id} aplicado.`);
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
      if (field === "km") block.km = Number(value) || 0;
      else block[field] = value;
      w.blocks[blockIdx] = block;
      return next;
    });
  }

  function addWeek() {
    setPlan((prev) => {
      const base = prev && Object.keys(prev).length ? prev : {};
      const nums = Object.keys(base).map(Number);
      const n = (nums.length ? Math.max(...nums) : 0) + 1;
      const d = weekDatesForTemplateWeek(n);
      const next = clonePlan(base);
      next[String(n)] = {
        id: `week-${n}`,
        title: `Semana ${n}`,
        phase: "Personalizado",
        blocks: [
          {
            dayLabel: "Terça",
            slug: `s${n}-terca`,
            km: 6,
            zoneKey: "z2",
            title: "Ritmo",
            description: "Aquecimento + bloco principal.",
            workoutDateISO: d.ter,
          },
          {
            dayLabel: "Quinta",
            slug: `s${n}-quinta`,
            km: 8,
            zoneKey: "z3",
            title: "Intervalado",
            description: "Bloco principal conforme orientação.",
            workoutDateISO: d.qui,
          },
          {
            dayLabel: "Sábado",
            slug: `s${n}-sabado`,
            km: 12,
            zoneKey: "z1",
            title: "Longo",
            description: "Ritmo fácil a moderado.",
            workoutDateISO: d.sab,
          },
        ],
      };
      return next;
    });
  }

  const rec = slug ? getAthleteRecord(slug) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
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
            className="bg-emerald-500 text-papa-dark px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
          >
            <Save size={14} /> Salvar alterações
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-papa-card p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <h2 className="text-xl font-black text-white italic uppercase mb-6 leading-none">
              Calculadora de Zonas
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 block">
                  Distância do Teste
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2.4, 3, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDistanciaTeste(d)}
                      className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
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

              <div>
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 block">
                  Tempo Total do Teste
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempoTeste}
                    onChange={(e) => setTempoTeste(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono outline-none focus:border-papa-blue transition-all"
                    placeholder="MM:SS"
                  />
                  <button
                    type="button"
                    onClick={calcularZonas}
                    className="p-3 bg-papa-blue rounded-2xl text-papa-dark hover:scale-105 transition-all shadow-lg shadow-papa-blue/20"
                    title="Calcular Paces"
                  >
                    <Calculator size={20} />
                  </button>
                </div>
              </div>

              {zonas && (
                <div className="pt-6 space-y-2 lg:space-y-3 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                  {Object.entries(zonas).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${value.color} shadow-[0_0_10px_currentColor]`}
                        />
                        <span className="text-[10px] font-black text-white/40 uppercase group-hover:text-white transition-colors">
                          {value.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-white tracking-tighter">
                        {value.pace ?? `${value.paceMin} - ${value.paceMax}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-papa-card p-8 rounded-[40px] border border-white/5 shadow-2xl">
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
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
                Editor em grade: ajuste km, zona e observações por semana. Use &quot;Salvar
                alterações&quot; para persistir planilha e zonas.
              </p>
            </div>

            {!plan ? (
              <div className="min-h-[200px] flex items-center justify-center text-white/30 text-sm">
                Carregando…
              </div>
            ) : (
              <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
                {weekNumbers.map((wk) => {
                  const week = plan[wk];
                  return (
                    <div
                      key={wk}
                      className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-black text-white uppercase italic tracking-tight">
                          {week.title} — {week.phase}
                        </h3>
                        <span className="text-[10px] text-white/30 font-mono">#{wk}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] min-w-[640px]">
                          <thead>
                            <tr className="text-[9px] font-black uppercase text-white/30 border-b border-white/10">
                              <th className="pb-2 pr-2">Dia</th>
                              <th className="pb-2 pr-2">Km</th>
                              <th className="pb-2 pr-2">Zona</th>
                              <th className="pb-2">Observações</th>
                            </tr>
                          </thead>
                          <tbody className="text-white/80">
                            {(week.blocks ?? []).map((b, idx) => (
                              <tr key={b.slug} className="border-b border-white/5 align-top">
                                <td className="py-2 pr-2 font-bold text-white whitespace-nowrap">
                                  {b.dayLabel}
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
    </div>
  );
}
