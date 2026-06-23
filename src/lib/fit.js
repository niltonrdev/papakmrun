import { Encoder, Profile } from "@garmin/fitsdk";
import { ZONES as DEFAULT_ZONES } from "@/features/plans/mockWeek";

function parsePaceToSeconds(pace) {
  if (!pace || typeof pace !== "string") return null;
  const m = pace.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const ss = Number(m[2]);
  if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
  return mm * 60 + ss;
}

function paceToSpeedMmps(pace) {
  const s = parsePaceToSeconds(pace);
  if (!s) return null;
  return Math.round((1000 / s) * 1000);
}

function clampUInt32(n) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(0xffffffff, x));
}

function zoneRecord(zones, key) {
  const Z = zones && typeof zones === "object" ? zones : DEFAULT_ZONES;
  return Z[key] ?? DEFAULT_ZONES[key] ?? null;
}

function zonePaceBounds(zone) {
  if (!zone) return null;
  if (zone.paceMin && zone.paceMax) {
    return { paceMin: zone.paceMin, paceMax: zone.paceMax };
  }
  if (typeof zone.pace === "string" && zone.pace.includes("-")) {
    const [a, b] = zone.pace.split("-").map((p) => p.trim());
    if (a && b) return { paceMin: a, paceMax: b };
  }
  return null;
}

function speedRangeForZone(zone) {
  const bounds = zonePaceBounds(zone);
  if (!bounds) return { hasSpeed: false, speedLow: 0, speedHigh: 0 };
  const lowMmps = paceToSpeedMmps(bounds.paceMax);
  const highMmps = paceToSpeedMmps(bounds.paceMin);
  if (!Number.isFinite(lowMmps) || !Number.isFinite(highMmps)) {
    return { hasSpeed: false, speedLow: 0, speedHigh: 0 };
  }
  return {
    hasSpeed: true,
    speedLow: clampUInt32(Math.min(lowMmps, highMmps)),
    speedHigh: clampUInt32(Math.max(lowMmps, highMmps)),
  };
}

/** Distância do passo em centímetros (padrão Garmin FIT). */
function kmToDurationCm(km) {
  const meters = Math.max(100, Math.round(Number(km) * 1000));
  return clampUInt32(meters * 100);
}

/**
 * Monta passos estruturados para exportação Garmin (aquecimento / principal / desaquecimento).
 */
export function buildWorkoutStepsFromBlock(block, zones) {
  const totalKm = Number(block?.km ?? 0);
  if (!Number.isFinite(totalKm) || totalKm <= 0) {
    return [
      {
        name: block?.title || "Corrida",
        km: 5,
        zone: zoneRecord(zones, block?.zoneKey || "z2"),
        intensity: "active",
      },
    ];
  }

  const mainZone = zoneRecord(zones, block?.zoneKey || "z2");
  const warmupZone = zoneRecord(zones, "z2");
  const cooldownZone = zoneRecord(zones, "z1");

  if (totalKm < 4) {
    return [
      {
        name: block?.title || "Corrida",
        km: totalKm,
        zone: mainZone,
        intensity: "active",
      },
    ];
  }

  const mainKm = Math.max(0.5, totalKm - 2);
  return [
    {
      name: "Aquecimento",
      km: 1,
      zone: warmupZone,
      intensity: "warmup",
    },
    {
      name: block?.title || "Corrida",
      km: mainKm,
      zone: mainZone,
      intensity: "active",
    },
    {
      name: "Desaquecimento",
      km: 1,
      zone: cooldownZone,
      intensity: "cooldown",
    },
  ];
}

/**
 * FIT workout (running) compatível com Garmin Connect / relógio.
 * Usa @garmin/fitsdk (strings e enums corretos; fit-encoder quebrava nomes dos passos).
 */
export function buildWorkoutFitFromBlock(block, zones) {
  const steps = buildWorkoutStepsFromBlock(block, zones);
  const totalKm = Number(block?.km ?? 0) || steps.reduce((a, s) => a + s.km, 0);
  const description =
    typeof block?.description === "string" ? block.description.trim().slice(0, 80) : "";
  const name = `${block?.title || "Treino de corrida"} · ${totalKm}km`.trim();
  const wktName = description ? `${name} — ${description}`.slice(0, 47) : name.slice(0, 47);

  const encoder = new Encoder();

  encoder.writeMesg({
    mesgNum: Profile.MesgNum.FILE_ID,
    type: "workout",
    manufacturer: "development",
    product: 0,
    timeCreated: new Date(),
  });

  encoder.writeMesg({
    mesgNum: Profile.MesgNum.FILE_CREATOR,
    softwareVersion: 100,
  });

  encoder.writeMesg({
    mesgNum: Profile.MesgNum.WORKOUT,
    wktName,
    sport: "running",
    numValidSteps: steps.length,
  });

  steps.forEach((step, index) => {
    const { hasSpeed, speedLow, speedHigh } = speedRangeForZone(step.zone);
    const mesg = {
      mesgNum: Profile.MesgNum.WORKOUT_STEP,
      messageIndex: index,
      wktStepName: String(step.name).slice(0, 47),
      durationType: "distance",
      durationValue: kmToDurationCm(step.km),
      intensity: step.intensity,
      targetValue: 0,
      customTargetValueLow: hasSpeed ? speedLow : 0,
      customTargetValueHigh: hasSpeed ? speedHigh : 0,
      targetType: hasSpeed ? "speed" : "open",
    };
    encoder.writeMesg(mesg);
  });

  return encoder.close();
}
