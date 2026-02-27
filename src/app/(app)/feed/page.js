"use client";

import { useEffect, useMemo, useState } from "react";

import { clearAllCheckins, readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";

import { FEED_AUTHORS, FEED_PHRASES } from "@/features/feed/feed.mock";

/**
 * Util: yyyy-mm-dd -> "dd/mm/yyyy"
 */
function formatBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Util: yyyy-mm-dd -> "Terça" (pt-BR)
 */
function weekdayLabelFromISO(iso) {
  try {
    const d = new Date(`${iso}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", { weekday: "long" })
      .format(d)
      .replace(/^\w/, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

function Pill({ children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
        "border border-white/10 bg-black/20 text-white/80",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ZonePill({ zoneKey }) {
  const z = getZoneByKey(zoneKey);
  if (!z) return null;

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
        "border border-white/10",
        zoneClasses(zoneKey),
      ].join(" ")}
    >
      <span className="font-semibold">{z.label}</span>
      <span className="opacity-80">
        {z.paceMin} — {z.paceMax}
      </span>
    </span>
  );
}

/**
 * Cria um “post” de feed baseado no check-in + treino encontrado na semana mock.
 * Se não achar o treino da semana, ainda assim mostra algo útil.
 */
function buildFeedItemsFromCheckins(checkins) {
  const week = getWeekPlan?.() ?? null;
  const blocks = week?.blocks ?? [];

  const items = (checkins || []).map((c, idx) => {
    const workout = blocks.find((b) => b.slug === c.workoutSlug);

    const author = FEED_AUTHORS[idx % FEED_AUTHORS.length];
    const phrase = FEED_PHRASES[idx % FEED_PHRASES.length];

    return {
      id: `${c.date}-${c.workoutSlug}-${idx}`,
      dateISO: c.date,
      weekdayLabel: weekdayLabelFromISO(c.date),
      workoutSlug: c.workoutSlug,
      title: workout?.title ?? "Treino",
      km: workout?.km ?? null,
      zoneKey: workout?.zoneKey ?? null,
      effort: c.effort ?? null,
      note: c.note ?? "",
      author,
      phraseIfNoNote: phrase,
      createdAt: c.createdAt ?? null,
    };
  });

  // mais recente primeiro
  items.sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)));
  return items;
}

export default function FeedPage() {
  const [q, setQ] = useState("");
  const [seed, setSeed] = useState(0);
  const [items, setItems] = useState([]);

  function refresh() {
    // re-le localStorage
    const all = readAllCheckins();
    setItems(buildFeedItemsFromCheckins(all));
    setSeed((s) => s + 1); // força recomputes leves se necessário
  }

  function clearDemo() {
    clearAllCheckins();
    refresh();
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((it) => {
      const hay = [
        it.author,
        it.title,
        it.weekdayLabel,
        it.dateISO,
        it.note,
        it.phraseIfNoNote,
        it.workoutSlug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [items, q, seed]);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feed</h1>
          <div className="text-sm text-white/60">
            Social (mock) com base nos seus check-ins.
          </div>
        </div>

        {/* Controls: mobile stack / desktop row */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:w-[360px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar"
              className={[
                "w-full rounded-full border border-white/10 bg-black/20 px-4 py-2 pr-10",
                "text-sm text-white/90 placeholder:text-white/30 outline-none",
                "focus:border-white/20",
              ].join(" ")}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              🔎
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
            <button
              onClick={refresh}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Atualizar
            </button>
            <button
              onClick={clearDemo}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Limpar (demo)
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Nenhuma atividade encontrada.
          <div className="mt-2 text-sm text-white/50">
            Dica: faça um check-in na Planilha para aparecer aqui.
          </div>
        </div>
      ) : null}

      {/* Feed list */}
      <div className="space-y-4">
        {filtered.map((it) => (
          <article
            key={it.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5"
          >
            {/* top row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm text-white/60">
                  {formatBR(it.dateISO)} • {it.weekdayLabel}
                </div>

                <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <div className="text-2xl font-semibold">{it.title}</div>
                  {typeof it.km === "number" || typeof it.km === "string" ? (
                    <div className="text-sm text-white/60">{it.km} km</div>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-start md:justify-end">
                {it.zoneKey ? <ZonePill zoneKey={it.zoneKey} /> : null}
              </div>
            </div>

            {/* meta pills */}
            <div className="mt-3 flex flex-wrap gap-2">
              {it.effort ? <Pill>Esforço: {it.effort}/5</Pill> : null}
              <Pill>{it.note?.trim() ? "Com nota" : "Sem nota"}</Pill>
            </div>

            <div className="my-4 h-px w-full bg-white/10" />

            {/* post text */}
            <div className="text-white/90">
              <span className="font-semibold">{it.author}</span>
              <span className="text-white/60">:</span>{" "}
              {it.note?.trim() ? it.note : it.phraseIfNoNote}
            </div>

            {/* actions */}
            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
              <button
                disabled
                className={[
                  "rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm",
                  "text-white/60",
                  "opacity-80 cursor-not-allowed",
                ].join(" ")}
                title="Em breve"
              >
                🔥 Curtir
              </button>
              <button
                disabled
                className={[
                  "rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm",
                  "text-white/60",
                  "opacity-80 cursor-not-allowed",
                ].join(" ")}
                title="Em breve"
              >
                💬 Comentar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}