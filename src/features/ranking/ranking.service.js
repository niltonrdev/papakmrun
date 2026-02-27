import { readAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan } from "@/features/plans/plans.service";

/**
 * Retorna o início (segunda) e fim (domingo) da semana atual no formato YYYY-MM-DD.
 * Usamos datas "puras" pra comparar com checkins.date.
 */
function getCurrentWeekRangeISO(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);

  // JS: 0=domingo, 1=segunda... queremos segunda como start
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

function isISOInRange(dateISO, startISO, endISO) {
  // Como é YYYY-MM-DD, comparação lexicográfica funciona
  return dateISO >= startISO && dateISO <= endISO;
}

function getKmByWorkoutSlug(workoutSlug) {
  // Pega km do mock week (plans.service já usa mockWeek internamente)
  const week = getWeekPlan?.();
  const blocks = week?.blocks ?? [];
  const found = blocks.find((b) => b.slug === workoutSlug);
  return Number(found?.km ?? 0);
}

function calcPoints({ workouts, kmTotal }) {
  // Regra V1 (simples e previsível)
  return workouts * 10 + kmTotal * 1;
}

/**
 * Ranking real: baseado nos check-ins do usuário (localStorage).
 * Sem backend ainda, então os outros nomes serão "demo derivados" do seu.
 */
export function getWeeklyRankingDemoTop5() {
  const { startISO, endISO } = getCurrentWeekRangeISO(new Date());

  const all = readAllCheckins(); // [{date, workoutSlug, effort, note, createdAt}]
  const weekCheckins = all.filter((c) => isISOInRange(c.date, startISO, endISO));

  // Stats do usuário real (você)
  const workouts = weekCheckins.length;
  const kmTotal = weekCheckins.reduce((acc, c) => acc + getKmByWorkoutSlug(c.workoutSlug), 0);

  const me = {
    name: "Nilton",
    workouts,
    kmTotal,
    points: calcPoints({ workouts, kmTotal }),
  };

  // Outros usuários “demo” derivados (pra ficar social sem backend)
  // multiplica seus números pra simular concorrência
  const demo = [
    { name: "Ana", mult: 0.9 },
    { name: "Bruno", mult: 0.75 },
    { name: "Carla", mult: 0.6 },
    { name: "Diego", mult: 0.45 },
  ].map((u) => {
    const w = Math.max(0, Math.round(me.workouts * u.mult));
    const km = Math.max(0, Math.round(me.kmTotal * u.mult));
    return {
      name: u.name,
      workouts: w,
      kmTotal: km,
      points: calcPoints({ workouts: w, kmTotal: km }),
    };
  });

  // Junta e ordena
  const list = [me, ...demo].sort((a, b) => b.points - a.points);

  return {
    range: { startISO, endISO },
    items: list.slice(0, 5),
  };
}