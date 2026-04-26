"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getWeekPlan,
  getAllWeekNumbers,
  getZones,
  getZoneByKey,
} from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { estimateTimeForKm, formatDurationFromSeconds } from "@/features/plans/pace.utils";
import { readActiveWeekNumber, writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { isWorkoutCheckedForBlock } from "@/features/checkins/checkins.service";
import CheckinModal from "@/features/checkins/CheckinModal";
import Link from "next/link";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { pullWeekPlanFromApi, useBackendSyncTick } from "@/features/session/backend-sync";
import { useProfileRole } from "@/features/session/useProfileRole";
import SocialPlanilhaUpsell from "@/features/social/SocialPlanilhaUpsell";

export default function PlanilhaDetalhesPage() {
  const { isSocial, loading: roleLoading } = useProfileRole();
  const syncTick = useBackendSyncTick();
  const [activeWeek, setActiveWeek] = useState("1");
  const [mounted, setMounted] = useState(false);
  const [checkinWorkout, setCheckinWorkout] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [athleteName, setAthleteName] = useState("Aluno");

  useEffect(() => {
    setMounted(true);
    setActiveWeek(readActiveWeekNumber());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return;
        const j = await res.json();
        const name =
          j?.profile?.display_name?.trim() ||
          (j?.user?.email ? String(j.user.email).split("@")[0] : "Aluno");
        if (!cancelled && name) setAthleteName(name);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      await pullWeekPlanFromApi(activeWeek);
      if (!cancelled) setRefresh((x) => x + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWeek, mounted, syncTick]);

  const weekNumbers = useMemo(() => {
    void refresh;
    void syncTick;
    return getAllWeekNumbers();
  }, [refresh, syncTick]);

  const week = useMemo(() => {
    void refresh;
    void syncTick;
    return getWeekPlan(activeWeek);
  }, [activeWeek, refresh, syncTick]);

  const zones = useMemo(() => {
    void refresh;
    void syncTick;
    return getZones();
  }, [refresh, syncTick]);

  function selectWeek(num) {
    setActiveWeek(num);
    writeActiveWeekNumber(num);
  }

  const totals = useMemo(() => {
    const blocks = week?.blocks ?? [];
    let km = 0;
    const timeSecs = [];
    for (const b of blocks) {
      km += Number(b.km) || 0;
      const z = getZoneByKey(b.zoneKey);
      const t = estimateTimeForKm(b.km, z?.paceMin, z?.paceMax);
      if (t !== "—") {
        const parts = t.split(":");
        if (parts.length === 2) {
          timeSecs.push(
            (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0)
          );
        }
      }
    }
    const totalSec = timeSecs.reduce((a, s) => a + s, 0);
    return {
      km,
      timeLabel: totalSec ? formatDurationFromSeconds(totalSec) : "—",
    };
  }, [week]);

  if (roleLoading) {
    return (
      <div className="mx-auto max-w-7xl py-24 text-center text-sm text-white/40">
        Carregando…
      </div>
    );
  }

  if (isSocial) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 pb-10">
        <Link
          href="/planilha"
          className="flex items-center gap-2 text-xs font-black uppercase text-white/40 hover:text-white"
        >
          <ChevronLeft size={16} /> Voltar para Performance
        </Link>
        <SocialPlanilhaUpsell />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Link
          href="/planilha"
          className="text-white/40 hover:text-white flex items-center gap-2 text-xs font-black uppercase"
        >
          <ChevronLeft size={16} /> Voltar para Performance
        </Link>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {weekNumbers.map((num) => (
            <button
              key={num}
              onClick={() => selectWeek(num)}
              className={`px-6 py-2 rounded-2xl font-black text-xs uppercase transition-all border ${
                activeWeek === num
                  ? "bg-papa-blue text-papa-dark border-papa-blue shadow-[0_0_15px_rgba(0,209,255,0.3)]"
                  : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
              }`}
            >
              Semana {num}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-papa-card p-8 rounded-3xl border border-white/5 flex flex-col justify-center text-center">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">
            PLANILHA {String(athleteName).toUpperCase()} - OBJETIVO SUB20 5KM
          </h3>
          <div className="space-y-1 text-sm text-white/60 font-medium italic">
            <p>Ritmos são referências.</p>
            <p>Priorize execução correta.</p>
            <p>Descanso faz parte do treino.</p>
            <p className="text-papa-orange font-bold mt-2">
              Qualquer dor persistente me avise.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 bg-papa-card p-6 rounded-3xl border border-white/5">
          <div className="bg-purple-600 text-center py-1 rounded-t-xl mb-2">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              Zonas de Treinamento
            </span>
          </div>
          <div className="space-y-1">
            {zones.map((z) => (
              <div
                key={z.key}
                className="grid grid-cols-3 items-center text-[10px] font-black uppercase"
              >
                <div
                  className={`col-span-2 p-2 rounded-l-lg ${zoneClasses(z.key)} border-r-0`}
                >
                  {z.label}
                </div>
                <div className="bg-white/5 p-2 rounded-r-lg border border-white/10 text-white/60 text-center font-mono tracking-tighter">
                  {z.paceMin} - {z.paceMax}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="bg-papa-blue/10 p-5 border-b border-white/5 text-center">
          <h2 className="text-xl font-black text-white italic uppercase tracking-widest">
            {week.title} — {week.phase}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/40 uppercase">
                <th className="p-4 border-r border-white/5 w-32">Dados</th>
                {week.blocks.map((b) => (
                  <th key={b.slug} className="p-4 border-r border-white/5 text-white">
                    <div>{b.dayLabel}</div>
                    {mounted &&
                      (() => {
                        const done = isWorkoutCheckedForBlock(b);
                        return (
                          <button
                            type="button"
                            onClick={() => !done && setCheckinWorkout(b)}
                            className={`mt-2 text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all ${
                              done
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : "border-papa-orange/40 text-papa-orange hover:bg-papa-orange/10"
                            }`}
                          >
                            {done ? (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Feito
                              </span>
                            ) : (
                              "Check-in"
                            )}
                          </button>
                        );
                      })()}
                    <a
                      href={`/api/workouts/fit?slug=${encodeURIComponent(b.slug)}`}
                      className="mt-2 inline-flex items-center justify-center rounded-xl border border-papa-blue/40 bg-papa-blue/10 px-3 py-1.5 text-[9px] font-black uppercase text-papa-blue hover:bg-papa-blue/20"
                    >
                      Exportar
                    </a>
                  </th>
                ))}
                <th className="p-4 text-papa-blue">Total</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr className="border-b border-white/5 align-top">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">
                  Descrição
                </td>
                {week.blocks.map((b) => (
                  <td key={b.slug} className="p-4 border-r border-white/5">
                    <div className="text-[11px] leading-relaxed space-y-1 text-white/70">
                      {b.description.split(". ").map((line, i) => (
                        <p key={i} className="flex gap-2 italic">
                          <span className="text-papa-blue text-[8px] mt-1">•</span>{" "}
                          {line}
                        </p>
                      ))}
                    </div>
                  </td>
                ))}
                <td className="p-4" />
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">
                  Distância
                </td>
                {week.blocks.map((b) => (
                  <td
                    key={b.slug}
                    className="p-4 border-r border-white/5 text-center text-xl font-black text-white"
                  >
                    {b.km}km
                  </td>
                ))}
                <td className="p-4 text-center font-black text-papa-blue text-lg">
                  {totals.km.toFixed(2)} km
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">
                  Zona
                </td>
                {week.blocks.map((b) => (
                  <td
                    key={b.slug}
                    className={`p-4 border-r border-white/5 text-center ${zoneClasses(b.zoneKey)}`}
                  >
                    <span className="text-[10px] font-black uppercase">{b.zoneKey}</span>
                  </td>
                ))}
                <td className="p-4" />
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">
                  Pace
                </td>
                {week.blocks.map((b) => {
                  const z = getZoneByKey(b.zoneKey);
                  return (
                    <td
                      key={b.slug}
                      className="p-4 border-r border-white/5 text-center font-mono font-bold text-white/60"
                    >
                      {z ? `${z.paceMin} - ${z.paceMax}` : "—"}
                    </td>
                  );
                })}
                <td className="p-4" />
              </tr>
              <tr>
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">
                  Tempo
                </td>
                {week.blocks.map((b) => {
                  const z = getZoneByKey(b.zoneKey);
                  const t = z
                    ? estimateTimeForKm(b.km, z.paceMin, z.paceMax)
                    : "—";
                  return (
                    <td
                      key={b.slug}
                      className="p-4 border-r border-white/5 text-center font-mono font-bold text-papa-orange"
                    >
                      {t}
                    </td>
                  );
                })}
                <td className="p-4 text-center font-mono font-black text-white/30 text-[10px]">
                  {totals.timeLabel}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <CheckinModal
        open={!!checkinWorkout}
        onClose={() => setCheckinWorkout(null)}
        workout={checkinWorkout}
        onSaved={() => setRefresh((x) => x + 1)}
      />
    </div>
  );
}
