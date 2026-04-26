import { FitEncoder, FitConstants, FitMessages, Message } from "fit-encoder";
import { ZONES } from "@/features/plans/mockWeek";

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

/**
 * FIT workout (running) simples, focado em compatibilidade com Garmin Connect.
 * - 1 step por treino (distância), com alvo de velocidade (pelo pace da zona)
 * - Escalas do FIT SDK precisam ser aplicadas manualmente:
 *   - speed (m/s) scale 1000
 *   - duration_value distance (m) scale 100
 */
export function buildWorkoutFitFromBlock(block) {
  const km = Number(block?.km ?? 0);
  const meters = Math.max(200, Math.round((Number.isFinite(km) ? km : 5) * 1000));
  const durationValue = clampUInt32(meters * 100); // scale 100

  const zone = ZONES?.[block?.zoneKey] ?? null;
  const vLow = paceToSpeedMps(zone?.paceMax); // mais lento
  const vHigh = paceToSpeedMps(zone?.paceMin); // mais rápido

  const hasSpeed = Number.isFinite(vLow) && Number.isFinite(vHigh);
  const speedLow = hasSpeed ? clampUInt32(Math.min(vLow, vHigh) * 1000) : undefined;
  const speedHigh = hasSpeed ? clampUInt32(Math.max(vLow, vHigh) * 1000) : undefined;

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

      const name = `${block?.title || "Treino"} · ${km || ""}km`.trim();

      new Message(
        FitConstants.mesg_num.workout,
        FitMessages.workout,
        "wkt_name",
        "sport",
        "num_valid_steps"
      ).writeDataMessage(name, FitConstants.sport.running, 1);

      const workoutStepMessage = new Message(
        FitConstants.mesg_num.workout_step,
        FitMessages.workout_step,
        "custom_target_value_low",
        "custom_target_value_high",
        "target_type",
        "duration_type",
        "duration_value",
        "target_value",
        "intensity",
        "message_index",
        "notes"
      );

      workoutStepMessage.writeDataMessage(
        speedLow,
        speedHigh,
        hasSpeed ? FitConstants.wkt_step_target.speed : FitConstants.wkt_step_target.open,
        FitConstants.wkt_step_duration.distance,
        durationValue,
        0,
        FitConstants.intensity.active,
        0,
        String(block?.description || "")
      );
    }
  }

  const enc = new WorkoutEncoder();
  return enc.getFile();
}

