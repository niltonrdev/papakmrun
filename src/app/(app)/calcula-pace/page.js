"use client";

import { useMemo, useState } from "react";
import { Calculator, Timer } from "lucide-react";

const MODES = [
  { id: "tempo", label: "Tempo" },
  { id: "pace", label: "Pace" },
  { id: "distancia", label: "Distância" },
];

function parseDecimal(value) {
  if (value == null || value === "") return NaN;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function parsePaceToSeconds(pace) {
  const raw = String(pace || "").trim();
  if (!raw) return NaN;
  const parts = raw.split(":").map((p) => Number(p));
  if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1 && Number.isFinite(parts[0])) {
    return parts[0] * 60;
  }
  return NaN;
}

function formatPace(totalSec) {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return "—";
  const sec = Math.round(totalSec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(totalSec) {
  if (!Number.isFinite(totalSec) || totalSec < 0) return "—";
  const sec = Math.round(totalSec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}h ${String(m).padStart(2, "0")}min ${String(s).padStart(2, "0")}s`;
  }
  return `${m}min ${String(s).padStart(2, "0")}s`;
}

function timeFieldsToSeconds(hr, min, s) {
  const h = Number(hr) || 0;
  const m = Number(min) || 0;
  const sec = Number(s) || 0;
  if (h < 0 || m < 0 || sec < 0) return NaN;
  return h * 3600 + m * 60 + sec;
}

export default function CalculaPacePage() {
  const [mode, setMode] = useState("pace");
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [hr, setHr] = useState("");
  const [min, setMin] = useState("");
  const [sec, setSec] = useState("");
  const [pace, setPace] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const hint = useMemo(() => {
    if (mode === "tempo") return "Preencha distância e pace para calcular o tempo";
    if (mode === "distancia") return "Preencha pace e tempo para calcular a distância";
    return "Preencha distância e tempo para calcular o Pace";
  }, [mode]);

  function distanceInKm() {
    const value = parseDecimal(distance);
    if (!Number.isFinite(value) || value <= 0) return NaN;
    return distanceUnit === "m" ? value / 1000 : value;
  }

  function calculate() {
    setError("");
    setResult(null);

    if (mode === "pace") {
      const km = distanceInKm();
      const totalSec = timeFieldsToSeconds(hr, min, sec);
      if (!Number.isFinite(km) || km <= 0) {
        setError("Informe uma distância válida.");
        return;
      }
      if (!Number.isFinite(totalSec) || totalSec <= 0) {
        setError("Informe um tempo válido.");
        return;
      }
      setResult({
        label: "Pace",
        value: `${formatPace(totalSec / km)} /km`,
        detail: `${km.toFixed(2)} km em ${formatDuration(totalSec)}`,
      });
      return;
    }

    if (mode === "tempo") {
      const km = distanceInKm();
      const paceSec = parsePaceToSeconds(pace);
      if (!Number.isFinite(km) || km <= 0) {
        setError("Informe uma distância válida.");
        return;
      }
      if (!Number.isFinite(paceSec) || paceSec <= 0) {
        setError("Informe o pace no formato M:SS (ex: 5:20).");
        return;
      }
      const totalSec = km * paceSec;
      setResult({
        label: "Tempo",
        value: formatDuration(totalSec),
        detail: `${km.toFixed(2)} km a ${formatPace(paceSec)} /km`,
      });
      return;
    }

    const paceSec = parsePaceToSeconds(pace);
    const totalSec = timeFieldsToSeconds(hr, min, sec);
    if (!Number.isFinite(paceSec) || paceSec <= 0) {
      setError("Informe o pace no formato M:SS (ex: 5:20).");
      return;
    }
    if (!Number.isFinite(totalSec) || totalSec <= 0) {
      setError("Informe um tempo válido.");
      return;
    }
    const km = totalSec / paceSec;
    setResult({
      label: "Distância",
      value: `${km.toFixed(2)} km`,
      detail: `${formatDuration(totalSec)} a ${formatPace(paceSec)} /km`,
    });
  }

  return (
    <div className="max-w-xl mx-auto w-full min-w-0 space-y-8 pb-10">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-papa-blue/15 border border-papa-blue/30">
          <Timer className="text-papa-blue" size={22} />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-white/40 uppercase tracking-tighter">
            Ferramentas
          </h1>
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
            Calculadora de Ritmo
          </h2>
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-papa-card p-5 sm:p-7 space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMode(m.id);
                  setResult(null);
                  setError("");
                }}
                className={[
                  "relative rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-widest transition-all border",
                  active
                    ? "border-papa-blue bg-papa-blue/15 text-papa-blue shadow-[0_0_0_1px_rgba(0,209,255,0.25)]"
                    : "border-white/10 bg-white/[0.03] text-white/45 hover:text-white hover:border-white/20",
                ].join(" ")}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 space-y-5">
          <p className="text-sm text-white/55 text-center">{hint}</p>

          {mode !== "distancia" ? (
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                Distância
              </span>
              <div className="flex gap-2">
                <input
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  inputMode="decimal"
                  placeholder="00,00"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white font-mono outline-none focus:border-papa-blue/40"
                />
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-xs font-bold text-white/80 outline-none"
                >
                  <option value="km" className="bg-papa-dark">
                    quilômetros
                  </option>
                  <option value="m" className="bg-papa-dark">
                    metros
                  </option>
                </select>
              </div>
            </label>
          ) : null}

          {mode !== "pace" ? (
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                Pace
              </span>
              <input
                value={pace}
                onChange={(e) => setPace(e.target.value)}
                placeholder="5:20"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white font-mono outline-none focus:border-papa-blue/40"
              />
              <span className="text-[10px] text-white/30">Formato M:SS por km</span>
            </label>
          ) : null}

          {mode !== "tempo" ? (
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">
                Tempo
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    value={hr}
                    onChange={(e) => setHr(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white font-mono outline-none focus:border-papa-blue/40"
                  />
                  <div className="mt-1 text-center text-[10px] font-bold text-white/30">hr</div>
                </div>
                <div>
                  <input
                    value={min}
                    onChange={(e) => setMin(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white font-mono outline-none focus:border-papa-blue/40"
                  />
                  <div className="mt-1 text-center text-[10px] font-bold text-white/30">min</div>
                </div>
                <div>
                  <input
                    value={sec}
                    onChange={(e) => setSec(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-white font-mono outline-none focus:border-papa-blue/40"
                  />
                  <div className="mt-1 text-center text-[10px] font-bold text-white/30">s</div>
                </div>
              </div>
            </label>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-300 text-center">{error}</p> : null}

        {result ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">
              {result.label}
            </div>
            <div className="mt-1 text-3xl font-black text-white tabular-nums">{result.value}</div>
            <div className="mt-1 text-xs text-white/50">{result.detail}</div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={calculate}
          className="w-full rounded-2xl bg-white text-papa-dark py-4 text-sm font-black uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
        >
          <Calculator size={16} />
          Calcular
        </button>
      </div>
    </div>
  );
}
