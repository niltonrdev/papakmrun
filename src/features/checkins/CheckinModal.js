"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveWorkoutCheckin, formatISODate } from "./checkins.service";
import { getAthleteRecord, getCurrentAthleteSlug } from "@/features/athletes/athletes.storage";
import { addPainFeedback } from "@/features/pain/pain.storage";
import { isWorkoutCheckedForBlock } from "./checkins.service";
import { getBlockSegments } from "@/features/plans/workout-blocks";

export default function CheckinModal({ open, onClose, workout, onSaved }) {
  const [effort, setEffort] = useState(3);
  const [note, setNote] = useState("");
  const [hadPain, setHadPain] = useState(false);
  const [painNote, setPainNote] = useState("");

  if (!workout) return null;

  const scheduledDate = workout.workoutDateISO?.slice?.(0, 10) || null;
  const today = formatISODate(new Date());
  const isLateCheckin =
    scheduledDate && scheduledDate < today && !isWorkoutCheckedForBlock(workout);

  async function submit(e) {
    e.preventDefault();
    // Data do check-in = dia em que o aluno fez (nunca no futuro).
    // Em atraso, mantém a data agendada do treino.
    const checkinDate =
      scheduledDate && scheduledDate <= today ? scheduledDate : today;
    await saveWorkoutCheckin({
      workoutSlug: workout.slug,
      effort: Number(effort),
      note: note?.trim() ?? "",
      workoutTitle: workout.title,
      planKm: workout.km,
      checkinDate,
    });
    if (hadPain && painNote.trim()) {
      const slug = getCurrentAthleteSlug();
      const rec = getAthleteRecord(slug);
      const payload = {
        athleteSlug: slug,
        athleteName: rec.name || slug.replace(/-/g, " "),
        workoutSlug: workout.slug,
        workoutTitle: workout.title,
        date: workout.workoutDateISO,
        painNote: painNote.trim(),
        effort: Number(effort),
      };
      addPainFeedback(payload);
      try {
        await fetch("/api/pain-feedback", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        /* fallback local */
      }
    }
    onSaved?.();
    onClose?.();
    setHadPain(false);
    setPainNote("");
    setNote("");
  }

  const segments = getBlockSegments(workout);
  const workoutLabel = workout.workoutLabel || workout.dayLabel || "Treino";

  return (
    <Modal open={open} title="Marcar treino como feito" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Treino</div>
          <div className="text-lg font-semibold">
            {workoutLabel} • {workout.title} • {workout.km} km
          </div>
          <div className="mt-3 space-y-1 text-sm text-white/70">
            {segments.warmup ? (
              <p>
                <span className="font-bold text-white/50">Aquecimento:</span> {segments.warmup}
              </p>
            ) : null}
            {segments.mainPart ? (
              <p>
                <span className="font-bold text-white/50">Parte principal:</span> {segments.mainPart}
              </p>
            ) : null}
            {segments.cooldown ? (
              <p>
                <span className="font-bold text-white/50">Desaquecimento:</span> {segments.cooldown}
              </p>
            ) : null}
          </div>
          {isLateCheckin ? (
            <p className="mt-3 text-xs text-amber-200/90 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              Treino em atraso: será registrado na data programada (
              {scheduledDate.split("-").reverse().join("/")}).
            </p>
          ) : null}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">Esforço percebido (1–5)</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
                className="w-full"
              />
              <div className="w-10 text-center text-sm font-semibold">{effort}</div>
            </div>
          </div>

          <div>
            <label className="text-sm text-white/70">Observação</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Opcional..."
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-orange-500/5 p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-white/80">
              <input
                type="checkbox"
                checked={hadPain}
                onChange={(e) => setHadPain(e.target.checked)}
                className="rounded border-white/20"
              />
              Senti dor ou desconforto persistente
            </label>
            {hadPain && (
              <div>
                <label className="text-xs text-white/50 uppercase font-bold tracking-wider">
                  Descreva para o professor
                </label>
                <textarea
                  value={painNote}
                  onChange={(e) => setPainNote(e.target.value)}
                  rows={2}
                  required={hadPain}
                  placeholder="Local, intensidade, quando começou..."
                  className="mt-2 w-full rounded-2xl border border-orange-500/30 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={hadPain && !painNote.trim()}
              className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
