import { env } from "@/lib/env";

const R = 6371000;

function toRad(d) {
  return (d * Math.PI) / 180;
}

function haversineM(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** ~1 grau latitude em metros */
function offsetLatMeters(lat, meters) {
  return lat + meters / 111320;
}

function offsetLonMeters(lat, lon, meters) {
  return lon + meters / (111320 * Math.cos(toRad(lat)) || 1e-6);
}

/**
 * Gera trkpt ao longo de um “percurso” retangular até somar ~targetKm.
 * Serve como curso aproximado para relógio (Garmin/Coros); não é GPS real.
 */
export function buildSyntheticWorkoutGpx({
  title,
  description,
  km,
  zoneKey,
  workoutDateISO,
  originLat,
  originLon,
}) {
  const lat0 = Number.isFinite(originLat) ? originLat : env.gpxOriginLat;
  const lon0 = Number.isFinite(originLon) ? originLon : env.gpxOriginLon;
  const targetM = Math.max(200, (Number(km) || 5) * 1000);

  const leg = 400;
  const dirs = [
    { dy: leg, dx: 0 },
    { dy: 0, dx: leg },
    { dy: -leg, dx: 0 },
    { dy: 0, dx: -leg },
  ];

  const points = [{ lat: lat0, lon: lon0 }];
  let total = 0;
  let safety = 0;
  while (total < targetM && safety < 5000) {
    const { dy, dx } = dirs[safety % dirs.length];
    const last = points[points.length - 1];
    const next = {
      lat: offsetLatMeters(last.lat, dy),
      lon: offsetLonMeters(last.lat, last.lon, dx),
    };
    total += haversineM(last, next);
    points.push(next);
    safety += 1;
  }

  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const time =
    workoutDateISO && /^\d{4}-\d{2}-\d{2}$/.test(workoutDateISO)
      ? `${workoutDateISO}T07:00:00Z`
      : new Date().toISOString();

  const trkpts = points
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lon.toFixed(6)}">\n        <time>${time}</time>\n      </trkpt>`
    )
    .join("\n");

  const name = esc(title || "Treino PapaKM");
  const desc = esc(
    [
      description || "",
      zoneKey ? `Zona: ${zoneKey}` : "",
      km != null ? `Meta: ${km} km` : "",
      "Rota sintética gerada pela plataforma (não é GPS gravado).",
    ]
      .filter(Boolean)
      .join(" · ")
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="PapaKM Run" version="1.1"
 xmlns="http://www.topografix.com/GPX/1/1"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${name}</name>
    <desc>${desc}</desc>
    <time>${time}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <type>running</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

export function buildGpxFromStravaLatLng(latlng, name, startedAt) {
  if (!Array.isArray(latlng) || latlng.length < 2) {
    throw new Error("latlng inválido");
  }
  const timeBase = startedAt ? new Date(startedAt).toISOString() : new Date().toISOString();
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const trkpts = latlng
    .map((pair, i) => {
      const [lat, lon] = pair;
      const t = new Date(new Date(timeBase).getTime() + i * 1000).toISOString();
      return `      <trkpt lat="${Number(lat).toFixed(6)}" lon="${Number(lon).toFixed(6)}">\n        <time>${t}</time>\n      </trkpt>`;
    })
    .join("\n");
  const n = esc(name || "Atividade Strava");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="PapaKM Run" version="1.1"
 xmlns="http://www.topografix.com/GPX/1/1"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata><name>${n}</name><time>${timeBase}</time></metadata>
  <trk><name>${n}</name><type>running</type><trkseg>
${trkpts}
  </trkseg></trk>
</gpx>
`;
}
