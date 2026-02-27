"use client";

import { useEffect, useState } from "react";
import { getWeeklyRankingDemoTop5 } from "./ranking.service";

export default function RankingCard() {
  const [data, setData] = useState(null);

  function load() {
    try {
      const res = getWeeklyRankingDemoTop5();
      setData(res);
    } catch {
      setData({ range: null, items: [] });
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-white/70">Ranking semanal</div>
        <div className="text-lg font-semibold">Carregando...</div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-white/70">Ranking semanal</div>
          <div className="text-lg font-semibold">Top 5 (real)</div>
          {data.range ? (
            <div className="mt-1 text-xs text-white/50">
              Semana: {data.range.startISO} — {data.range.endISO}
            </div>
          ) : null}
        </div>

        <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
          Pontos (V1)
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {data.items.length === 0 ? (
          <div className="text-white/60">
            Sem check-ins nesta semana ainda. Faça um check-in na Planilha 😉
          </div>
        ) : (
          data.items.map((u, idx) => (
            <div
              key={u.name}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-semibold">
                  {idx + 1}
                </div>

                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-white/60">
                    {u.workouts} treinos • {u.kmTotal}km
                  </div>
                </div>
              </div>

              <div className="text-right font-semibold">{u.points}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 text-xs text-white/50">
        Em breve: pontuação real com consistência + histórico.
      </div>
    </article>
  );
}