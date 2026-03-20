"use client";
import { useState } from "react";
import { 
  ChevronLeft, Calculator, Save, 
  FileText, Activity, Calendar, History, ChevronDown 
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function DetalheAlunoPage() {
  const { slug } = useParams();
  
  // Estado para o teste de 3km (Tempo em MM:SS)
  const [distanciaTeste, setDistanciaTeste] = useState(3);
  const [tempoTeste, setTempoTeste] = useState();
  const [zonas, setZonas] = useState(null);

  const calcularZonas = () => {
    const [min, sec] = tempoTeste.split(":").map(Number);
    const tempoDecimalMin = min + (sec / 60);
    
    // 1. Velocidade do Teste (km/h)
    const vTeste = (distanciaTeste / tempoDecimalMin) * 60;
    
    // 2. Velocidade de Referência (Vref) - Ajuste conforme planilha
    // Se for 3km, a Vref é a própria velocidade do teste. 
    const vRef = vTeste;

    const formatPaceFromSpeed = (speedKmH) => {
      if (speedKmH <= 0) return "0:00";
      const paceDecimal = 60 / speedKmH;
      const pMin = Math.floor(paceDecimal);
      const pSec = Math.round((paceDecimal - pMin) * 60);
      return `${pMin}:${pSec < 10 ? '0' : ''}${pSec}`;
    };

    setZonas({
      z1: { label: "Z1 - Regenerativo", color: "bg-blue-500", pace: `${formatPaceFromSpeed(vRef * 0.78)} - ${formatPaceFromSpeed(vRef * 0.72)}` },
      z2: { label: "Z2 - Fácil", color: "bg-emerald-500", pace: `${formatPaceFromSpeed(vRef * 0.85)} - ${formatPaceFromSpeed(vRef * 0.79)}` },
      z3: { label: "Z3 - Moderado", color: "bg-yellow-500", pace: `${formatPaceFromSpeed(vRef * 0.92)} - ${formatPaceFromSpeed(vRef * 0.86)}` },
      z4: { label: "Z4 - Limiar", color: "bg-orange-500", pace: `${formatPaceFromSpeed(vRef * 1.00)} - ${formatPaceFromSpeed(vRef * 0.93)}` },
      z5: { label: "Z5 - Vo2Max", color: "bg-red-600", pace: `${formatPaceFromSpeed(vRef * 1.10)} - ${formatPaceFromSpeed(vRef * 1.01)}` },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header de Navegação */}
      <div className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 text-white/40 hover:text-papa-blue transition-colors font-black uppercase text-[10px] tracking-widest">
          <ChevronLeft size={16} /> Voltar para Gestão
        </Link>
        <button className="bg-emerald-500 text-papa-dark px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
          <Save size={14} /> Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Esquerda: Dados e Zonas */}
        <div className="lg:col-span-4 space-y-6">
        <div className="bg-papa-card p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <h2 className="text-xl font-black text-white italic uppercase mb-6 leading-none">Calculadora de Zonas</h2>
            
            <div className="space-y-6">
            {/* 1. Seletor de Distância do Teste */}
            <div>
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 block">Distância do Teste</label>
                <div className="grid grid-cols-4 gap-2">
                {[1, 2.4, 3, 5].map((d) => (
                    <button 
                    key={d} 
                    onClick={() => setDistanciaTeste(d)}
                    className={`py-2 rounded-xl text-[10px] font-black border transition-all ${
                        distanciaTeste === d ? "bg-papa-blue text-papa-dark border-papa-blue" : "bg-white/5 text-white/40 border-white/5"
                    }`}
                    >
                    {d === 2.4 ? "2.4K" : `${d}K`}
                    </button>
                ))}
                </div>
            </div>

            {/* 2. Entrada de Tempo (MM:SS) */}
            <div>
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 block">Tempo Total do Teste</label>
                <div className="flex gap-2">
                <input 
                    type="text" 
                    value={tempoTeste} 
                    onChange={(e) => setTempoTeste(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono outline-none focus:border-papa-blue transition-all"
                    placeholder="00:00"
                />
                <button 
                    onClick={calcularZonas} 
                    className="p-3 bg-papa-blue rounded-2xl text-papa-dark hover:scale-105 transition-all shadow-lg shadow-papa-blue/20"
                    title="Calcular Paces"
                >
                    <Calculator size={20} />
                </button>
                </div>
            </div>

            {/* 3. Exibição dos Resultados (Paces Calculados) */}
            {zonas && (
              <div className="pt-6 space-y-2 lg:space-y-3 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                {Object.entries(zonas).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${value.color} shadow-[0_0_10px_currentColor]`} />
                        <span className="text-[10px] font-black text-white/40 uppercase group-hover:text-white transition-colors">
                        {value.label}
                        </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white tracking-tighter">
                        {value.pace}
                    </span>
                    </div>
                ))}
                </div>
            )}
            </div>
        </div>
        </div>

        {/* Coluna Direita: Planilha e Templates */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-papa-card p-8 rounded-[40px] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white italic uppercase flex items-center gap-3">
                <FileText className="text-papa-orange" /> Planilha do Aluno
            </h2>
            
            {/* Seletor de Templates */}
            <div className="relative w-full lg:w-auto"> {/* w-full no mobile, w-auto no desktop */}
                <select 
                    className="w-full lg:w-auto bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase outline-none focus:border-papa-blue/40 appearance-none pr-10 cursor-pointer transition-all hover:bg-white/10"
                >
                    <option className="bg-papa-card text-white">Escolher Template...</option>
                    <option className="bg-papa-card text-white">8 Semanas - Base</option>
                    <option className="bg-papa-card text-white">12 Semanas - Intermediário</option>
                    <option className="bg-papa-card text-white">16 Semanas - Performance</option>
                </select>

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                <ChevronDown size={14} />
                </div>
            </div>
            </div>
            {/* Placeholder do Editor Massivo */}
            <div className="min-h-[400px] border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center p-10">
              <Activity size={48} className="text-white/10 mb-4" />
              <p className="text-sm font-bold text-white/40 uppercase tracking-tighter italic">Selecione um template ou<br/>comece a criar os treinos do zero</p>
              <button className="mt-6 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10">
                Adicionar Semana +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}