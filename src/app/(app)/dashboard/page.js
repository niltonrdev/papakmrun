"use client";
import { getTodayWorkout, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { useState } from "react";
import CheckinModal from "@/features/checkins/CheckinModal";
import { isWorkoutCheckedToday, getTodayCheckin } from "@/features/checkins/checkins.service";



function TodayCard() {
  const w = getTodayWorkout();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (!w) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70">
          Hoje não tem treino planejado (mock). 👍
        </div>
        <div className="mt-2 text-xs text-white/50">
          Treinos mock: Terça, Quinta e Sábado.
        </div>
      </div>
    );
  }

  const z = getZoneByKey(w.zoneKey);
  const checked = done || isWorkoutCheckedToday(w.slug);
  const todayCheckin = getTodayCheckin();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm text-white/60">Treino de hoje</div>
          <div className="text-lg font-semibold">
            {w.dayLabel} • {w.title} • {w.km} km
          </div>
          {todayCheckin && (
            <div className="mt-1 text-xs text-emerald-200/90">
              Concluído ✅ • esforço {todayCheckin.effort}/5
            </div>
          )}
        </div>

        {z && (
          <div
            className={[
              "rounded-full px-3 py-1 text-xs",
              zoneClasses(w.zoneKey),
            ].join(" ")}
          >
            {z.label} • {z.paceMin}-{z.paceMax}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">
        {w.description}
      </p>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={checked}
          className={[
            "rounded-xl border px-3 py-2 text-sm",
            checked
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10",
          ].join(" ")}
        >
          {checked ? "Concluído ✅" : "Check-in"}
        </button>
      </div>

      <CheckinModal
        open={open}
        onClose={() => setOpen(false)}
        workout={w}
        onSaved={() => setDone(true)}
      />
    </div>
  );
}
  function RankingCard() {
    const ranking = [
      { name: "Nilton", points: 42, note: "3 treinos • 26km" },
      { name: "Ana", points: 38, note: "3 treinos • 24km" },
      { name: "Bruno", points: 31, note: "2 treinos • 18km" },
      { name: "Carla", points: 25, note: "2 treinos • 14km" },
      { name: "Diego", points: 18, note: "1 treino • 10km" },
    ];

    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">Ranking semanal</div>
            <div className="text-lg font-semibold">Top 5 (mock)</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
            Pontos (demo)
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {ranking.map((p, idx) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-semibold">
                  {idx + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-white/60">{p.note}</div>
                </div>
              </div>

              <div className="text-sm font-semibold">{p.points}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-white/50">
          Em breve: pontuação real baseada em check-ins + consistência.
        </div>
      </div>
    );
  }

  export default function DashboardPage() {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <TodayCard />

        <RankingCard />

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/70">
            Aqui vai entrar: mural de atividades e ranking semanal.
          </div>
        </div>
      </section>
    );
  }

