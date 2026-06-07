import { FitEncoder, FitConstants, FitMessages, Message } from "fit-encoder";
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

function paceToSpeedMps(pace) {
  const s = parsePaceToSeconds(pace);
  if (!s) return null;
  return 1000 / s;
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

function speedRangeForZone(zone) {
  const vLow = paceToSpeedMps(zone?.paceMax);
  const vHigh = paceToSpeedMps(zone?.paceMin);
  if (!Number.isFinite(vLow) || !Number.isFinite(vHigh)) {
    return { hasSpeed: false };
  }
  return {
    hasSpeed: true,
    speedLow: clampUInt32(Math.min(vLow, vHigh) * 1000),
    speedHigh: clampUInt32(Math.max(vLow, vHigh) * 1000),
  };
}

function kmToDurationValue(km) {
  const meters = Math.max(100, Math.round(Number(km) * 1000));
  return clampUInt32(meters * 100);
}

const ZONE_ORDER = ["z1", "z2", "z3", "z4", "z5"];

function progressiveZones(baseKey, zones, count) {
  const idx = Math.max(0, ZONE_ORDER.indexOf(baseKey));
  const out = [];
  for (let i = 0; i < count; i++) {
    const key = ZONE_ORDER[Math.min(idx + i, ZONE_ORDER.length - 1)];
    out.push(zoneRecord(zones, key));
  }
  return out;
}

/**
 * Monta passos estruturados (aquecimento / blocos / desaquecimento) no estilo Garmin Connect.
 */
export function buildWorkoutStepsFromBlock(block, zones) {
  const totalKm = Number(block?.km ?? 0);
  if (!Number.isFinite(totalKm) || totalKm <= 0) {
    return [
      {
        name: block?.title || "Corrida",
        km: 5,
        zone: zoneRecord(zones, block?.zoneKey || "z2"),
        intensity: FitConstants.intensity.active,
      },
    ];
  }

  const mainZone = zoneRecord(zones, block?.zoneKey || "z2");
  const warmupZone = zoneRecord(zones, "z2");
  const cooldownZone = zoneRecord(zones, "z1");
  const steps = [];

  if (totalKm >= 4) {
    steps.push({
      name: "Aquecimento",
      km: 1,
      zone: warmupZone,
      intensity: FitConstants.intensity.warmup,
    });

    const mainKm = Math.max(0.5, totalKm - 2);
    if (mainKm >= 6) {
      const segKm = Math.round((mainKm / 3) * 100) / 100;
      const segZones = progressiveZones(block?.zoneKey || "z2", zones, 3);
      let assigned = 0;
      for (let i = 0; i < 3; i++) {
        const isLast = i === 2;
        const km = isLast ? Math.max(0.1, mainKm - assigned) : segKm;
        assigned += km;
        steps.push({
          name: "Corrida",
          km,
          zone: segZones[i] || mainZone,
          intensity: FitConstants.intensity.active,
        });
      }
    } else {
      steps.push({
        name: block?.title || "Corrida",
        km: mainKm,
        zone: mainZone,
        intensity: FitConstants.intensity.active,
      });
    }

    steps.push({
      name: "Desaquecimento",
      km: 1,
      zone: cooldownZone,
      intensity: FitConstants.intensity.cooldown,
    });
  } else {
    steps.push({
      name: block?.title || "Corrida",
      km: totalKm,
      zone: mainZone,
      intensity: FitConstants.intensity.active,
    });
  }

  return steps;
}

/**
 * FIT workout (running) estruturado para Garmin Connect / relógio.
 */
export function buildWorkoutFitFromBlock(block, zones) {
  const steps = buildWorkoutStepsFromBlock(block, zones);
  const totalKm = Number(block?.km ?? 0) || steps.reduce((a, s) => a + s.km, 0);
  const name = `${block?.title || "Treino de corrida"} · ${totalKm}km`.trim();

  class WorkoutEncoder extends FitEncoder {
    constructor() {
      super();

      new Message(
        FitConstants.mesg_num.file_id,
        FitMessages.file_id,
        "time_created",
        "manufacturer",
        "product",
        "type"
      ).writeDataMessage(
        FitEncoder.toFitTimestamp(new Date()),
        FitConstants.manufacturer.garmin,
        0,
        FitConstants.file.workout
      );

      new Message(
        FitConstants.mesg_num.workout,
        FitMessages.workout,
        "wkt_name",
        "sport",
        "num_valid_steps"
      ).writeDataMessage(name, FitConstants.sport.running, steps.length);

      const workoutStepMessage = new Message(
        FitConstants.mesg_num.workout_step,
        FitMessages.workout_step,
        "wkt_step_name",
        "custom_target_value_low",
        "custom_target_value_high",
        "target_type",
        "duration_type",
        "duration_value",
        "target_value",
        "intensity",
        "message_index"
      );

      steps.forEach((step, index) => {
        const { hasSpeed, speedLow, speedHigh } = speedRangeForZone(step.zone);
        workoutStepMessage.writeDataMessage(
          step.name,
          speedLow,
          speedHigh,
          hasSpeed ? FitConstants.wkt_step_target.speed : FitConstants.wkt_step_target.open,
          FitConstants.wkt_step_duration.distance,
          kmToDurationValue(step.km),
          0,
          step.intensity,
          index
        );
      });
    }
  }

  const enc = new WorkoutEncoder();
  return enc.getFile();
}
