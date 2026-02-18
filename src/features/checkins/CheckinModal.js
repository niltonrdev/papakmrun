"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveTodayCheckin } from "./checkins.service";
import { getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";

export default function CheckinModal({ open, onClose, workout, onSaved }) {
  const [effort, setEffort] = useState(3);
  const [note, setNote] = useState("");

  const zone = useMemo(() => getZoneByKey(workout?.zoneKey), [workout]);

  if (!workout) return null;

  function submit(e) {
    e.preventDefault();
    saveTodayCheckin({
      workoutSlug: workout.slug,
      effort: Number(effort),
      note,
    });
    onSaved?.();
    onClose?.();
  }

  return (
    <Modal open={open} title="Check-in do treino" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-white/60">Treino</div>
              <div className="text-lg font-semibold">
                {workout.dayLabel} • {workout.title} • {workout.km} km
              </div>
            </div>
            {zone && (
              <div
                className={[
                  "rounded-full px-3 py-1 text-xs whitespace-nowrap",
                  zoneClasses(workout.zoneKey),
                ].join(" ")}
              >
                {zone.label}
              </div>
            )}
          </div>

          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            {workout.description}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">
              Esforço percebido (1–5)
            </label>

            <div className="flex items-center gap-3">
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

            <div className="text-xs text-white/50">
              1 = leve / 5 = muito puxado.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Observação (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ex: fiz em jejum, senti a panturrilha, clima quente..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
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
              Confirmar check-in
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
