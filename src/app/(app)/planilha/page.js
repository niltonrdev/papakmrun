"use client";
import { getWeekPlan, getZones } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { useState } from "react";
import CheckinModal from "@/features/checkins/CheckinModal";
import { isWorkoutChecked } from "@/features/checkins/checkins.service";
import { Calculator, BarChart3, HeartPulse, Activity } from "lucide-react";

function StatCard({ title, value, icon: Icon, unit }) {
  return (
    <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">{title}</span>
        <Icon className="text-papa-blue w-4 h-4 opacity-50" />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-white">{value}</span>
        {unit && <span className="text-xs text-white/30 font-bold uppercase">{unit}</span>}
      </div>
    </div>
  );
}

function WorkoutRow({ item }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const checked = done || isWorkoutChecked(item.workoutDateISO, item.slug);

  return (
    <div className="group rounded-3xl border border-white/5 bg-papa-card p-6 hover:border-white/20 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center">
            <span className="text-[10px] text-white/30 font-black uppercase leading-none">{item.dayLabel}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-black text-white leading-none">{item.title}</h3>
              <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase border ${zoneClasses(item.zoneKey)}`}>
                {item.zoneKey}
              </span>
            </div>
            <p className="text-sm text-white/40 font-medium">{item.km} km • {item.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-white/20 font-black block uppercase">Pace Alvo</span>
            <span className="text-white font-mono font-bold tracking-tighter">04:35 – 04:49</span>
          </div>
          <button
            onClick={() => setOpen(true)}
            disabled={checked}
            className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all shadow-lg ${
              checked 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                : "bg-white/5 text-white/80 border border-white/10 hover:bg-papa-orange hover:text-white"
            }`}
          >
            {checked ? "Concluído" : "Check-in"}
          </button>
        </div>
      </div>

      <CheckinModal open={open} onClose={() => setOpen(false)} workout={item} onSaved={() => setDone(true)} />
    </div>
  );
}

function EvolutionChart() {
  // Pontos do gráfico (0 a 100 para escala do SVG)
  // Mês Atual (Azul): Base -> Pico -> Vale -> Estabilização
  const currentPath = "M 0 80 Q 25 20 50 50 T 100 30"; 
  // Mês Anterior (Laranja): Mais linear e baixo
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
        {/* SVG do Gráfico */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Definições de Gradiente */}
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

          {/* Linhas de Grade Horizontais */}
          {[25, 50, 75].map(y => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
          ))}

          {/* Área e Linha Mês Anterior */}
          <path d={`${lastPath} L 100 100 L 0 100 Z`} fill="url(#gradOrange)" />
          <path d={lastPath} fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Área e Linha Mês Atual */}
          <path d={`${currentPath} L 100 100 L 0 100 Z`} fill="url(#gradBlue)" />
          <path d={currentPath} fill="none" stroke="#00d1ff" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]" />
          
          {/* Pontos de destaque na linha azul */}
          {[0, 50, 100].map((x, i) => {
            const y = i === 0 ? 80 : i === 1 ? 50 : 30;
            return <circle key={i} cx={x} cy={y} r="1.5" fill="#00d1ff" className="animate-pulse" />;
          })}
        </svg>

        {/* Labels das Semanas */}
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

export default function PlanilhaPage() {
  const [activeWeek, setActiveWeek] = useState("1");
  const week = getWeekPlan(activeWeek);
  const weekNumbers = ["1", "2", "3", "4"];
  const zones = getZones();
  const totalKm = week.blocks.reduce((sum, b) => sum + (b.km ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <header>
        <h1 className="text-sm font-bold text-white/20 uppercase tracking-widest leading-none mb-2">PapaKM</h1>
        <h2 className="text-4xl font-black text-white italic">Planilha e Performance</h2>
      </header>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {weekNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setActiveWeek(num)}
              className={`px-6 py-2 rounded-2xl font-black text-xs uppercase transition-all border ${
                activeWeek === num 
                  ? "bg-papa-blue text-papa-dark border-papa-blue shadow-[0_0_15px_rgba(0,209,255,0.3)]" 
                  : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
              }`}
            >
              Semana {num}
            </button>
          ))}
        </div>
      {/* Grid de Estatísticas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Volume Mensal" value="128" icon={BarChart3} unit="km" />
        <StatCard title="Sessões" value="14" icon={Activity} />
        <StatCard title="Status Saúde" value="Apto" icon={HeartPulse} />
        <StatCard title="Pace Médio" value="5:12" icon={BarChart3} unit="/km" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">
                {week.title}
              </h3>
              {/* Badge da Fase: Cor muda conforme o texto */}
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border shadow-lg ${
                week.phase === 'Base' 
                  ? 'border-blue-400/30 bg-blue-500/10 text-blue-400 shadow-blue-500/10' 
                  : week.phase === 'Polimento' 
                  ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-400 shadow-yellow-500/10' 
                  : 'border-papa-orange/30 bg-papa-orange/10 text-papa-orange shadow-papa-orange/10'
              }`}>
                Fase: {week.phase}
              </span>
            </div>
            
            <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black text-white/50 uppercase self-start md:self-center">
              Total: {totalKm} km
            </span>
          </div>
          
          <div className="space-y-4">
            {week.blocks.map((b) => (
              <WorkoutRow key={b.slug} item={b} />
            ))}
          </div>
          <EvolutionChart />
        </div>
        

        {/* Lateral: Calculadora de Zonas */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">Calculadora de Zonas</h3>
              <Calculator className="text-papa-blue w-5 h-5" />
            </div>
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.key} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${zoneClasses(z.key)}`}>{z.key}</span>
                  <span className="text-white font-mono text-sm font-bold tracking-tighter">{z.paceMin} – {z.paceMax}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}