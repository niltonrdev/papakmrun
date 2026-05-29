"use client";

function rollingMeanSeries(weekly, windowSize) {
  return weekly.map((_, i) => {
    const from = Math.max(0, i - windowSize + 1);
    const slice = weekly.slice(from, i + 1);
    return slice.reduce((s, w) => s + w.km, 0) / slice.length;
  });
}

function valuesToPath(values) {
  const n = values.length;
  if (n < 2) return "";
  const max = Math.max(...values, 0.01);
  const top = 12;
  const bot = 88;
  const h = bot - top;
  let d = "";
  values.forEach((v, i) => {
    const x = (i / (n - 1)) * 100;
    const y = bot - (v / max) * h;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return d;
}

function weekTickLabel(weekStart) {
  if (!weekStart) return "";
  const parts = weekStart.split("-");
  if (parts.length < 3) return weekStart;
  return `${parts[2]}/${parts[1]}`;
}

export default function PerformanceEvolutionChart({ weeklyKm, loading, stravaLinked = false }) {
  const hasData =
    Array.isArray(weeklyKm) &&
    weeklyKm.length > 1 &&
    weeklyKm.some((w) => w.km > 0);

  const showDemo = !stravaLinked && !hasData && !loading;

  const currentPath = hasData ? valuesToPath(weeklyKm.map((w) => w.km)) : "";
  const roll = hasData ? rollingMeanSeries(weeklyKm, 4) : null;
  const lastPath = roll ? valuesToPath(roll) : "";

  const ticks = hasData ? weeklyKm : null;

  return (
    <div className="mt-10 rounded-3xl border border-white/5 bg-papa-card p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black italic uppercase leading-none tracking-tighter text-white">
            Gráfico de Evolução
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/30">
            {hasData
              ? "Volume semanal Strava — corridas e trilhas (últimas 12 semanas)"
              : stravaLinked
                ? "Aguardando dados das suas corridas no Strava"
                : "Conecte o Strava no perfil para ver seu volume semanal"}
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-papa-blue shadow-[0_0_10px_rgba(0,209,255,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Km / semana
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-papa-orange shadow-[0_0_10px_rgba(255,107,0,0.6)]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Média 4 sem.
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 w-full animate-pulse rounded-2xl bg-white/5" />
      ) : showDemo || !hasData ? (
        <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-white/30">
            {stravaLinked
              ? "Sem volume registrado nas últimas semanas."
              : "Conecte o Strava no perfil para ver o gráfico."}
          </p>
        </div>
      ) : (
        <div className="group relative h-48 w-full">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
          >
            <defs>
              <linearGradient id="gradBluePerf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00d1ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradOrangePerf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="white"
                strokeOpacity="0.05"
                strokeWidth="0.5"
              />
            ))}

            <path d={`${lastPath} L 100 100 L 0 100 Z`} fill="url(#gradOrangePerf)" />
            <path
              d={lastPath}
              fill="none"
              stroke="#ff6b00"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.65"
            />

            <path d={`${currentPath} L 100 100 L 0 100 Z`} fill="url(#gradBluePerf)" />
            <path
              d={currentPath}
              fill="none"
              stroke="#00d1ff"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]"
            />
          </svg>

          <div
            className={`absolute -bottom-7 inset-x-0 grid gap-0.5 px-0.5 text-[8px] font-black uppercase tracking-widest text-white/25 ${
              ticks ? "grid-cols-6 sm:grid-cols-12" : "grid-cols-4"
            }`}
          >
            {ticks
              ? ticks.map((w) => (
                  <span key={w.weekStart} className="truncate text-center">
                    {weekTickLabel(w.weekStart)}
                  </span>
                ))
              : ["S1", "S2", "S3", "S4"].map((t) => (
                  <span key={t} className="text-center">
                    {t}
                  </span>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
