"use client";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { useState } from "react";
import CheckinModal from "@/features/checkins/CheckinModal";
import { isWorkoutCheckedToday } from "@/features/checkins/checkins.service";



function ZonePill({ zoneKey }) {
  const z = getZoneByKey(zoneKey);
  if (!z) return null;

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
        zoneClasses(zoneKey),
      ].join(" ")}
    >
      <span className="font-semibold">{z.label}</span>
      <span className="opacity-80">
        {z.paceMin} – {z.paceMax}
      </span>
    </span>
  );
}

function WorkoutCard({ item }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  // Na primeira render, verifica se já tem check-in hoje
  // (V1: só check-in "hoje", não por data do treino)
  const checked = done || isWorkoutCheckedToday(item.slug);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-semibold">
            {item.dayLabel}
          </div>
          <div>
            <div className="text-base font-semibold">{item.title}</div>
            <div className="text-xs text-white/60">{item.km} km</div>
          </div>
        </div>

        <ZonePill zoneKey={item.zoneKey} />
      </div>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">
        {item.description}
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
        workout={item}
        onSaved={() => setDone(true)}
      />
    </article>
  );
}

export default function PlanilhaPage() {
  const week = getWeekPlan();

  const totalKm = week.blocks.reduce((sum, b) => sum + (b.km ?? 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Planilha</h1>
          <p className="text-sm text-white/60">{week.title}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
          Total: <span className="font-semibold">{totalKm} km</span>
        </div>
      </div>

      <div className="grid gap-3">
        {week.blocks.map((b) => (
          <WorkoutCard key={b.slug} item={b} />
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/60">
        Em breve: semanas 2+ e check-in real (com histórico e ranking).
      </div>
    </section>
  );
}
