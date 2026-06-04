import { addDaysISO } from "@/lib/plan-calendar";

const WEEKDAY_OFFSET = {
  segunda: 0,
  terca: 1,
  terça: 1,
  quarta: 2,
  quinta: 3,
  sexta: 4,
  sabado: 5,
  sábado: 5,
  domingo: 6,
};

function normDay(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dayOffset(label) {
  return WEEKDAY_OFFSET[normDay(label)] ?? null;
}

function computeBlockDate(planStartMonday, weekKey, dayLabel) {
  const off = dayOffset(dayLabel);
  if (off == null || !planStartMonday) return null;
  const wn = Math.max(1, Number(weekKey) || 1);
  return addDaysISO(planStartMonday, (wn - 1) * 7 + off);
}

function escapeCsvCell(val) {
  const s = String(val ?? "");
  if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV com separador ; (Excel PT-BR). */
export function planWeeksToCsv(weeks, planStartMonday) {
  const header = [
    "Semana",
    "Fase",
    "Dia",
    "Km",
    "Zona",
    "Título",
    "Observações",
    "Data",
  ];
  const lines = [header.map(escapeCsvCell).join(";")];
  const keys = Object.keys(weeks || {}).sort((a, b) => Number(a) - Number(b));
  for (const wk of keys) {
    const week = weeks[wk];
    for (const b of week?.blocks || []) {
      const date =
        b.workoutDateISO ||
        computeBlockDate(planStartMonday, wk, b.dayLabel);
      lines.push(
        [
          wk,
          week.phase || "",
          b.dayLabel || "",
          b.km ?? "",
          b.zoneKey || "",
          b.title || "",
          b.description || "",
          date || "",
        ]
          .map(escapeCsvCell)
          .join(";")
      );
    }
  }
  return "\uFEFF" + lines.join("\r\n");
}

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ";" || ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseDateCell(val) {
  const s = String(val || "").trim();
  if (!s) return null;
  const br = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (br) {
    const y = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${y}-${String(br[2]).padStart(2, "0")}-${String(br[1]).padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

export function csvToPlanWeeks(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return {};

  const sep = lines[0].includes(";") ? ";" : ",";
  const header = parseCsvLine(lines[0]).map((c) => normDay(c));
  const col = (name) =>
    header.findIndex((h) => h === name || h.includes(name));

  const iSemana = col("semana");
  const iFase = col("fase");
  const iDia = header.findIndex((h) => h.includes("dia"));
  const iKm = col("km");
  const iZona = col("zona");
  const iTitulo = header.findIndex((h) => h.includes("titulo"));
  const iObs = header.findIndex(
    (h) => h.includes("observ") || h.includes("descricao")
  );
  const iData = col("data");

  const plan = {};
  for (let li = 1; li < lines.length; li++) {
    const cells =
      sep === ";"
        ? parseCsvLine(lines[li])
        : lines[li].split(",");
    const wk = String(cells[iSemana >= 0 ? iSemana : 0] || "").trim();
    if (!wk) continue;
    if (!plan[wk]) {
      plan[wk] = {
        id: `week-${wk}`,
        title: `Semana ${wk}`,
        phase:
          iFase >= 0 ? String(cells[iFase] || "").trim() || "Personalizado" : "Personalizado",
        blocks: [],
      };
    }
    plan[wk].blocks.push({
      dayLabel: iDia >= 0 ? String(cells[iDia] || "Terça").trim() : "Terça",
      slug: `s${wk}-import-${li}`,
      km: Number(cells[iKm >= 0 ? iKm : 3]) || 0,
      zoneKey: iZona >= 0 ? String(cells[iZona] || "z2").trim() || "z2" : "z2",
      title: iTitulo >= 0 ? String(cells[iTitulo] || "Treino").trim() : "Treino",
      description: iObs >= 0 ? String(cells[iObs] || "").trim() : "",
      workoutDateISO: iData >= 0 ? parseDateCell(cells[iData]) : null,
    });
  }
  return plan;
}
