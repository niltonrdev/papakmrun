"use client";
import { useEffect, useMemo, useState } from "react";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { BarChart3, Activity, HeartPulse, ChevronRight, Trophy, Timer, Medal, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useBackendSyncTick } from "@/features/session/backend-sync";
import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { useProfileRole } from "@/features/session/useProfileRole";
import SocialPlanilhaUpsell from "@/features/social/SocialPlanilhaUpsell";
import PerformanceEvolutionChart from "@/features/strava/PerformanceEvolutionChart";

function WorkoutPreviewCard({ block }) {
  const zone = getZoneByKey(block.zoneKey);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="shrink-0 sm:w-24">
        <div className="inline-flex items-center gap-2 rounded-xl bg-papa-blue/10 border border-papa-blue/20 px-3 py-2">
          <CalendarDays size={14} className="text-papa-blue shrink-0" />
          <span className="text-xs font-black uppercase text-papa-blue tracking-wide">
            {block.dayLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-base sm:text-lg font-black text-white">{block.title}</div>
        {block.description ? (
          <p className="text-sm text-white/55 mt-1 leading-relaxed line-clamp-2">
            {block.description}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1.5">
        <div className="text-2xl font-black text-white leading-none">
          {block.km}
          <span className="text-sm text-white/40 ml-1 font-bold">km</span>
        </div>
        <span
          className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${zoneClasses(block.zoneKey)}`}
        >
          {zone?.label ?? block.zoneKey.toUpperCase()}
        </span>
        {zone ? (
          <span className="text-[10px] font-mono text-white/45">
            {zone.paceMin} – {zone.paceMax} /km
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, unit }) {
  return (
    <div className="bg-papa-card p-4 sm:p-5 rounded-3xl border border-white/5 flex flex-col justify-between min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="text-papa-blue w-3 h-3 opacity-50 shrink-0" />
        <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-black tracking-widest truncate">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-black text-white truncate">{value}</span>
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
  const { hasPlanAccess, loading: roleLoading } = useProfileRole();
  const [activeWeek, setActiveWeek] = useState("1");
  const [strava, setStrava] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const week = useMemo(() => getWeekPlan(activeWeek), [activeWeek, syncTick]);

  const weekSummary = useMemo(() => {
    const blocks = week?.blocks ?? [];
    const totalKm = blocks.reduce((sum, b) => sum + (Number(b.km) || 0), 0);
    return { sessions: blocks.length, totalKm };
  }, [week]);

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
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-20 w-full min-w-0">
      <header>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic uppercase break-words leading-tight">
          Performance
        </h2>
      </header>

      {/* 1. KPIs Superiores (Volume, Sessões, etc) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* 2. Planilha semanal — visão principal do aluno */}
      {roleLoading ? (
        <div
          className="h-72 animate-pulse rounded-3xl border border-white/5 bg-white/5"
          aria-hidden
        />
      ) : !hasPlanAccess ? (
        <SocialPlanilhaUpsell />
      ) : (
        <div className="bg-papa-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col gap-3 min-w-0">
              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                Planilha Semanal
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-xs text-white/70 font-black uppercase tracking-widest">
                  {week.title}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                <span className="text-xs text-papa-blue font-bold uppercase tracking-widest">
                  Fase: {week.phase}
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-black uppercase text-white/60">
                  {weekSummary.sessions} {weekSummary.sessions === 1 ? "treino" : "treinos"}
                </span>
                <span className="inline-flex items-center rounded-xl bg-papa-orange/10 border border-papa-orange/20 px-3 py-1.5 text-[11px] font-black uppercase text-papa-orange">
                  {weekSummary.totalKm.toFixed(weekSummary.totalKm % 1 ? 1 : 0)} km na semana
                </span>
              </div>
            </div>

            <Link
              href="/planilha/detalhes"
              className="bg-papa-blue hover:bg-papa-blue/90 text-papa-dark text-[10px] font-black uppercase px-6 py-3 rounded-2xl flex items-center gap-2 transition-all self-start shrink-0"
            >
              Abrir planilha completa <ChevronRight size={14} />
            </Link>
          </div>

          <div className="p-6 sm:p-8 space-y-3">
            {(week.blocks ?? []).length > 0 ? (
              week.blocks.map((b) => <WorkoutPreviewCard key={b.slug} block={b} />)
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/40">
                Nenhum treino cadastrado para esta semana.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Gráfico de evolução */}
      <PerformanceEvolutionChart
        weeklyKm={insights?.weeklyKm}
        loading={Boolean(strava?.linked && insightsLoading)}
      />

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