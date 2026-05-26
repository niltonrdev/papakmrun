"use client";

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { readAllCheckins } from "@/features/checkins/checkins.storage";

const DAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
const DAY_FULL = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

function buildWeek(startDate) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    out.push({
      date: d,
      iso: isoDate(d),
      label: DAY_LABELS[i],
      full: DAY_FULL[i],
    });
  }
  return out;
}

export default function ActivityMural() {
  const [serverCheckinDates, setServerCheckinDates] = useState(null);
  const [stravaDates, setStravaDates] = useState(null);
  const [localCheckinDates, setLocalCheckinDates] = useState([]);

  useEffect(() => {
    const checkins = readAllCheckins();
    setLocalCheckinDates(checkins.map((c) => c.date).filter(Boolean));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/checkins?limit=60", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setServerCheckinDates([]);
          return;
        }
        const j = await res.json();
        if (cancelled) return;
        const dates = Array.isArray(j.items)
          ? j.items.map((i) => i.date).filter(Boolean)
          : [];
        setServerCheckinDates(dates);
      } catch {
        if (!cancelled) setServerCheckinDates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/strava/feed", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setStravaDates([]);
          return;
        }
        const j = await res.json();
        if (cancelled) return;
        const dates = Array.isArray(j.activities)
          ? j.activities.map((a) => a.dateISO).filter(Boolean)
          : [];
        setStravaDates(dates);
      } catch {
        if (!cancelled) setStravaDates([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const week = useMemo(() => buildWeek(startOfWeekMonday()), []);

  const doneDates = useMemo(() => {
    const set = new Set();
    const fromServer = serverCheckinDates ?? [];
    const fromLocal = serverCheckinDates && serverCheckinDates.length > 0 ? [] : localCheckinDates;
    [...fromServer, ...fromLocal, ...(stravaDates ?? [])].forEach((iso) => {
      if (iso) set.add(iso);
    });
    return set;
  }, [serverCheckinDates, localCheckinDates, stravaDates]);

  const todayIso = isoDate(new Date());
  const doneCount = week.reduce((acc, d) => (doneDates.has(d.iso) ? acc + 1 : acc), 0);

  return (
    <div className="rounded-3xl bg-papa-card p-5 sm:p-6 border border-white/5 mb-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <span className="text-white/40 text-[11px] sm:text-xs uppercase font-bold tracking-widest">
            Mural de Atividades
          </span>
          <h3 className="text-white font-bold text-base sm:text-lg">Semana</h3>
        </div>
        <span className="shrink-0 bg-papa-blue/10 text-papa-blue text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full border border-papa-blue/20">
          {doneCount}/7 feitos
        </span>
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3 max-w-md">
        {week.map((dia) => {
          const done = doneDates.has(dia.iso);
          const isToday = dia.iso === todayIso;
          return (
            <div key={dia.iso} className="flex flex-col items-center gap-2">
              <div
                title={`${dia.full} · ${dia.iso}${done ? " · concluído" : ""}`}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done
                    ? "bg-papa-blue border-papa-blue shadow-[0_0_15px_rgba(0,209,255,0.4)]"
                    : isToday
                      ? "border-papa-orange/60 bg-papa-orange/10"
                      : "border-white/10 bg-transparent"
                }`}
              >
                {done ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : isToday ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-papa-orange" />
                ) : null}
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold ${
                  isToday ? "text-papa-orange" : done ? "text-white/80" : "text-white/40"
                }`}
              >
                {dia.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
