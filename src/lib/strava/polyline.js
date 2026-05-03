/**
 * Decodes a Google-encoded polyline (Strava `summary_polyline`) to [lat, lng][].
 * @param {string} encoded
 * @returns {Array<[number, number]>}
 */
export function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== "string") return [];
  let index = 0;
  const len = encoded.length;
  const coordinates = [];
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }
  return coordinates;
}

/** Reduce point count for map/API payload (keep shape). */
export function downsamplePoints(points, maxPoints = 400) {
  if (!points?.length || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const out = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}
