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

/** CSV com separador ; (Excel PT-BR), UTF-8 com BOM. */
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

/** Decodifica bytes exportados pelo Excel (UTF-8 ou Windows-1252). */
export function decodeCsvTextFromBuffer(buffer) {
  const u8 = new Uint8Array(buffer);
  let start = 0;
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    start = 3;
  }
  const slice = u8.subarray(start);
  const utf8 = new TextDecoder("utf-8").decode(slice);
  if (!looksLikeMojibake(utf8)) return utf8;
  try {
    return new TextDecoder("windows-1252").decode(slice);
  } catch {
    return new TextDecoder("iso-8859-1").decode(slice);
  }
}

function looksLikeMojibake(text) {
  return /Ã[§£ªº©¢´`]|ï¿½|â€/.test(text);
}

function detectSeparator(firstLine) {
  const semi = (firstLine.match(/;/g) || []).length;
  const comma = (firstLine.match(/,/g) || []).length;
  return semi >= comma ? ";" : ",";
}

/**
 * Parser RFC 4180: respeita aspas e quebras de linha dentro da célula.
 * @returns {string[][]}
 */
export function parseCsvRecords(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  if (!raw.trim()) return [];

  const sep = detectSeparator(raw.split(/\r\n|\n|\r/)[0] || "");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === sep) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((c) => String(c).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      if (ch === "\r" && next === "\n") i++;
      continue;
    }

    if (ch === "\r") {
      row.push(cell);
      if (row.some((c) => String(c).trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  if (row.some((c) => String(c).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function parseWeekKey(val) {
  const s = String(val ?? "").trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = parseInt(s, 10);
  if (n < 1 || n > 104) return null;
  return String(n);
}

function normalizeZoneKey(val) {
  const s = String(val ?? "").trim().toLowerCase();
  const m = s.match(/^z[1-5]$/);
  return m ? m[0] : s || "z2";
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
  const rows = parseCsvRecords(text);
  if (!rows.length) return {};

  const header = rows[0].map((c) => normDay(c));
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

  if (iSemana < 0) return {};

  const plan = {};
  for (let ri = 1; ri < rows.length; ri++) {
    const cells = rows[ri];
    const wk = parseWeekKey(cells[iSemana]);
    if (!wk) continue;

    if (!plan[wk]) {
      plan[wk] = {
        id: `week-${wk}`,
        title: `Semana ${wk}`,
        phase:
          iFase >= 0
            ? String(cells[iFase] ?? "").trim() || "Personalizado"
            : "Personalizado",
        blocks: [],
      };
    }

    const dayRaw = iDia >= 0 ? String(cells[iDia] ?? "").trim() : "";
    const dayLabel = dayRaw || "Terça";

    plan[wk].blocks.push({
      dayLabel,
      slug: `s${wk}-import-${ri}`,
      km: Number(String(cells[iKm >= 0 ? iKm : 3] ?? "").replace(",", ".")) || 0,
      zoneKey: iZona >= 0 ? normalizeZoneKey(cells[iZona]) : "z2",
      title:
        iTitulo >= 0
          ? String(cells[iTitulo] ?? "Treino").trim() || "Treino"
          : "Treino",
      description: iObs >= 0 ? String(cells[iObs] ?? "").trim() : "",
      workoutDateISO: iData >= 0 ? parseDateCell(cells[iData]) : null,
    });
  }

  return plan;
}
