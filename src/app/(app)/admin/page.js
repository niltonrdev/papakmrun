"use client";
import { useState } from "react";
import { 
  Users, AlertTriangle, Play, Calendar, 
  Search, Bell, Plus, ChevronRight, FileText, Settings2
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("alunos");

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-sm font-bold text-white/20 uppercase tracking-widest mb-1">Painel do Professor</h1>
          <h2 className="text-4xl font-black text-white italic uppercase">Gestão de Performance</h2>
        </div>
      </header>

      {/* Widgets Superiores (Mantidos para Visão Geral) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-papa-card p-6 rounded-3xl border border-white/5">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Users size={20}/></div>
              <span className="text-[10px] font-black text-white/30 uppercase">Atletas Ativos</span>
           </div>
           <div className="text-3xl font-black text-white italic">24/32</div>
        </div>
        {/* Adicione os outros widgets de Feedback de Dor e Testes Pendentes conforme código anterior */}
      </div>

      {/* 1. Tabela de Gestão de Alunos (Novo Padrão) */}
      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <Users size={16} className="text-papa-blue" /> Lista de Atletas
          </h3>
          <div className="relative">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"/>
             <input placeholder="Buscar aluno..." className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white outline-none w-64"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                <th className="p-6">Nome</th>
                <th className="p-6">Objetivo Principal</th>
                <th className="p-6">Último Teste</th>
                <th className="p-6">Saúde</th>
                <th className="p-6">Status Planilha</th>
                <th className="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { name: "Nilton Rodrigues", goal: "Sub 20min 5km", test: "12:45 (3km)", health: "Apto", status: "Semana 7", color: "text-emerald-400" },
                { name: "Bruno Costa", goal: "Primeiros 5km", test: "07:35 (1km)", health: "Atestado Vencido", status: "Atrasado", color: "text-papa-orange" },
              ].map((aluno, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6 text-xs font-black text-white">{aluno.name}</td>
                  <td className="p-6 text-[10px] text-white/40 font-bold uppercase italic">{aluno.goal}</td>
                  <td className="p-6 text-xs font-mono font-bold text-papa-blue">{aluno.test}</td>
                  <td className="p-6">
                    <span className={`text-[10px] font-black ${aluno.color}`}>{aluno.health}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60">{aluno.status}</span>
                  </td>
                  <td className="p-6 text-right">
                    <Link href={`/admin/aluno/${aluno.name.toLowerCase().replace(' ', '-')}`} className="bg-papa-orange text-papa-dark px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:scale-105 transition-transform inline-flex items-center gap-2">
                      Abrir <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Gestão de Provas e Avisos (Nova Div) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-papa-card rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-papa-orange" /> Provas do Grupo
            </h3>
            <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white"><Plus size={16}/></button>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">Meia de Brasília</p>
                <p className="text-[10px] text-white/20 font-bold uppercase">24 de Maio • Eixão Lazer</p>
              </div>
              <span className="text-[9px] font-black px-2 py-1 bg-papa-blue/10 text-papa-blue rounded-lg">12 Atletas</span>
            </div>
          </div>
        </div>

        <div className="bg-papa-card rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-papa-blue" /> Avisos Gerais
            </h3>
            <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white"><Plus size={16}/></button>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 italic text-xs text-white/40">
            Nenhum aviso ativo para os alunos no momento...
          </div>
        </div>
      </div>

      {/* 3. Biblioteca do Professor */}
      <div className="bg-papa-card rounded-3xl border border-white/5 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" /> Biblioteca de Templates
          </h3>
          <button className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl hover:bg-white/10 transition-all">
            Criar Planilha do Zero +
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Base 8 Semanas", "Base 12 Semanas", "Pico 16 Semanas", "Manutenção"].map((temp, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/5 group hover:border-papa-blue/40 cursor-pointer transition-all">
              <Settings2 size={20} className="text-white/20 group-hover:text-papa-blue mb-4 transition-colors" />
              <p className="text-[10px] font-black text-white uppercase leading-tight">{temp}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}