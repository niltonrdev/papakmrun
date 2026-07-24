"use client";
import { useEffect, useMemo, useState } from "react";
import { getTodayWorkout, getWeekPlan, getWeekBlocksOrdered } from "@/features/plans/plans.service";
import CheckinModal from "@/features/checkins/CheckinModal";
import {
  isWorkoutCheckedToday,
  isWorkoutCheckedForBlock,
  getTodayCheckin,
} from "@/features/checkins/checkins.service";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getZones } from "@/features/plans/plans.service";
import RankingCard from "@/features/ranking/RankingCard";
import RaceCalendar from "@/features/events/RaceCalendar";
import Link from "next/link";
import ActivityMural from "@/features/activities/ActivityMural";
import { useBackendSyncTick, usePlanMeta } from "@/features/session/backend-sync";
import { useProfileRole } from "@/features/session/useProfileRole";
import ParqBanner from "@/features/health/ParqBanner";
import { useParqStatus } from "@/features/health/useParqStatus";
import ParqFormModal from "@/features/health/ParqFormModal";
import { readActiveWeekNumber } from "@/features/session/prefs.storage";
import { getBlockSegments, getWorkoutDisplayLabel } from "@/features/plans/workout-blocks";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";

function useWeekProgress(syncTick, currentSlug) {
  return useMemo(() => {
    void syncTick;
    const weekKey = readActiveWeekNumber();
    const week = getWeekPlan(weekKey);
    const blocks = getWeekBlocksOrdered(weekKey);
    const checkinBySlug = new Map(
      readAllCheckins().map((c) => [c.workoutSlug, c])
    );

    let completedKm = 0;
    let doneCount = 0;

    const items = blocks.map((block, idx) => {
      const done = isWorkoutCheckedForBlock(block);
      const checkin = checkinBySlug.get(block.slug);
      const plannedKm = Number(block.km) || 0;
      if (done) {
        const km =
          checkin?.planKm != null && Number.isFinite(Number(checkin.planKm))
            ? Number(checkin.planKm)
            : plannedKm;
        completedKm += km;
        doneCount += 1;
      }
      return {
        slug: block.slug,
        label: getWorkoutDisplayLabel(block, idx),
        title: block.title,
        plannedKm,
        done,
        isCurrent: block.slug === currentSlug,
      };
    });

    const totalKm = blocks.reduce((sum, b) => sum + (Number(b.km) || 0), 0);
    const progressPct = totalKm > 0 ? Math.min(100, (completedKm / totalKm) * 100) : 0;

    return {
      weekKey,
      weekTitle: week?.title ?? `Semana ${weekKey}`,
      weekPhase: week?.phase,
      items,
      completedKm,
      totalKm,
      doneCount,
      totalSessions: blocks.length,
      progressPct,
    };
  }, [syncTick, currentSlug]);
}

function WeekProgressPreview({ syncTick, currentSlug }) {
  const planMeta = usePlanMeta();
  const progress = useWeekProgress(syncTick, currentSlug);
  const rangeLabel = planMeta?.weekRanges?.[progress.weekKey] ?? null;

  const kmDoneLabel =
    progress.completedKm % 1 === 0
      ? String(progress.completedKm)
      : progress.completedKm.toFixed(1);
  const kmTotalLabel =
    progress.totalKm % 1 === 0
      ? String(progress.totalKm)
      : progress.totalKm.toFixed(1);

  return (
    <div className="bg-black/20 p-5 sm:p-6 rounded-2xl border border-white/5 flex flex-col h-full min-h-[280px]">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/35">
            Semana atual
          </div>
          <div className="text-sm font-black text-white truncate">
            {progress.weekTitle}
            {progress.weekPhase ? (
              <span className="text-white/45 font-bold"> · {progress.weekPhase}</span>
            ) : null}
          </div>
          {rangeLabel ? (
            <div className="text-[10px] text-papa-blue/70 font-bold mt-0.5">{rangeLabel}</div>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[9px] font-black uppercase text-white/30">Treinos</div>
          <div className="text-sm font-black text-white">
            {progress.doneCount}
            <span className="text-white/35">/{progress.totalSessions}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-4 mb-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mb-1">
          Km percorridos na semana
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-400 tabular-nums leading-none">
            {kmDoneLabel}
          </span>
          <span className="text-lg font-bold text-white/35">
            / {kmTotalLabel} km
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-papa-blue transition-all duration-500"
            style={{ width: `${progress.progressPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-[10px] font-bold text-white/30 text-right tabular-nums">
          {Math.round(progress.progressPct)}% do volume
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
        {progress.items.map((item) => (
          <div
            key={item.slug}
            className={[
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              item.isCurrent
                ? "border-papa-orange/40 bg-papa-orange/10"
                : item.done
                  ? "border-emerald-500/25 bg-emerald-500/5"
                  : "border-white/8 bg-white/[0.02]",
            ].join(" ")}
          >
            {item.done ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <Circle
                size={16}
                className={`shrink-0 ${item.isCurrent ? "text-papa-orange" : "text-white/20"}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-black uppercase text-white/90 truncate">
                {item.label}
              </div>
              <div className="text-[10px] text-white/45 truncate">{item.title}</div>
            </div>
            <div className="text-right shrink-0">
              <div
                className={`text-sm font-black tabular-nums ${
                  item.done ? "text-emerald-400" : "text-white/50"
                }`}
              >
                {item.plannedKm}km
              </div>
              {item.done ? (
                <div className="text-[9px] font-black uppercase text-emerald-400/70">Feito</div>
              ) : item.isCurrent ? (
                <div className="text-[9px] font-black uppercase text-papa-orange">Hoje</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuggestedWorkoutCard({ isSocial = false, workout, onDone, syncTick = 0 }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [localTick, setLocalTick] = useState(0);
  const weekProgress = useWeekProgress(syncTick + localTick, workout?.slug);

  if (!workout) return null;

  const checked = done || isWorkoutCheckedToday(workout.slug);
  const checkin = checked ? getTodayCheckin() : null;
  const segments = workout.segments || getBlockSegments(workout);
  const label = workout.workoutLabel || workout.dayLabel || "Treino";

  return (
    <div className="rounded-3xl bg-papa-card p-6 sm:p-8 border border-white/5 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div className="min-w-0">
          <span className="text-papa-orange font-bold text-[11px] sm:text-xs uppercase tracking-widest">
            Sugestão do dia
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight break-words">
            {label} · {workout.title} · {workout.km}km
          </h2>
          {!isSocial && (
            <div className="text-white/60 text-lg font-medium mt-1">
              ({workout.zoneKey?.toUpperCase()})
            </div>
          )}

          <div className="mt-4 space-y-3 text-sm sm:text-base text-white/70">
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
                  Parte principal
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
          
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button 
              onClick={() => setOpen(true)}
              disabled={checked}
              className="bg-papa-orange hover:bg-orange-600 disabled:bg-emerald-500 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-lg shadow-orange-900/40"
            >
              {checked ? "Check-in feito!" : "Check-in"}
            </button>
            <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
               <span className="text-white/30 text-[10px] uppercase block font-bold">Esforço</span>
               <span className="text-papa-blue font-bold tracking-tighter">
                 {checkin?.effort != null ? `${checkin.effort}/5` : "—"}
               </span>
            </div>
          </div>
        </div>

        <WeekProgressPreview syncTick={syncTick + localTick} currentSlug={workout.slug} />
      </div>
      
      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-papa-orange to-orange-400 shadow-[0_0_10px_rgba(255,107,0,0.5)] transition-all duration-500"
          style={{ width: `${weekProgress.progressPct}%` }}
        />
      </div>

      <CheckinModal
        open={open}
        onClose={() => setOpen(false)}
        workout={workout}
        onSaved={() => {
          setDone(true);
          setLocalTick((t) => t + 1);
          onDone?.();
        }}
      />
    </div>
  );
}
const ZONE_EFFORT = {
  z1: "1–2",
  z2: "3–4",
  z3: "5–6",
  z4: "7–8",
  z5: "9–10",
};

const ZONE_DOT = {
  z1: "bg-blue-400",
  z2: "bg-emerald-400",
  z3: "bg-yellow-400",
  z4: "bg-orange-400",
  z5: "bg-red-400",
};

function TrainingZonesList() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    setZones(getZones());
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-black italic uppercase tracking-tighter">Zonas de Treino</h3>
        <span className="text-[10px] text-white/20 font-bold border border-white/10 px-2 py-1 rounded-md tracking-widest text-white">Z1–Z5</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {zones.map((z) => (
          <div key={z.key} className="p-5 rounded-3xl bg-papa-card border border-white/5 flex items-start hover:border-white/10 transition-colors">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                   <span className={`w-2 h-2 rounded-full ${ZONE_DOT[z.key] ?? "bg-white/30"} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                   <span className="text-white font-black text-sm uppercase">{z.key}</span>
                 </div>
                 <span className="text-white/30 text-[10px] font-bold">Esforço {ZONE_EFFORT[z.key] ?? "—"}</span>
              </div>
              <div className="text-white/60 text-xs font-bold mb-1">{z.label}</div>
              <div className="text-white font-mono text-xs">Pace: {z.paceMin}—{z.paceMax} /km</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function DashboardPage() {
  const syncTick = useBackendSyncTick();
  const { isSocial, planPending, hasPlanAccess } = useProfileRole();
  const planMeta = usePlanMeta();
  const hasPrescribedPlan = Boolean(planMeta?.hasPrescribedPlan);
  const { needsParq, pendingReview, refresh: refreshParq } = useParqStatus();
  const [parqOpen, setParqOpen] = useState(false);
  const [suggestedWorkout, setSuggestedWorkout] = useState(null);
  const [stravaLinked, setStravaLinked] = useState(null);

  useEffect(() => {
    setSuggestedWorkout(getTodayWorkout());
  }, [syncTick]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/strava/status", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setStravaLinked(false);
          return;
        }
        const j = await res.json();
        if (!cancelled) setStravaLinked(Boolean(j?.linked));
      } catch {
        if (!cancelled) setStravaLinked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncTick]);

  const showTodayCard = hasPlanAccess && hasPrescribedPlan && Boolean(suggestedWorkout);
  const showCycleComplete =
    hasPlanAccess && hasPrescribedPlan && !suggestedWorkout;

  // Layout:
  // Mobile (até lg): Mural → Treino → Ranking → Calendário → Zonas
  // Desktop (lg+): coluna principal [Mural, Treino, Zonas] + lateral [Ranking, Calendário]
  return (
    <div className="max-w-7xl mx-auto w-full min-w-0">
      <ParqFormModal
        open={parqOpen}
        onSubmitted={() => {
          setParqOpen(false);
          refreshParq();
        }}
      />
      {planPending && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Seu cadastro como <strong>aluno planilha</strong> está em análise. Por enquanto você usa o
          modo <strong>social</strong> (feed e Strava). Um professor liberará a planilha em breve.
        </div>
      )}
      <ParqBanner
        needsParq={needsParq}
        pendingReview={pendingReview}
        onOpenForm={() => setParqOpen(true)}
      />
      <header className="mb-8 sm:mb-10">
        <h1 className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-tighter">Papakm</h1>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white break-words leading-tight">
          Dashboard do Aluno
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          {stravaLinked === false && (
            <a
              href="/api/strava/connect"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] sm:text-xs font-black uppercase text-white/80 hover:bg-white/10"
            >
              Conectar Strava
            </a>
          )}
          {stravaLinked === true && (
            <span className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] sm:text-xs font-black uppercase text-emerald-300">
              Strava conectado
            </span>
          )}
          <Link
            href="/perfil"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] sm:text-xs font-black uppercase text-white/50 hover:text-white"
          >
            Perfil / Strava
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="order-1 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <ActivityMural />
        </div>

        {showTodayCard && (
          <div className="order-2 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-2">
            <SuggestedWorkoutCard
              isSocial={isSocial}
              workout={suggestedWorkout}
              syncTick={syncTick}
              onDone={() => setSuggestedWorkout(getTodayWorkout())}
            />
          </div>
        )}

        {showCycleComplete && (
          <div className="order-2 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-2">
            <div className="rounded-3xl bg-papa-card p-6 sm:p-8 border border-emerald-500/25 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
                  <PartyPopper className="text-emerald-400" size={28} />
                </div>
                <div className="min-w-0">
                  <span className="text-emerald-400 font-bold text-[11px] sm:text-xs uppercase tracking-widest">
                    Ciclo concluído
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight">
                    Parabéns — você finalizou o ciclo da planilha!
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-white/65 leading-relaxed max-w-xl">
                    Não há treinos pendentes nesta planilha. Entre em contato com o seu professor
                    para a confecção de uma nova planilha e continuar a evolução.
                  </p>
                  <Link
                    href="/perfil"
                    className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-black uppercase text-white/80 hover:bg-white/10"
                  >
                    Ir ao perfil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="order-3 lg:order-none lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:row-span-2 flex flex-col gap-6 sm:gap-8">
          <RankingCard />
          <RaceCalendar />
        </div>

        {hasPlanAccess && hasPrescribedPlan && (
          <div
            className={`order-4 lg:order-none lg:col-span-8 lg:col-start-1 ${
              showTodayCard || showCycleComplete ? "lg:row-start-3" : "lg:row-start-2"
            }`}
          >
            <TrainingZonesList />
          </div>
        )}
      </div>
    </div>
  );
}