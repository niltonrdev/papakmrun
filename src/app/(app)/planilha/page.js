"use client";
import { useState } from "react";
import { getWeekPlan, getAllWeekNumbers } from "@/features/plans/plans.service";
import { BarChart3, Activity, HeartPulse, ChevronRight, Trophy, Timer, Medal } from "lucide-react";
import Link from "next/link";

function StatCard({ title, value, icon: Icon, unit }) {
  return (
    <div className="bg-papa-card p-5 rounded-3xl border border-white/5 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="text-papa-blue w-3 h-3 opacity-50" />
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        {unit && <span className="text-[10px] text-white/30 font-bold uppercase">{unit}</span>}
      </div>
    </div>
  );
}

function PersonalRecord({ label, time, pace, date }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-papa-orange/10 flex items-center justify-center text-papa-orange">
          <Medal size={18} />
        </div>
        <div>
          <div className="text-sm font-black text-white">{label}</div>
          <div className="text-[10px] text-white/30 font-bold uppercase">{date}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono font-black text-white">{time}</div>
        <div className="text-[10px] text-white/30 font-bold">{pace} /km</div>
      </div>
    </div>
  );
}

function EvolutionChart() {
  // Pontos do gráfico (escala 0-100 para o SVG)
  const currentPath = "M 0 80 Q 25 20 50 50 T 100 30"; 
  const lastPath = "M 0 90 Q 30 70 60 85 T 100 75";

  return (
    <div className="rounded-3xl bg-papa-card p-8 border border-white/5 mt-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
            Gráfico de Evolução
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-widest">
            Volume e Consistência (km)
          </p>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-papa-blue shadow-[0_0_10px_rgba(0,209,255,0.6)]" />
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Atual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-papa-orange shadow-[0_0_10px_rgba(255,107,0,0.6)]" />
            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Anterior</span>
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full group">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00d1ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00d1ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff6b00" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
          ))}

          <path d={`${lastPath} L 100 100 L 0 100 Z`} fill="url(#gradOrange)" />
          <path d={lastPath} fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          <path d={`${currentPath} L 100 100 L 0 100 Z`} fill="url(#gradBlue)" />
          <path d={currentPath} fill="none" stroke="#00d1ff" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
        </svg>

        <div className="absolute -bottom-6 inset-x-0 flex justify-between text-[10px] text-white/20 font-black uppercase tracking-widest px-1">
          <span>Sem 1</span>
          <span>Sem 2</span>
          <span>Sem 3</span>
          <span>Sem 4</span>
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const [activeWeek, setActiveWeek] = useState("1");
  const week = getWeekPlan(activeWeek);
  const weekNumbers = getAllWeekNumbers();

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header>
        <h2 className="text-4xl font-black text-white italic uppercase italic">Performance</h2>
      </header>

      {/* 1. KPIs Superiores (Volume, Sessões, etc) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Volume Mensal" value="128" icon={BarChart3} unit="km" />
        <StatCard title="Sessões" value="14" icon={Activity} />
        <StatCard title="Status Saúde" value="Apto" icon={HeartPulse} />
        <StatCard title="Pace Médio" value="5:12" icon={BarChart3} unit="/km" />
      </div>

      {/* 2. Gráfico de Evolução */}
      <EvolutionChart />

      {/* 3. Pré-visualização da Planilha */}
      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
              Planilha Semanal
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{week.title}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <p className="text-[10px] text-papa-blue font-bold uppercase tracking-widest">Fase: {week.phase}</p>
            </div>
          </div>
          
          <Link href="/planilha/detalhes" className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl flex items-center gap-2 transition-all self-start border border-white/5">
            Abrir Planilha Full <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-white/5">
              {week.blocks.map((b) => (
                <tr key={b.slug}>
                  <td className="py-4 text-[10px] font-black text-white/30 uppercase w-20">{b.dayLabel}</td>
                  <td className="py-4 text-xs font-bold text-white">{b.title} • {b.km}km</td>
                  <td className="py-4 text-right">
                    <span className="text-[9px] font-black uppercase px-2 py-1 rounded bg-white/5 text-papa-blue border border-white/10">
                      {b.zoneKey}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Previsões e Melhores Marcas (Estilo Strava) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Previsões */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Timer size={16} /> Previsões de Desempenho
          </h3>
          <div className="grid grid-cols-1 gap-4">
             <div className="p-6 rounded-3xl bg-papa-card border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl border-2 border-papa-orange flex items-center justify-center font-black text-papa-orange italic">5K</div>
                   <div>
                      <div className="text-2xl font-black text-white">20:53</div>
                      <div className="text-xs text-white/40 font-bold">Pace: 4:11 /km</div>
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[10px] text-emerald-400 font-black uppercase">▼ 1s</div>
                   <div className="text-[10px] text-white/20 font-bold">Últimos 30 dias</div>
                </div>
             </div>
             {/* Adicione 10k, 21k conforme necessário */}
          </div>
        </div>

        {/* Recordes Pessoais */}
        <div className="space-y-6">
          <h3 className="text-sm font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Trophy size={16} /> Melhores Marcas
          </h3>
          <div className="space-y-3">
            <PersonalRecord label="15 km" time="1:22:03" pace="5:28" date="21 de fev. de 2026" />
            <PersonalRecord label="10 km" time="47:58" pace="4:48" date="31 de jan. de 2026" />
            <PersonalRecord label="400 m" time="1:18" pace="3:15" date="5 de nov. de 2025" />
          </div>
        </div>
      </div>
    </div>
  );
}