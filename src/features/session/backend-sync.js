"use client";

import { useEffect, useState } from "react";
import { MOCK_PLAN } from "@/features/plans/mockWeek";
import { readAthletePlan, writeAthletePlan } from "@/features/plans/plan.storage";
import {
  getCurrentAthleteSlug,
  saveAthleteRecord,
  setCurrentAthleteSlug,
} from "@/features/athletes/athletes.storage";
import { writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { upsertCheckin } from "@/features/checkins/checkins.storage";

const listeners = new Set();

let lastSyncedActiveWeek = null;
let planMetaCache = null;

export function getPlanMetaFromSync() {
  return planMetaCache;
}
let stravaSyncedThisSession = false;

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

function mergeFullPlanPayload(j) {
  if (!j?.weeks || typeof j.weeks !== "object") return false;
  const slug = getCurrentAthleteSlug();
  const merged = { ...MOCK_PLAN, ...j.weeks };
  writeAthletePlan(slug, merged);

  planMetaCache = {
    planStartDate: j.planStartDate ?? null,
    weekRanges: j.weekRanges ?? {},
    activeWeek: j.activeWeek ?? null,
  };

  if (j.activeWeek != null && String(j.activeWeek).trim() !== "") {
    const aw = String(j.activeWeek);
    if (lastSyncedActiveWeek !== aw) {
      writeActiveWeekNumber(aw);
      lastSyncedActiveWeek = aw;
    }
  }

  const athletePatch = {};
  if (j.zones && typeof j.zones === "object") {
    athletePatch.zonesRecord = j.zones;
  }
  if (j.testDistance != null) athletePatch.distanciaTeste = j.testDistance;
  if (j.testTime) athletePatch.tempoTeste = j.testTime;
  if (j.vRef != null) athletePatch.vRef = j.vRef;
  if (Object.keys(athletePatch).length) {
    saveAthleteRecord(slug, athletePatch);
  }
  return true;
}

export async function pullFullPlanFromApi() {
  const res = await fetch("/api/plan/sync", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const j = await res.json();
  mergeFullPlanPayload(j);
  return j;
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
        if (aw != null && String(aw).trim() !== "" && lastSyncedActiveWeek == null) {
          writeActiveWeekNumber(String(aw));
          lastSyncedActiveWeek = String(aw);
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const synced = await pullFullPlanFromApi();
    if (!synced) {
      await pullWeekPlanFromApi(null);
    }
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

    if (!stravaSyncedThisSession) {
      stravaSyncedThisSession = true;
      try {
        await fetch("/api/strava/feed", { credentials: "include", cache: "no-store" });
      } catch {
        /* ignore: alimenta community_activities em background */
      }
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
