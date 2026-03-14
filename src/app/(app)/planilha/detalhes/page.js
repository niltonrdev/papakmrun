"use client";
import { useState } from "react";
import { getWeekPlan, getAllWeekNumbers, getZones } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PlanilhaDetalhesPage() {
  const [activeWeek, setActiveWeek] = useState("1");
  const week = getWeekPlan(activeWeek);
  const weekNumbers = getAllWeekNumbers();
  const zones = getZones();

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Link href="/planilha" className="text-white/40 hover:text-white flex items-center gap-2 text-xs font-black uppercase">
          <ChevronLeft size={16} /> Voltar para Performance
        </Link>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {weekNumbers.map((num) => (
            <button key={num} onClick={() => setActiveWeek(num)}
              className={`px-6 py-2 rounded-2xl font-black text-xs uppercase transition-all border ${
                activeWeek === num ? "bg-papa-blue text-papa-dark border-papa-blue shadow-[0_0_15px_rgba(0,209,255,0.3)]" : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
              }`}>
              Semana {num}
            </button>
          ))}
        </div>
      </div>

      {/* Cabeçalho Técnico: Objetivo + Zonas (Fiel ao Excel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bloco de Objetivo e Orientações */}
        <div className="lg:col-span-7 bg-papa-card p-8 rounded-3xl border border-white/5 flex flex-col justify-center text-center">
          <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">
            PLANILHA NILTON - OBJETIVO SUB20 5KM
          </h3>
          <div className="space-y-1 text-sm text-white/60 font-medium italic">
            <p>Ritmos são referências.</p>
            <p>Priorize execução correta.</p>
            <p>Descanso faz parte do treino.</p>
            <p className="text-papa-orange font-bold mt-2">Qualquer dor persistente me avise.</p>
          </div>
        </div>

        {/* Bloco de Zonas (Colorido como o original) */}
        <div className="lg:col-span-5 bg-papa-card p-6 rounded-3xl border border-white/5">
          <div className="bg-purple-600 text-center py-1 rounded-t-xl mb-2">
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Zonas de Treinamento</span>
          </div>
          <div className="space-y-1">
            {zones.map(z => (
              <div key={z.key} className="grid grid-cols-3 items-center text-[10px] font-black uppercase">
                <div className={`col-span-2 p-2 rounded-l-lg ${zoneClasses(z.key)} border-r-0`}>{z.label}</div>
                <div className="bg-white/5 p-2 rounded-r-lg border border-white/10 text-white/60 text-center font-mono tracking-tighter">
                  {z.paceMin} - {z.paceMax}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Planilha Semanal */}
      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="bg-papa-blue/10 p-5 border-b border-white/5 text-center">
          <h2 className="text-xl font-black text-white italic uppercase tracking-widest">
            {week.title} — {week.phase}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/40 uppercase">
                <th className="p-4 border-r border-white/5 w-32">Dados</th>
                {week.blocks.map(b => (
                  <th key={b.slug} className="p-4 border-r border-white/5 text-white">{b.dayLabel}</th>
                ))}
                <th className="p-4 text-papa-blue">Total</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr className="border-b border-white/5 align-top">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">Descrição</td>
                {week.blocks.map(b => (
                  <td key={b.slug} className="p-4 border-r border-white/5">
                    <div className="text-[11px] leading-relaxed space-y-1 text-white/70">
                      {b.description.split('. ').map((line, i) => (
                        <p key={i} className="flex gap-2 italic">
                          <span className="text-papa-blue text-[8px] mt-1">•</span> {line}
                        </p>
                      ))}
                    </div>
                  </td>
                ))}
                <td className="p-4"></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">Distância</td>
                {week.blocks.map(b => (
                  <td key={b.slug} className="p-4 border-r border-white/5 text-center text-xl font-black text-white">{b.km}km</td>
                ))}
                <td className="p-4 text-center font-black text-papa-blue text-lg">26km</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">Zona</td>
                {week.blocks.map(b => (
                  <td key={b.slug} className={`p-4 border-r border-white/5 text-center ${zoneClasses(b.zoneKey)}`}>
                    <span className="text-[10px] font-black uppercase">{b.zoneKey}</span>
                  </td>
                ))}
                <td className="p-4"></td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">Pace</td>
                {week.blocks.map(b => (
                  <td key={b.slug} className="p-4 border-r border-white/5 text-center font-mono font-bold text-white/60">04:35 - 04:49</td>
                ))}
                <td className="p-4"></td>
              </tr>
              <tr>
                <td className="p-4 bg-white/5 border-r border-white/5 text-[9px] font-black uppercase text-white/20">Tempo</td>
                {week.blocks.map(b => (
                  <td key={b.slug} className="p-4 border-r border-white/5 text-center font-mono font-bold text-papa-orange">0:38:30</td>
                ))}
                <td className="p-4 text-center font-mono font-black text-white/30 text-[10px]">2:17:44</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}