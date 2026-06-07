"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRaceDateBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}`;
}

export default function RaceCalendar() {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/coach/group-races", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setRaces([]);
          return;
        }
        const j = await res.json();
        if (cancelled) return;
        const today = todayISO();
        const upcoming = (j.items || [])
          .filter((r) => r.raceDate && String(r.raceDate).slice(0, 10) >= today)
          .sort((a, b) => String(a.raceDate).localeCompare(String(b.raceDate)));
        setRaces(upcoming);
      } catch {
        if (!cancelled) setRaces([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Calendário de Provas</h3>
        <Calendar className="text-papa-blue w-5 h-5" />
      </div>

      {loading ? (
        <div className="text-sm text-white/50">Carregando provas…</div>
      ) : races.length === 0 ? (
        <div className="text-sm text-white/50">
          Nenhuma prova agendada no momento. Seu professor publicará as próximas corridas do grupo.
        </div>
      ) : (
        <div className="space-y-4">
          {races.map((race) => (
            <div
              key={race.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"
            >
              <div>
                <div className="font-bold text-white">{race.title}</div>
                <div className="text-xs text-white/50">
                  {formatRaceDateBR(race.raceDate)}
                  {race.location ? ` · ${race.location}` : ""}
                </div>
                {race.description ? (
                  <div className="text-[11px] text-white/40 mt-1">{race.description}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
