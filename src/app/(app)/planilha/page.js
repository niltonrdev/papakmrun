"use client";
import { useEffect, useState } from "react";
import { getWeekPlan } from "@/features/plans/plans.service";
import { BarChart3, Activity, HeartPulse, ChevronRight, Trophy, Timer, Medal } from "lucide-react";
import Link from "next/link";
import { useBackendSyncTick } from "@/features/session/backend-sync";
import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { useProfileRole } from "@/features/session/useProfileRole";
import SocialPlanilhaUpsell from "@/features/social/SocialPlanilhaUpsell";
import PerformanceEvolutionChart from "@/features/strava/PerformanceEvolutionChart";

function StatCard({ title, value, icon: Icon, unit }) {
  return (
    <div className="bg-papa-card p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="text-papa-blue w-3 h-3 opacity-50" />
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        {unit && <span className="text-[10px] text-white/30 font-bold uppercase">{unit}</span>}
      </div>
    </div>
  );
}

function PersonalRecord({ label, time, pace, date }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-papa-orange/10 flex items-center justify-center text-papa-orange">
          <Medal size={18} />
        </div>
        <div>
          <div className="text-sm font-black text-white">{label}</div>
          <div className="text-[10px] text-white/30 font-bold uppercase">{date}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-black text-white">{time}</div>
        <div className="text-[10px] text-white/30 font-bold">{pace} /km</div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const syncTick = useBackendSyncTick();
  const { isSocial, loading: roleLoading } = useProfileRole();
  const [activeWeek, setActiveWeek] = useState("1");
  const [strava, setStrava] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const week = getWeekPlan(activeWeek);

  useEffect(() => {
    setActiveWeek(readActiveWeekNumber());
  }, [syncTick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/strava/summary", { credentials: "include" });
        const j = await res.json();
        if (!cancelled) setStrava(j);
      } catch {
        if (!cancelled) setStrava(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!strava?.linked) {
        setInsights(null);
        setInsightsLoading(false);
        return;
      }
      setInsightsLoading(true);
      try {
        const res = await fetch("/api/strava/insights", { credentials: "include" });
        const j = await res.json();
        if (!cancelled && res.ok && j?.linked) setInsights(j);
        else if (!cancelled) setInsights(null);
      } catch {
        if (!cancelled) setInsights(null);
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [strava?.linked]);

  const volKm =
    strava?.linked && strava?.totals?.ytdRunKm != null
      ? String(strava.totals.ytdRunKm)
      : strava?.linked && strava?.totals?.recentRunKm != null
        ? String(strava.totals.recentRunKm)
        : "128";
  const sessionsVal =
    strava?.linked && strava?.totals?.allRunSessions != null
      ? String(strava.totals.allRunSessions)
      : "14";

  const paceVal =
    strava?.linked && insights?.avgPaceRecentRuns
      ? insights.avgPaceRecentRuns
      : strava?.linked
        ? "—"
        : "5:12";

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black text-white italic uppercase italic">Performance</h2>
      </header>

      {/* 1. KPIs Superiores (Volume, Sessões, etc) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={strava?.linked ? "Volume (Strava)" : "Volume (demo)"}
          value={volKm}
          icon={BarChart3}
          unit="km"
        />
        <StatCard
          title={strava?.linked ? "Sessões (total Strava)" : "Sessões"}
          value={sessionsVal}
          icon={Activity}
        />
        <StatCard title="Status Saúde" value="Apto" icon={HeartPulse} />
        <StatCard
          title={strava?.linked ? "Pace médio (recentes)" : "Pace Médio"}
          value={paceVal}
          icon={BarChart3}
          unit="/km"
        />
      </div>
      {strava && !strava.linked && strava.message && (
        <p className="text-xs text-white/40 -mt-6">
          {strava.message}{" "}
          <a href="/perfil" className="text-papa-blue underline underline-offset-2">
            Ligar no perfil
          </a>
        </p>
      )}

      {/* 2. Gráfico de Evolução */}
      <PerformanceEvolutionChart
        weeklyKm={insights?.weeklyKm}
        loading={Boolean(strava?.linked && insightsLoading)}
      />

      {/* 3. Pré-visualização da Planilha (Club: tabela; Social: upsell) */}
      {roleLoading ? (
        <div
          className="h-72 animate-pulse rounded-3xl border border-white/5 bg-white/5"
          aria-hidden
        />
      ) : isSocial ? (
        <SocialPlanilhaUpsell />
      ) : (
        <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                Planilha Semanal
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                  {week.title}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/10" />
                <p className="text-[10px] text-papa-blue font-bold uppercase tracking-widest">
                  Fase: {week.phase}
                </p>
              </div>
            </div>

            <Link
              href="/planilha/detalhes"
              className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl flex items-center gap-2 transition-all self-start border border-white/5"
            >
              Abrir Planilha Full <ChevronRight size={14} />
            </Link>
          </div>

          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-white/5">
                {week.blocks.map((b) => (
                  <tr key={b.slug}>
                    <td className="py-4 text-[10px] font-black text-white/30 uppercase w-20">
                      {b.dayLabel}
                    </td>
                    <td className="py-4 text-xs font-bold text-white">
                      {b.title} • {b.km}km
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/5 text-papa-blue border border-white/10">
                        {b.zoneKey}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Previsões e Melhores Marcas (Estilo Strava) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Previsões */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Timer size={16} /> Referência de desempenho
          </h3>
          <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider">
            Estimativas a partir das suas melhores corridas no Strava (faixas de distância), não modelo
            preditivo.
          </p>
          <div className="grid grid-cols-1 gap-4">
            {strava?.linked && Array.isArray(insights?.predictions) && insights.predictions.length > 0 ? (
              insights.predictions.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-between rounded-3xl border border-white/5 bg-papa-card p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-papa-orange font-black italic text-papa-orange">
                      {p.label}
                    </div>
                    <div>
                      <div className="text-2xl font-black text-white">{p.time}</div>
                      <div className="text-xs font-bold text-white/40">Pace: {p.pace} /km</div>
                    </div>
                  </div>
                  <div className="max-w-[44%] text-right">
                    <div className="text-[10px] font-bold leading-snug text-white/35">{p.hint}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-white/5 bg-papa-card p-6 text-center text-xs text-white/40">
                {strava?.linked
                  ? "Conecte mais corridas no Strava ou aguarde o carregamento dos insights."
                  : "Conecte o Strava no perfil para ver referências por distância."}
              </div>
            )}
          </div>
        </div>

        {/* Recordes Pessoais */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={16} /> Melhores Marcas
          </h3>
          <div className="space-y-3">
            {strava?.linked &&
            Array.isArray(insights?.personalRecords) &&
            insights.personalRecords.length > 0 ? (
              insights.personalRecords.map((pr) => (
                <PersonalRecord
                  key={pr.label}
                  label={pr.label}
                  time={pr.time}
                  pace={pr.pace}
                  date={pr.date}
                />
              ))
            ) : (
              <>
                <PersonalRecord label="15 km" time="1:22:03" pace="5:28" date="21 de fev. de 2026" />
                <PersonalRecord label="10 km" time="47:58" pace="4:48" date="31 de jan. de 2026" />
                <PersonalRecord label="400 m" time="1:18" pace="3:15" date="5 de nov. de 2025" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}