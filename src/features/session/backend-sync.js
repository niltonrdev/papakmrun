"use client";

import { useEffect, useState } from "react";
import { MOCK_PLAN } from "@/features/plans/mockWeek";
import { readAthletePlan, writeAthletePlan } from "@/features/plans/plan.storage";
import { getCurrentAthleteSlug, setCurrentAthleteSlug } from "@/features/athletes/athletes.storage";
import { writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { upsertCheckin } from "@/features/checkins/checkins.storage";

const listeners = new Set();

/** Evita sobrescrever a semana selecionada na UI após a primeira carga. */
let appliedServerActiveWeek = false;

export function subscribeBackendSync(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyBackendSync() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

function mergeServerWeekPayload(j) {
  if (!j?.weekKey || !j?.week) return;
  const slug = getCurrentAthleteSlug();
  const prev = readAthletePlan(slug) || {};
  const base = { ...MOCK_PLAN, ...prev };
  base[String(j.weekKey)] = j.week;
  writeAthletePlan(slug, base);
}

/**
 * GET /api/plan/week — mescla a semana no plano local.
 * @param {string|number|null} week — omitir para a semana ativa do servidor (perfil, se logado).
 */
export async function pullWeekPlanFromApi(week = null) {
  const q =
    week != null && String(week).trim() !== ""
      ? `?week=${encodeURIComponent(String(week))}`
      : "";
  const res = await fetch(`/api/plan/week${q}`, { credentials: "include" });
  if (!res.ok) return null;
  const j = await res.json();
  mergeServerWeekPayload(j);
  return j;
}

function mergeCheckinsFromApiItems(items) {
  if (!Array.isArray(items)) return;
  for (const row of items) {
    if (!row?.workoutSlug || !row?.date) continue;
    upsertCheckin({
      date: row.date,
      workoutSlug: row.workoutSlug,
      effort: row.effort != null ? Number(row.effort) : null,
      note: typeof row.note === "string" ? row.note : "",
      createdAt: row.createdAt || new Date().toISOString(),
      workoutTitle: row.workoutTitle ?? "",
      planKm: row.planKm != null ? Number(row.planKm) : null,
    });
  }
}

/**
 * Sincroniza perfil (semana ativa, slug), planilha da semana canônica e check-ins do Supabase.
 */
export async function syncBackendSession() {
  if (typeof window === "undefined") return;

  let hasSession = false;

  try {
    const meRes = await fetch("/api/me", { credentials: "include" });
    if (meRes.ok) {
      const me = await meRes.json();
      if (me?.backend === "supabase" && me?.user) {
        hasSession = true;
        const slug = me?.profile?.athlete_slug;
        if (slug && typeof slug === "string") {
          setCurrentAthleteSlug(slug);
        }
        const aw = me?.profile?.active_week;
        if (!appliedServerActiveWeek && aw != null && String(aw).trim() !== "") {
          writeActiveWeekNumber(String(aw));
          appliedServerActiveWeek = true;
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    await pullWeekPlanFromApi(null);
  } catch {
    /* ignore */
  }

  if (hasSession) {
    try {
      const chRes = await fetch("/api/checkins", { credentials: "include" });
      if (chRes.ok) {
        const ch = await chRes.json();
        mergeCheckinsFromApiItems(ch?.items);
      }
    } catch {
      /* ignore */
    }
  }

  notifyBackendSync();
}

export function useBackendSyncTick() {
  const [n, setN] = useState(0);
  useEffect(() => {
    return subscribeBackendSync(() => setN((x) => x + 1));
  }, []);
  return n;
}
