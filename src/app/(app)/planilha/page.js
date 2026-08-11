"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getWeekPlan, getWeekBlocksOrdered, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import {
  BarChart3,
  Activity,
  HeartPulse,
  ChevronRight,
  Trophy,
  Timer,
  Medal,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import CheckinModal from "@/features/checkins/CheckinModal";
import UndoCheckinButton from "@/features/checkins/UndoCheckinButton";
import { isWorkoutCheckedForBlock } from "@/features/checkins/checkins.service";
import { isWorkoutMissed } from "@/features/checkins/missed-workout";
import { getBlockSegments, getWorkoutDisplayLabel } from "@/features/plans/workout-blocks";
import {
  getPlanMetaFromSync,
  useBackendSyncTick,
  usePlanMeta,
} from "@/features/session/backend-sync";
import { readActiveWeekNumber, writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { formatWeekRangeLabel } from "@/lib/plan-calendar";
import { useProfileRole } from "@/features/session/useProfileRole";
import SocialPlanilhaUpsell from "@/features/social/SocialPlanilhaUpsell";
import EmptyPlanPlaceholder from "@/features/plans/EmptyPlanPlaceholder";
import PerformanceEvolutionChart from "@/features/strava/PerformanceEvolutionChart";

const EMPTY_PERSONAL_RECORDS = [
  { label: "15 km", time: "—", pace: "—", date: "—" },
  { label: "10 km", time: "—", pace: "—", date: "—" },
  { label: "400 m", time: "—", pace: "—", date: "—" },
];

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function WorkoutPreviewCard({ block, blockIndex = 0, onCheckin, onUndoCheckin, refreshKey }) {
  void refreshKey;
  const statusReady = useIsClient();
  const zone = getZoneByKey(block.zoneKey);
  const done = statusReady && isWorkoutCheckedForBlock(block);
  const missed = statusReady && !done && isWorkoutMissed(block);
  const segments = getBlockSegments(block);
  const label = getWorkoutDisplayLabel(block, blockIndex);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-xl bg-papa-blue/10 border border-papa-blue/20 px-3 py-2 shrink-0">
            <CalendarDays size={14} className="text-papa-blue shrink-0" />
            <span className="text-xs font-black uppercase text-papa-blue tracking-wide">
              {label}
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-black text-white">{block.title}</h4>
        </div>

        {done ? (
          <UndoCheckinButton workoutSlug={block.slug} onUndone={() => onUndoCheckin?.(block)} />
        ) : missed ? (
          <button
            type="button"
            onClick={() => onCheckin?.(block)}
            className="text-[11px] font-black uppercase px-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-all shrink-0"
          >
            Marcar treino em atraso
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCheckin?.(block)}
            className="text-[11px] font-black uppercase px-4 py-2.5 rounded-xl border border-papa-orange/40 text-papa-orange hover:bg-papa-orange/10 transition-all shrink-0"
          >
            Marcar como treino feito
          </button>
        )}
      </div>

      <div className="text-sm sm:text-base text-white/70 leading-relaxed space-y-2">
        {segments.warmup ? (
          <p className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
            <span className="text-papa-blue font-black uppercase text-[10px] mr-2 block mb-1">
              Aquecimento
            </span>
            {segments.warmup}
          </p>
        ) : null}
        {segments.mainPart ? (
          <p className="rounded-xl bg-papa-blue/10 border border-papa-blue/20 px-4 py-3 text-white font-medium">
            <span className="text-papa-blue font-black uppercase text-[10px] mr-2 block mb-1">
              Principal
            </span>
            {segments.mainPart}
          </p>
        ) : null}
        {segments.cooldown ? (
          <p className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3">
            <span className="text-papa-blue font-black uppercase text-[10px] mr-2 block mb-1">
              Desaquecimento
            </span>
            {segments.cooldown}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-white/5">
        <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-center sm:text-left">
          <div className="text-[10px] font-black uppercase text-white/35 tracking-widest">
            Distância
          </div>
          <div className="text-2xl font-black text-white tabular-nums mt-0.5">
            {block.km}
            <span className="text-sm text-white/40 ml-1 font-bold">km</span>
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-center sm:text-left">
          <div className="text-[10px] font-black uppercase text-white/35 tracking-widest">
            Zona
          </div>
          <div className="mt-1.5">
            <span
              className={`inline-flex text-[11px] font-black uppercase px-3 py-1.5 rounded-lg ${zoneClasses(block.zoneKey)}`}
            >
              {block.zoneKey?.toUpperCase()} · {zone?.label ?? "—"}
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-center sm:text-left">
          <div className="text-[10px] font-black uppercase text-white/35 tracking-widest">
            Pace
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white/80 mt-1 tabular-nums">
            {zone ? `${zone.paceMin} – ${zone.paceMax}` : "—"}
            <span className="text-xs text-white/35 font-sans font-bold ml-1">/km</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, unit, empty = false, valueClassName = "" }) {
  const isEmpty = empty || value === "—";
  return (
    <div className="bg-papa-card p-4 sm:p-5 rounded-3xl border border-white/5 flex flex-col justify-between min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon
          className={`w-3 h-3 shrink-0 ${isEmpty ? "text-white/15" : "text-papa-blue opacity-50"}`}
        />
        <span className="text-[9px] sm:text-[10px] text-white/30 uppercase font-black tracking-widest truncate">
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`text-xl sm:text-2xl font-black truncate ${
            isEmpty ? "text-white/25" : valueClassName || "text-white"
          }`}
        >
          {value}
        </span>
        {unit && !isEmpty ? (
          <span className="text-[10px] text-white/30 font-bold uppercase">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

function PersonalRecord({ label, time, pace, date, empty = false }) {
  const muted = empty ? "text-white/25" : "text-white";
  const mutedSub = empty ? "text-white/20" : "text-white/30";

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            empty ? "bg-white/5 text-white/20" : "bg-papa-orange/10 text-papa-orange"
          }`}
        >
          <Medal size={18} />
        </div>
        <div>
          <div className={`text-sm font-black ${muted}`}>{label}</div>
          <div className={`text-[10px] font-bold uppercase ${mutedSub}`}>{date}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-mono font-black ${muted}`}>{time}</div>
        <div className={`text-[10px] font-bold ${mutedSub}`}>
          {pace === "—" ? "—" : `${pace} /km`}
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const syncTick = useBackendSyncTick();
  const planMeta = usePlanMeta();
  const { hasPlanAccess, isStaff, loading: roleLoading, healthLabel } = useProfileRole();
  const [activeWeek, setActiveWeek] = useState("1");
  const [strava, setStrava] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [checkinWorkout, setCheckinWorkout] = useState(null);
  const [checkinRefresh, setCheckinRefresh] = useState(0);
  const hasPrescribedPlan = Boolean(planMeta?.hasPrescribedPlan);
  const week = useMemo(() => (hasPrescribedPlan ? getWeekPlan(activeWeek) : null), [activeWeek, syncTick, hasPrescribedPlan]);
  const blocks = useMemo(
    () => (hasPrescribedPlan ? getWeekBlocksOrdered(activeWeek) : []),
    [activeWeek, syncTick, hasPrescribedPlan]
  );

  const weekSummary = useMemo(() => {
    const blocks = week?.blocks ?? [];
    const totalKm = blocks.reduce((sum, b) => sum + (Number(b.km) || 0), 0);
    return { sessions: blocks.length, totalKm };
  }, [week]);

  useEffect(() => {
    const meta = getPlanMetaFromSync();
    const aw = meta?.activeWeek || readActiveWeekNumber();
    setActiveWeek(aw);
    writeActiveWeekNumber(aw);
  }, [syncTick]);

  const weekRangeLabel = useMemo(() => {
    const meta = getPlanMetaFromSync();
    return (
      meta?.weekRanges?.[activeWeek] ||
      (meta?.planStartDate
        ? formatWeekRangeLabel(meta.planStartDate, activeWeek)
        : null)
    );
  }, [activeWeek, syncTick]);

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

  const stravaLinked = Boolean(strava?.linked);

  const volKm =
    stravaLinked && strava?.totals?.ytdRunKm != null
      ? String(strava.totals.ytdRunKm)
      : stravaLinked && strava?.totals?.recentRunKm != null
        ? String(strava.totals.recentRunKm)
        : "—";
  const sessionsVal =
    stravaLinked && strava?.totals?.allRunSessions != null
      ? String(strava.totals.allRunSessions)
      : "—";

  const paceVal =
    stravaLinked && insights?.avgPaceRecentRuns ? insights.avgPaceRecentRuns : "—";

  const healthValueClass =
    healthLabel === "Apto"
      ? "text-emerald-400"
      : healthLabel === "Não apto"
        ? "text-red-400"
        : "";

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
          title="Volume (Strava)"
          value={volKm}
          icon={BarChart3}
          unit="km"
          empty={!stravaLinked}
        />
        <StatCard
          title="Sessões (Strava)"
          value={sessionsVal}
          icon={Activity}
          empty={!stravaLinked}
        />
        <StatCard
          title="Status Saúde"
          value={roleLoading ? "…" : healthLabel}
          icon={HeartPulse}
          empty={!roleLoading && healthLabel === "—"}
          valueClassName={healthValueClass}
        />
        <StatCard
          title="Pace médio (recentes)"
          value={paceVal}
          icon={BarChart3}
          unit="/km"
          empty={!stravaLinked || paceVal === "—"}
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
      ) : isStaff ? null : !hasPlanAccess ? (
        <SocialPlanilhaUpsell />
      ) : !hasPrescribedPlan ? (
        <EmptyPlanPlaceholder />
      ) : (
        <div className="bg-papa-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex flex-col gap-3 min-w-0">
              <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                Planilha Semanal
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-xs text-white/70 font-black uppercase tracking-widest">
                  {week?.title ?? `Semana ${activeWeek}`}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                <span className="text-xs text-papa-blue font-bold uppercase tracking-widest">
                  Fase: {week?.phase ?? "—"}
                </span>
                {weekRangeLabel ? (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/20 hidden sm:block" />
                    <span className="text-[10px] text-white/45 font-bold normal-case">
                      {weekRangeLabel}
                    </span>
                  </>
                ) : null}
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
            {blocks.length > 0 ? (
              blocks.map((b, idx) => (
                <WorkoutPreviewCard
                  key={b.slug}
                  block={b}
                  blockIndex={idx}
                  onCheckin={setCheckinWorkout}
                  onUndoCheckin={() => setCheckinRefresh((x) => x + 1)}
                  refreshKey={checkinRefresh + syncTick}
                />
              ))
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
        loading={Boolean(stravaLinked && insightsLoading)}
        stravaLinked={stravaLinked}
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
              EMPTY_PERSONAL_RECORDS.map((pr) => (
                <PersonalRecord
                  key={pr.label}
                  label={pr.label}
                  time={pr.time}
                  pace={pr.pace}
                  date={pr.date}
                  empty
                />
              ))
            )}
          </div>
        </div>
      </div>

      <CheckinModal
        open={!!checkinWorkout}
        onClose={() => setCheckinWorkout(null)}
        workout={checkinWorkout}
        onSaved={() => setCheckinRefresh((x) => x + 1)}
      />
    </div>
  );
}