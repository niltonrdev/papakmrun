"use client";
import { useState } from "react";
import Image from "next/image";
import { 
  Settings, Edit2, MapPin, Users, Award, 
  Crown, Share2, Calendar, Zap, Medal
} from "lucide-react";

// Mock de dados do atleta (Nilton)
const ATLETA_DATA = {
  nome: "NILTON RODRIGUES DO NASCIMENTO",
  cidade: "Brasília, DF",
  pais: "Brasil",
  seguidores: 124,
  seguindo: 86,
  tipoConta: "Premium", // ou "Social"
  bio: "Full Stack Developer | Trail Runner | Focado no Sub 20' nos 5km 🔥",
  stats: {
    pontosNivel: 2361,
    nivel: 2,
    proxNivel: 639
  }
};

export default function PerfilPage() {
  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-10">
      {/* 1. Header com Banner e Foto*/}
      <div className="relative mb-20">
        {/* Banner */}
        <div className="h-48 lg:h-64 w-full rounded-b-[40px] overflow-hidden relative border-b border-white/5 bg-papa-card shadow-2xl">
            <Image 
              src="/brand/banner3.png" 
              alt="Banner PapaKM"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/10" />             
            <button className="absolute top-6 right-6 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/60 hover:text-white transition-all z-10">
              <Settings size={20} />
            </button>
          </div>

        {/* Foto de Perfil Redonda */}
        <div className="absolute -bottom-16 lg:bottom-[-70px] left-8 lg:left-12 flex items-end gap-6 z-20">
          <div className="relative group aspect-square">
          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 lg:border-8 border-papa-dark overflow-hidden bg-papa-card relative shadow-[0_0_40px_rgba(0,0,0,0.7)]">
              <Image 
                src="/brand/foto-perfil2.png" // Sua imagem de perfil
                alt="Avatar Atleta"
                fill
                className="object-cover w-full h-full scale-110 transition-transform group-hover:scale-125"
                priority
              />
            </div>
            <button className="absolute bottom-2 right-2 p-2 rounded-full bg-papa-blue text-papa-dark border-4 border-papa-dark hover:scale-110 transition-transform">
              <Edit2 size={16} />
            </button>
          </div>

          <div className="mb-4 hidden md:block">
             <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
               {ATLETA_DATA.nome}
             </h2>
             <div className="flex items-center gap-2 mt-2 text-white/40 font-bold text-xs uppercase tracking-widest">
                <MapPin size={12} className="text-papa-blue" />
                {ATLETA_DATA.cidade}, {ATLETA_DATA.pais}
             </div>
          </div>
        </div>
      </div>

      {/* 2. Informações de Identidade (Mobile) */}
      <div className="px-8 md:hidden mb-8">
        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">
          {ATLETA_DATA.nome}
        </h2>
        <div className="flex items-center gap-2 mt-1 text-white/40 font-bold text-xs uppercase tracking-widest">
           <MapPin size={12} className="text-papa-blue" />
           {ATLETA_DATA.cidade}
        </div>
      </div>

      <div className="px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Bio e Redes */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-papa-card p-6 rounded-3xl border border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                  ATLETA_DATA.tipoConta === "Premium" ? "bg-papa-orange text-white" : "bg-white/10 text-white/40"
                }`}>
                  <Crown size={10} /> {ATLETA_DATA.tipoConta}
                </span>
                <button className="text-white/20 hover:text-papa-blue transition-colors">
                  <Share2 size={16} />
                </button>
             </div>
             <p className="text-sm text-white/60 italic leading-relaxed">
               {ATLETA_DATA.bio}
             </p>
             <div className="flex gap-6 pt-2 border-t border-white/5">
                <div className="text-center cursor-pointer group">
                  <div className="text-lg font-black text-white group-hover:text-papa-blue">{ATLETA_DATA.seguidores}</div>
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Seguidores</div>
                </div>
                <div className="text-center cursor-pointer group">
                  <div className="text-lg font-black text-white group-hover:text-papa-blue">{ATLETA_DATA.seguindo}</div>
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Seguindo</div>
                </div>
             </div>
          </div>

          {/* <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-xs font-black uppercase text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            Ver Perfil Público <Zap size={14} className="text-papa-blue" />
          </button> */}
        </div>

        {/* Coluna Direita: Assinatura e Medalhas (Estilo Adidas Level) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card de Nível/Assinatura */}
          <div className="bg-papa-card p-8 rounded-3xl border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Award size={120} className="text-papa-blue" />
             </div>

             <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                   <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] mb-4">Assinatura PapaKM</h3>
                   <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                      PapaKMClub
                    </span>
                    <span className="text-3xl lg:text-6xl font-black text-papa-blue italic leading-none drop-shadow-[0_0_15px_rgba(0,209,255,0.4)]">
                      {ATLETA_DATA.stats.nivel}
                    </span>
                </div>
                  <p className="text-[10px] font-bold text-white/40 uppercase mt-4 tracking-widest leading-relaxed">
                     Faltam <span className="text-white">{ATLETA_DATA.stats.proxNivel} pontos</span> para o nível 3
                   </p>
                </div>

                <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-1 text-left md:text-right border-t border-white/5 pt-4 md:border-0 md:pt-0">
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Pontos de Resgate
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center text-[10px] font-bold text-white">★</div>
                        <span className="text-2xl lg:text-3xl font-black text-white leading-none">
                          {ATLETA_DATA.stats.pontosNivel}
                        </span>
                    </div>
                  </div>
             </div>

             {/* Barra de Progresso */}
             <div className="mt-8 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-papa-blue to-papa-orange w-[72%] shadow-[0_0_10px_rgba(0,209,255,0.4)]" />
             </div>
          </div>

          {/* Histórico de Medalhas */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                <Medal size={16} className="text-papa-orange" /> Galeria de Conquistas
              </h3>
              <button className="text-[10px] font-black text-papa-blue uppercase hover:underline">Ver todas</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Sub 20' 5K", color: "text-papa-orange" },
                { label: "100km Mês", color: "text-papa-blue" },
                { label: "Trail Master", color: "text-emerald-400" },
                { label: "Soberano", color: "text-purple-400" },
              ].map((m, i) => (
                <div key={i} className="bg-papa-card p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center group cursor-pointer hover:border-white/20 transition-all">
                  <div className={`w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${m.color}`}>
                    <Award size={24} />
                  </div>
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-tighter leading-tight">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}