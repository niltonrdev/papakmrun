import { paceToSecondsPerKm } from "./pace.utils";

function formatPaceFromSpeed(speedKmH) {
  if (speedKmH <= 0) return "0:00";
  const paceDecimal = 60 / speedKmH;
  const pMin = Math.floor(paceDecimal);
  let pSec = Math.round((paceDecimal - pMin) * 60);
  if (pSec === 60) {
    return `${pMin + 1}:00`;
  }
  return `${pMin}:${pSec < 10 ? "0" : ""}${pSec}`;
}

function paceRangeString(slowSpeed, fastSpeed) {
  const slowPace = formatPaceFromSpeed(slowSpeed);
  const fastPace = formatPaceFromSpeed(fastSpeed);
  return `${fastPace} - ${slowPace}`;
}

/**
 * @param {number} distanciaKm
 * @param {string} tempoMMSS e.g. "12:45"
 * @returns {{ vRef: number, zonesRecord: Record<string, { label: string, color: string, pace: string, paceMin: string, paceMax: string }> }}
 */
export function computeZonesFromTest(distanciaKm, tempoMMSS) {
  const [min, sec] = String(tempoMMSS)
    .split(":")
    .map((n) => Number(String(n).trim()));
  if (Number.isNaN(min) || Number.isNaN(sec)) {
    throw new Error("Tempo inválido. Use MM:SS.");
  }
  const tempoDecimalMin = min + sec / 60;
  const vTeste = (distanciaKm / tempoDecimalMin) * 60;
  const vRef = vTeste;

  const z1 = paceRangeString(vRef * 0.78, vRef * 0.72);
  const z2 = paceRangeString(vRef * 0.85, vRef * 0.79);
  const z3 = paceRangeString(vRef * 0.92, vRef * 0.86);
  const z4 = paceRangeString(vRef * 1.0, vRef * 0.93);
  const z5 = paceRangeString(vRef * 1.1, vRef * 1.01);

  const splitRange = (paceStr) => {
    const parts = String(paceStr).split(" - ").map((p) => p.trim());
    const a = parts[0] || "";
    const b = parts[1] || a;
    const sa = paceToSecondsPerKm(a);
    const sb = paceToSecondsPerKm(b);
    if (!sa || !sb) return { paceMin: a, paceMax: b };
    return sa <= sb ? { paceMin: a, paceMax: b } : { paceMin: b, paceMax: a };
  };

  const zonesRecord = {
    z1: {
      label: "Z1 - Regenerativo",
      color: "bg-blue-500",
      pace: z1,
      ...splitRange(z1),
    },
    z2: {
      label: "Z2 - Fácil",
      color: "bg-emerald-500",
      pace: z2,
      ...splitRange(z2),
    },
    z3: {
      label: "Z3 - Moderado",
      color: "bg-yellow-500",
      pace: z3,
      ...splitRange(z3),
    },
    z4: {
      label: "Z4 - Limiar",
      color: "bg-orange-500",
      pace: z4,
      ...splitRange(z4),
    },
    z5: {
      label: "Z5 - Vo2Max",
      color: "bg-red-600",
      pace: z5,
      ...splitRange(z5),
    },
  };

  return { vRef, zonesRecord };
}
