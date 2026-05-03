"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_TRAIL = [
  [-23.5874, -46.6576],
  [-23.5885, -46.6588],
  [-23.59, -46.657],
  [-23.5874, -46.6576],
];

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions?.length || positions.length < 2) return;
    try {
      const b = L.latLngBounds(positions);
      map.fitBounds(b, { padding: [24, 24], maxZoom: 16 });
    } catch {
      /* ignore */
    }
  }, [map, positions]);
  return null;
}

export default function WorkoutMap({ points }) {
  const hasReal = Array.isArray(points) && points.length >= 2;
  const positions = hasReal ? points : DEFAULT_TRAIL;

  return (
    <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-2xl border border-white/5 bg-black/40">
      <MapContainer
        center={positions[Math.floor(positions.length / 2)]}
        zoom={hasReal ? 14 : 15}
        scrollWheelZoom={false}
        className="z-0 h-full w-full min-h-[200px]"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {hasReal ? <FitBounds positions={positions} /> : null}
        <Polyline
          positions={positions}
          pathOptions={{
            color: "#ff6b00",
            weight: 4,
            opacity: hasReal ? 0.9 : 0.35,
          }}
        />
      </MapContainer>

      <div className="pointer-events-none absolute top-3 right-3 z-[400] rounded-full bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/60 backdrop-blur-sm">
        {hasReal ? "Strava GPS" : "Preview"}
      </div>
    </div>
  );
}
