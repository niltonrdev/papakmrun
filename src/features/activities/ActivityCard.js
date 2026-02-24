"use client";

import { getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { formatBR } from "./activities.service";

export default function ActivityCard({ item }) {
  const zone = item.zoneKey ? getZoneByKey(item.zoneKey) : null;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">
            {formatBR(item.date)} • {item.dayLabel}
          </div>

          <div className="mt-1 text-lg font-semibold">
            {item.title}
            {typeof item.km === "number" ? (
              <span className="ml-2 text-sm font-normal text-white/60">{item.km} km</span>
            ) : null}
          </div>
        </div>

        {zone ? (
          <span
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
              zoneClasses(item.zoneKey),
            ].join(" ")}
          >
            <span className="font-semibold">{zone.label}</span>
            <span className="opacity-80">
              {zone.paceMin} – {zone.paceMax}
            </span>
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-white/80">
          Esforço: <span className="font-semibold text-white">{item.effort ?? "-"}</span>/5
        </span>

        {item.note ? (
          <span className="text-white/70">
            <span className="text-white/50">Nota:</span> {item.note}
          </span>
        ) : (
          <span className="text-white/40">Sem nota</span>
        )}
      </div>
    </article>
  );
}