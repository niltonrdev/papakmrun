"use client";
import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function WorkoutMap({ points }) {
  // Coordenadas padrão (ex: Parque do Ibirapuera) se não houver pontos reais
  const defaultCenter = [-23.5874, -46.6576];
  const positions = points || [
    [-23.5874, -46.6576],
    [-23.5885, -46.6588],
    [-23.5900, -46.6570],
    [-23.5874, -46.6576],
  ];

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/5 bg-black/40">
      <MapContainer 
        center={positions[0]} 
        zoom={15} 
        scrollWheelZoom={false}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        {/* Usando um estilo de mapa escuro gratuito do Stadia/CartoDB */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {/* Traçado da corrida em Laranja PapaKM */}
        <Polyline 
          positions={positions} 
          pathOptions={{ color: '#ff6b00', weight: 4, opacity: 0.8 }} 
        />
      </MapContainer>
      
      <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase text-white/60 tracking-widest leading-none">
        Mapa Ativo
      </div>
    </div>
  );
}