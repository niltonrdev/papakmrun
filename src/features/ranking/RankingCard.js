"use client";

import { useMemo } from "react";
import { buildWeeklyRanking } from "@/features/ranking/ranking.service";

export default function RankingCard() {
  const data = useMemo(() => buildWeeklyRanking({ limit: 5 }), []);
  const ranking = data.items;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">Ranking semanal</div>
          <div className="text-lg font-semibold">
            Top {ranking.length || 0} (real)
          </div>
          <div className="mt-1 text-xs text-white/50">
            Semana: {data.range.startISO} → {data.range.endISO}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/70">
          Pontos
        </div>
      </div>

      {ranking.length === 0 ? (
        <div className="mt-4 text-sm text-white/60">
          Sem check-ins na semana ainda.
        </div>
      ) : (
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
      )}

      <div className="mt-3 text-xs text-white/50">
        Pontos: 10 por check-in + esforço + 1 se tiver nota.
      </div>
    </div>
  );
}