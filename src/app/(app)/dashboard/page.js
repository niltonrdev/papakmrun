"use client";
import { useEffect, useState } from "react";
import { getTodayWorkout, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import CheckinModal from "@/features/checkins/CheckinModal";
import { isWorkoutCheckedToday, getTodayCheckin } from "@/features/checkins/checkins.service";
import { getZones } from "@/features/plans/plans.service";
import RankingCard from "@/features/ranking/RankingCard";
import RaceCalendar from "@/features/events/RaceCalendar";
import Link from "next/link";
import ActivityMural from "@/features/activities/ActivityMural";
import { useBackendSyncTick } from "@/features/session/backend-sync";
import { useProfileRole } from "@/features/session/useProfileRole";

function TodayWorkoutCard({ isSocial = false }) {
  useBackendSyncTick();
  const w = getTodayWorkout();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  // Se não houver treino, mostramos um card de "Descanso" estilizado para não quebrar o layout
  if (!w) return (
    <div className="rounded-3xl bg-papa-card p-6 sm:p-8 border border-white/5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-papa-orange font-bold text-[11px] sm:text-xs uppercase tracking-widest">Treino de Hoje</span>
        <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight break-words">Dia de Descanso</h2>
        <p className="text-white/40 mt-1 italic text-sm">Aproveite para recuperar as energias! 🏃‍♂️</p>
      </div>
      <div className="hidden md:flex gap-1 h-12 items-end">
         {[20, 15, 25, 20, 30].map((h, i) => (
           <div key={i} style={{ height: `${h}%` }} className="w-1.5 bg-white/10 rounded-full" />
         ))}
      </div>
    </div>
  );

  const checked = done || isWorkoutCheckedToday(w.slug);
  const todayCheckin = checked ? getTodayCheckin() : null;

  return (
    <div className="rounded-3xl bg-papa-card p-6 sm:p-8 border border-white/5 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
        <div className="min-w-0">
          <span className="text-papa-orange font-bold text-[11px] sm:text-xs uppercase tracking-widest">Treino de Hoje</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 leading-tight break-words">
            {w.title} · {w.km}km
          </h2>
          {!isSocial && (
            <div className="text-white/60 text-lg font-medium mt-1">({w.zoneKey.toUpperCase()})</div>
          )}

          <p className="text-white/40 mt-4 flex items-center gap-2 text-sm italic">
            <span className="text-papa-blue font-bold">⚡</span>{" "}
            {isSocial
              ? "Aluno em modo rede: curta o Feed e, quando fizer o PapaKM Club, suas zonas entram no jogo."
              : "Obs: 10' acima do pace alvo"}
          </p>
          
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
                 {todayCheckin?.effort != null ? `${todayCheckin.effort}/5` : "—"}
               </span>
            </div>
          </div>
        </div>

        {/* Gráfico de Ritmo (Visualizador de barras) */}
        <div className="hidden md:block bg-black/20 p-6 rounded-2xl border border-white/5">
           <div className="flex justify-between items-end gap-1 h-24">
              {[35, 55, 45, 90, 65, 80, 50].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                   <div 
                    style={{ height: `${h}%` }} 
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      i === 3 ? 'bg-papa-orange shadow-[0_0_15px_rgba(255,107,0,0.6)]' : 'bg-papa-blue/30'
                    }`}
                   />
                </div>
              ))}
           </div>
           <div className="mt-3 text-center text-[10px] font-black text-white/20 uppercase tracking-widest">Ritmo Semanal</div>
        </div>
      </div>
      
      {/* Barra de progresso estética na base do card */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
        <div className="h-full bg-gradient-to-r from-papa-orange to-orange-400 w-1/3 shadow-[0_0_10px_rgba(255,107,0,0.5)]"></div>
      </div>

      <CheckinModal open={open} onClose={() => setOpen(false)} workout={w} onSaved={() => setDone(true)} />
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
  useBackendSyncTick();
  const { isSocial, planPending, hasPlanAccess } = useProfileRole();

  return (
    <div className="max-w-7xl mx-auto w-full min-w-0">
      {planPending && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Seu cadastro como <strong>aluno planilha</strong> está em análise. Por enquanto você usa o
          modo <strong>social</strong> (feed e Strava). Um professor liberará a planilha em breve.
        </div>
      )}
      <header className="mb-8 sm:mb-10">
        <h1 className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-tighter">Papakm</h1>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white break-words leading-tight">
          Dashboard do Aluno
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="/api/strava/connect"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] sm:text-xs font-black uppercase text-white/80 hover:bg-white/10"
          >
            Conectar Strava
          </a>
          <Link
            href="/perfil"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-[11px] sm:text-xs font-black uppercase text-white/50 hover:text-white"
          >
            Perfil / Strava
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Coluna Principal */}
        <div className="lg:col-span-8 space-y-8">
          <ActivityMural />
          <TodayWorkoutCard isSocial={isSocial} />

          {hasPlanAccess && <TrainingZonesList />}
        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-4 space-y-8">
          <RankingCard />
          <RaceCalendar />
        </div>
      </div>
    </div>
  );
}