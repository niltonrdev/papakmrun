"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveTodayCheckin } from "./checkins.service";

export default function CheckinModal({ open, onClose, workout, onSaved }) {
  const [effort, setEffort] = useState(3);
  const [note, setNote] = useState("");

  if (!workout) return null;

  function submit(e) {
    e.preventDefault();
    saveTodayCheckin({ workoutSlug: workout.slug, effort, note });
    onSaved?.();
    onClose?.();
  }

  return (
    <Modal open={open} title="Check-in do treino" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Treino</div>
          <div className="text-lg font-semibold">
            {workout.dayLabel} • {workout.title} • {workout.km} km
          </div>
          <p className="mt-2 text-sm text-white/70">{workout.description}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-white/70">
              Esforço percebido (1–5)
            </label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={5}
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
                className="w-full"
              />
              <div className="w-10 text-center text-sm font-semibold">
                {effort}
              </div>
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
              className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
