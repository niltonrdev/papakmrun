"use client";

import { useMemo } from "react";
import { Activity, Loader2, Plus, Trash2 } from "lucide-react";
import { formatWeekRangeLabel, normalizePlanStartMonday } from "@/lib/plan-calendar";
import { hasCheckinForBlock, isWorkoutMissed } from "@/features/checkins/missed-workout";
import {
  ZONE_KEYS,
  computeWorkoutDateByIndex,
  addBlockToPlan,
  addWeekToPlan,
  insertWeekAfterInPlan,
  removeBlockFromPlan,
  removeWeekFromPlan,
  updateBlockInPlan,
} from "@/features/coach/plan-editor-utils";
import { getWorkoutDisplayLabel } from "@/features/plans/workout-blocks";

export default function PlanSpreadsheetEditor({
  plan,
  setPlan,
  planStartDate,
  setPlanStartDate,
  loading = false,
  checkinSlugs = null,
  onCheckin = null,
  showPlanStartDate = true,
  showStatusColumn = false,
  headerExtra = null,
  toolbarExtra = null,
}) {
  const weekNumbers = useMemo(() => {
    if (!plan) return [];
    return Object.keys(plan).sort((a, b) => Number(a) - Number(b));
  }, [plan]);

  function updateBlock(weekKey, blockIdx, field, value) {
    setPlan((prev) => updateBlockInPlan(prev, weekKey, blockIdx, field, value, planStartDate));
  }

  function addBlock(weekKey) {
    setPlan((prev) => addBlockToPlan(prev, weekKey, planStartDate));
  }

  function removeBlock(weekKey, blockIdx) {
    setPlan((prev) => removeBlockFromPlan(prev, weekKey, blockIdx, planStartDate));
  }

  function addWeek() {
    setPlan((prev) => addWeekToPlan(prev, planStartDate));
  }

  function insertWeekAfter(afterWeekKey) {
    setPlan((prev) => insertWeekAfterInPlan(prev, afterWeekKey, planStartDate));
  }

  function removeWeek(weekKey) {
    setPlan((prev) => removeWeekFromPlan(prev, weekKey, planStartDate));
  }

  return (
    <div className="space-y-6">
      {headerExtra}
      <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight">
        Editor em grade: monte cada treino com aquecimento, parte principal e desaquecimento.
        {showPlanStartDate
          ? " O calendário do aluno avança automaticamente a partir da data de início."
          : null}
      </p>
      {(showPlanStartDate || toolbarExtra) && (
        <div className="flex flex-wrap gap-3 items-end">
          {showPlanStartDate && setPlanStartDate ? (
            <label className="text-[9px] font-black uppercase text-white/30">
              Início semana 1 (segunda)
              <input
                type="date"
                value={planStartDate || ""}
                onChange={(e) =>
                  setPlanStartDate(normalizePlanStartMonday(e.target.value))
                }
                className="mt-1 block rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"
              />
            </label>
          ) : null}
          {toolbarExtra}
        </div>
      )}

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
                    {planStartDate ? (
                      <p className="text-[10px] text-papa-blue/80 font-bold mt-1">
                        {formatWeekRangeLabel(planStartDate, wk)}
                      </p>
                    ) : null}
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
                        <th className="pb-2 pr-2">Treino</th>
                        <th className="pb-2 pr-2">Título</th>
                        <th className="pb-2 pr-2">Km</th>
                        <th className="pb-2 pr-2">Zona</th>
                        {showStatusColumn ? <th className="pb-2 pr-2">Status</th> : null}
                        <th className="pb-2 pr-2">Aquecimento</th>
                        <th className="pb-2 pr-2">Parte principal</th>
                        <th className="pb-2 pr-2">Desaquecimento</th>
                        <th className="pb-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      {(week.blocks ?? []).map((b, idx) => {
                        const workoutDateISO =
                          b.workoutDateISO ||
                          computeWorkoutDateByIndex(planStartDate, wk, idx);
                        const blockWithDate = { ...b, workoutDateISO };
                        const done =
                          showStatusColumn && checkinSlugs
                            ? hasCheckinForBlock(blockWithDate, checkinSlugs)
                            : false;
                        const missed =
                          showStatusColumn && checkinSlugs
                            ? isWorkoutMissed(blockWithDate, checkinSlugs)
                            : false;
                        return (
                          <tr key={b.slug} className="border-b border-white/5 align-top">
                            <td className="py-2 pr-2 font-bold text-white whitespace-nowrap">
                              {getWorkoutDisplayLabel(b, idx)}
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                value={b.title || ""}
                                onChange={(e) => updateBlock(wk, idx, "title", e.target.value)}
                                className="w-28 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-black uppercase"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={b.km}
                                onChange={(e) => updateBlock(wk, idx, "km", e.target.value)}
                                className="w-16 bg-black/30 border border-white/10 rounded-lg px-2 py-1 font-mono text-white"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={b.zoneKey}
                                onChange={(e) => updateBlock(wk, idx, "zoneKey", e.target.value)}
                                className="bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-black uppercase"
                              >
                                {ZONE_KEYS.map((zk) => (
                                  <option key={zk} value={zk} className="bg-papa-dark">
                                    {zk}
                                  </option>
                                ))}
                              </select>
                            </td>
                            {showStatusColumn ? (
                              <td className="py-2 pr-2 whitespace-nowrap">
                                {done ? (
                                  <span className="text-[9px] font-black uppercase text-emerald-400">
                                    Feito
                                  </span>
                                ) : missed ? (
                                  onCheckin ? (
                                    <button
                                      type="button"
                                      onClick={() => onCheckin(blockWithDate)}
                                      className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-all"
                                    >
                                      Marcar treino em atraso
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-black uppercase text-red-400">
                                      Treino não feito
                                    </span>
                                  )
                                ) : onCheckin ? (
                                  <button
                                    type="button"
                                    onClick={() => onCheckin(blockWithDate)}
                                    className="text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border border-papa-orange/40 text-papa-orange hover:bg-papa-orange/10 transition-all"
                                  >
                                    Marcar como treino feito
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-white/30">
                                    Pendente
                                  </span>
                                )}
                              </td>
                            ) : null}
                            <td className="py-2 pr-2 min-w-[160px]">
                              <textarea
                                value={b.warmup || ""}
                                onChange={(e) => updateBlock(wk, idx, "warmup", e.target.value)}
                                rows={3}
                                placeholder="Ex: 2 km (Z2)"
                                className="w-full min-w-[160px] bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/95 resize-y min-h-[72px] leading-relaxed"
                              />
                            </td>
                            <td className="py-2 pr-2 min-w-[180px]">
                              <textarea
                                value={b.mainPart || ""}
                                onChange={(e) => updateBlock(wk, idx, "mainPart", e.target.value)}
                                rows={3}
                                placeholder="Ex: 8x400m (Z4) + recuperação"
                                className="w-full min-w-[180px] bg-black/30 border border-papa-blue/20 rounded-lg px-3 py-2 text-sm text-white font-medium resize-y min-h-[88px] leading-relaxed"
                              />
                            </td>
                            <td className="py-2 pr-2 min-w-[160px]">
                              <textarea
                                value={b.cooldown || ""}
                                onChange={(e) => updateBlock(wk, idx, "cooldown", e.target.value)}
                                rows={3}
                                placeholder="Ex: 2 km (Z1)"
                                className="w-full min-w-[160px] bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/95 resize-y min-h-[72px] leading-relaxed"
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

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={addWeek}
          disabled={loading || !plan}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 inline-flex items-center gap-2 disabled:opacity-40"
        >
          <Activity size={14} /> Adicionar semana
        </button>
      </div>
    </div>
  );
}
