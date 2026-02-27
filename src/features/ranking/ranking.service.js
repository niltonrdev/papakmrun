// src/features/ranking/ranking.service.js
import { readAllCheckins } from "@/features/checkins/checkins.storage";

// Semana ISO simples (Seg -> Dom)
export function getWeekRangeISO(baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);

  // getDay(): 0=Dom, 1=Seg...
  const day = d.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const toISO = (x) => {
    const yyyy = x.getFullYear();
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return { startISO: toISO(start), endISO: toISO(end) };
}

function isWithin(dateISO, startISO, endISO) {
  // formato YYYY-MM-DD => comparação lexicográfica funciona
  return dateISO >= startISO && dateISO <= endISO;
}

// Regra de pontos:
// - base 10 pts por check-in
// - + esforço (1..5) como bônus
// - + 1 pt se escreveu nota (consistência/engajamento)
// total típico: 11..16
export function calcPoints(checkin) {
  const base = 10;
  const effort = Number(checkin.effort || 0); // 0..5
  const noteBonus = (checkin.note && checkin.note.trim().length > 0) ? 1 : 0;
  return base + effort + noteBonus;
}

// Como não temos usuário real, fixamos "Nilton" pros seus check-ins
function mapOwnerName(checkin) {
  return checkin.ownerName || "Nilton";
}

// Retorna array: [{ name, points, workouts, note }]
export function buildWeeklyRanking({ now = new Date(), limit = 5 } = {}) {
  const { startISO, endISO } = getWeekRangeISO(now);
  const all = readAllCheckins();

  const week = all.filter((c) => isWithin(c.date, startISO, endISO));

  const byUser = new Map();

  for (const c of week) {
    const name = mapOwnerName(c);
    const prev = byUser.get(name) || { name, points: 0, workouts: 0 };
    prev.points += calcPoints(c);
    prev.workouts += 1;
    byUser.set(name, prev);
  }

  // Ordena por pontos desc, depois por workouts desc
  const sorted = Array.from(byUser.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.workouts - a.workouts;
  });

  // nota tipo "3 treinos"
  const final = sorted.slice(0, limit).map((x) => ({
    ...x,
    note: `${x.workouts} treino${x.workouts === 1 ? "" : "s"}`,
  }));

  return { range: { startISO, endISO }, items: final };
}