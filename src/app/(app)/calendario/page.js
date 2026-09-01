"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPlanWorkouts, getZoneByKey } from "@/features/plans/plans.service";
import { getBlockSegments, getWorkoutDisplayLabel } from "@/features/plans/workout-blocks";
import { zoneClasses } from "@/features/plans/zones.ui";
import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { checkinAppliesToBlock } from "@/features/checkins/checkin-match";

function formatISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameISO(a, b) {
  return a === b;
}

function monthTitle(d) {
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function weekdayShort(i) {
  // pt-BR: dom, seg, ter, qua, qui, sex, sáb
  const arr = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return arr[i] ?? "";
}

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
        {z.paceMin} — {z.paceMax}
      </span>
    </span>
  );
}

function DayCell({
  day,
  isCurrentMonth,
  isToday,
  items,
  doneCount,
  onSelect,
  isSelected,
}) {
  return (
    <button
      onClick={() => onSelect(day)}
      className={[
        "group text-left rounded-2xl border border-white/10 bg-white/5 p-3 transition",
        "hover:bg-white/10",
        isSelected ? "ring-2 ring-white/20" : "",
        !isCurrentMonth ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <div
          className={[
            "text-sm font-semibold",
            isToday ? "text-white" : "text-white/80",
          ].join(" ")}
        >
          {day.getDate()}
        </div>

        {items.length > 0 && (
          <div className="text-xs text-white/60">
            {doneCount}/{items.length}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-1">
        {items.slice(0, 2).map((w) => (
          <div
            key={`${w.workoutDateISO}-${w.slug}`}
            className="rounded-lg border border-white/10 bg-black/20 px-2 py-1"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-xs font-semibold text-white/90">
                {w.title}
              </div>
              <div className="text-[11px] text-white/60">{w.km} km</div>
            </div>
          </div>
        ))}

        {items.length > 2 && (
          <div className="text-xs text-white/50">+{items.length - 2} treino(s)</div>
        )}
      </div>
    </button>
  );
}

export default function CalendarPage() {
  // Evita hydration mismatch: só calcula datas “reais” depois do mount
  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState(null); // Date do mês visível
  const [selectedISO, setSelectedISO] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCursor(now);
    setSelectedISO(formatISODate(now));
  }, []);

  const workouts = useMemo(() => {
    void refreshKey;
    return getAllPlanWorkouts().filter((b) => b.workoutDateISO);
  }, [mounted, refreshKey]);

  const checkins = useMemo(() => {
    // re-render quando clicar em “Atualizar”
    void refreshKey;
    return readAllCheckins();
  }, [refreshKey]);

  const checkinsByDate = useMemo(() => {
    const m = new Map();
    for (const c of checkins) {
      if (!m.has(c.date)) m.set(c.date, []);
      m.get(c.date).push(c);
    }
    return m;
  }, [checkins]);

  const workoutsByDate = useMemo(() => {
    const m = new Map();
    for (const w of workouts) {
      if (!m.has(w.workoutDateISO)) m.set(w.workoutDateISO, []);
      m.get(w.workoutDateISO).push(w);
    }
    return m;
  }, [workouts]);

  const monthDays = useMemo(() => {
    if (!mounted || !cursor) return [];
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);

    // grid começa no domingo anterior (ou no próprio)
    const startGrid = addDays(start, -start.getDay());
    // grid termina no sábado depois do fim do mês
    const endGrid = addDays(end, 6 - end.getDay());

    const days = [];
    for (let d = new Date(startGrid); d <= endGrid; d = addDays(d, 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [mounted, cursor]);

  const todayISO = useMemo(() => {
    if (!mounted) return null;
    return formatISODate(new Date());
  }, [mounted]);

  const selectedDayWorkouts = useMemo(() => {
    if (!selectedISO) return [];
    return workoutsByDate.get(selectedISO) ?? [];
  }, [selectedISO, workoutsByDate]);

  const selectedDayCheckins = useMemo(() => {
    if (!selectedISO) return [];
    return checkinsByDate.get(selectedISO) ?? [];
  }, [selectedISO, checkinsByDate]);

  function goPrevMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function selectDay(day) {
    setSelectedISO(formatISODate(day));
  }

  function isWorkoutDone(workout) {
    return checkins.some((c) => checkinAppliesToBlock(workout, c));
  }

  if (!mounted || !cursor) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Calendário</h1>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
          Carregando calendário…
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calendário</h1>
          <div className="text-sm text-white/60">
            Treinos da semana mock + check-ins salvos.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
          >
            Atualizar
          </button>

          <button
            onClick={goPrevMonth}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            aria-label="Mês anterior"
          >
            ◀
          </button>

          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm">
            {monthTitle(cursor)}
          </div>

          <button
            onClick={goNextMonth}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            aria-label="Próximo mês"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="px-2 text-xs text-white/50">
            {weekdayShort(i)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day) => {
          const iso = formatISODate(day);
          const isCurrentMonth = day.getMonth() === cursor.getMonth();
          const isToday = todayISO ? sameISO(iso, todayISO) : false;
          const items = workoutsByDate.get(iso) ?? [];
          const doneCount = items.filter((w) => isWorkoutDone(w)).length;

          return (
            <DayCell
              key={iso}
              day={day}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              items={items}
              doneCount={doneCount}
              onSelect={selectDay}
              isSelected={selectedISO === iso}
            />
          );
        })}
      </div>

      {/* Day details */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/60">Dia selecionado</div>
            <div className="text-lg font-semibold">{selectedISO}</div>
          </div>

          <div className="text-sm text-white/60">
            Check-ins: <span className="text-white/90">{selectedDayCheckins.length}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {selectedDayWorkouts.length === 0 ? (
            <div className="text-sm text-white/60">Sem treino planejado nesse dia (mock).</div>
          ) : (
            selectedDayWorkouts.map((w) => {
              const done = isWorkoutDone(w);
              const label = getWorkoutDisplayLabel(w, Math.max((Number(w.workoutNumber) || 1) - 1, 0));
              const segments = getBlockSegments(w);
              return (
                <div
                  key={`${w.workoutDateISO}-${w.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-white/60">{label}</div>
                      <div className="text-lg font-semibold">
                        {w.title} <span className="text-white/60 font-normal">{w.km} km</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ZonePill zoneKey={w.zoneKey} />
                      <span
                        className={[
                          "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
                          done
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            : "border-white/10 bg-white/5 text-white/70",
                        ].join(" ")}
                      >
                        {done ? "Concluído ✅" : "Pendente"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-white/70">
                    {segments.warmup ? <p>Aquecimento: {segments.warmup}</p> : null}
                    {segments.mainPart ? <p>Principal: {segments.mainPart}</p> : null}
                    {segments.cooldown ? <p>Desaquecimento: {segments.cooldown}</p> : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-xs text-white/40">
        v1: calendário mensal (mock) + highlight de treinos + status via localStorage.
      </div>
    </section>
  );
}