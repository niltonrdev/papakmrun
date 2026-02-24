"use client";

import { useEffect, useMemo, useState } from "react";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import {
  readAllCheckins,
  clearAllCheckins,
} from "@/features/checkins/checkins.storage";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatDateBR(iso) {
  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return `${pad2(dt.getDate())}/${pad2(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function weekdayPT(iso) {
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const w = dt.toLocaleDateString("pt-BR", { weekday: "long" }); // ex: "terça-feira"
  const clean = w.replace("-feira", "").trim(); // ex: "terça"
  return clean.charAt(0).toUpperCase() + clean.slice(1); // "Terça"
}

function hashToIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return mod ? h % mod : h;
}

export default function FeedPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  function buildFeed() {
    const week = getWeekPlan(); // MOCK_WEEK (Semanas mock)
    const checkins = readAllCheckins();

    // index por slug
    const bySlug = new Map();
    (week?.blocks || []).forEach((b) => bySlug.set(b.slug, b));

    // mocks simples (determinísticos) pra “post”
    const authors = ["Nilton", "Ana", "Bruno", "Carla", "Diego"];
    const phrases = [
      "Treino pago 💪",
      "Hoje foi sofrido 😅",
      "Bora, constância! 🔥",
      "Fiz no limite 🥵",
      "Soltei as pernas 🏃‍♂️",
      "Coração foi na boca ❤️‍🔥",
      "Sem desculpas hoje ✅",
      "Foi mais leve do que parece 😄",
      "Meta batida 🎯",
      "Tava pesado, mas foi 🫡",
    ];

    const feed = (checkins || [])
      .map((c) => {
        const w = bySlug.get(c.workoutSlug);

        // se não achar o treino (slug antigo), ainda assim mostra algo
        const dayLabel = w?.dayLabel || weekdayPT(c.date);
        const title = w?.title || c.workoutSlug;
        const km = w?.km ?? null;
        const zoneKey = w?.zoneKey || null;
        const z = zoneKey ? getZoneByKey(zoneKey) : null;

        // determinístico por treino+data
        const key = `${c.date}__${c.workoutSlug}`;
        const authorName = authors[hashToIndex(key, authors.length)];
        const postText = phrases[hashToIndex(key + "__p", phrases.length)];

        return {
          id: key,
          date: c.date, // YYYY-MM-DD
          dayLabel,
          title,
          km,
          zoneKey,
          zone: z,
          effort: c.effort ?? null,
          note: c.note ?? "",
          authorName,
          postText,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // mais recente primeiro

    setItems(feed);
  }

  useEffect(() => {
    buildFeed();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((it) => {
      return (
        (it.title || "").toLowerCase().includes(s) ||
        (it.authorName || "").toLowerCase().includes(s) ||
        (it.postText || "").toLowerCase().includes(s) ||
        (it.dayLabel || "").toLowerCase().includes(s) ||
        (it.date || "").toLowerCase().includes(s)
      );
    });
  }, [items, q]);

  function onRefresh() {
    buildFeed();
  }

  function onClearDemo() {
    // limpa o localStorage dos check-ins
    clearAllCheckins();
    buildFeed();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Feed</h1>
          <p className="mt-1 text-white/60">
            Social (mock) com base nos seus check-ins.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-sm text-white/90 placeholder:text-white/40 outline-none focus:border-white/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              🔎
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={onRefresh}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Atualizar
            </button>
            <button
              onClick={onClearDemo}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
            >
              Limpar (demo)
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Sem itens no feed (ainda). Faça um check-in na planilha.
          </div>
        ) : (
          filtered.map((it) => (
            <article
              key={it.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm text-white/60">
                    {formatDateBR(it.date)} • {it.dayLabel}
                  </div>

                  <div className="mt-1 text-2xl font-semibold">
                    {it.title}{" "}
                    {typeof it.km === "number" ? (
                      <span className="text-base font-medium text-white/70">
                        {it.km} km
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* esforço */}
                    {it.effort ? (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                        Esforço: <b>{it.effort}/5</b>
                      </span>
                    ) : null}

                    {/* nota */}
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {it.note?.trim() ? "Com nota" : "Sem nota"}
                    </span>
                  </div>
                </div>

                {/* zona */}
                <div className="flex justify-start md:justify-end">
                  {it.zone ? (
                    <span
                      className={[
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
                        zoneClasses(it.zone.key),
                      ].join(" ")}
                    >
                      <span className="font-semibold">{it.zone.label}</span>
                      <span className="opacity-80">
                        {it.zone.paceMin} — {it.zone.paceMax}
                      </span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4 text-white/85">
                <b>{it.authorName}:</b> {it.postText}
              </div>

              {/* Ações mock */}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                  🔥 Curtir
                </button>
                <button className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                  💬 Comentar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}