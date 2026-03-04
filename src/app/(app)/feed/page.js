"use client";
import { useEffect, useMemo, useState } from "react";
import { readAllCheckins, clearAllCheckins } from "@/features/checkins/checkins.storage";
import { getWeekPlan, getZoneByKey } from "@/features/plans/plans.service";
import { zoneClasses } from "@/features/plans/zones.ui";
import { FEED_AUTHORS, FEED_PHRASES } from "@/features/feed/feed.mock";
import RaceCalendar from "@/features/events/RaceCalendar"; // Aproveitando o componente que já criamos
import { Flame, MessageSquare, Search, RotateCcw, Trash2 } from "lucide-react";

/**
 * Util: yyyy-mm-dd -> "Hoje", "Ontem" ou "dd/mm"
 */
function formatSmartDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "hoje";
  return d.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
}

function buildFeedItemsFromCheckins(checkins) {
  const week = getWeekPlan?.() ?? null;
  const blocks = week?.blocks ?? [];
  const items = (checkins || []).map((c, idx) => {
    const workout = blocks.find((b) => b.slug === c.workoutSlug);
    const author = FEED_AUTHORS[idx % FEED_AUTHORS.length];
    const phrase = FEED_PHRASES[idx % FEED_PHRASES.length];
    return {
      id: `${c.date}-${c.workoutSlug}-${idx}`,
      dateISO: c.date,
      title: workout?.title ?? "Treino",
      km: workout?.km ?? "8.2", // Mockando KM se não houver
      pace: "5:10", // Mockando Pace conforme protótipo
      zoneKey: workout?.zoneKey ?? "z2",
      effort: c.effort ?? null,
      note: c.note ?? "",
      author,
      phraseIfNoNote: phrase,
    };
  });
  return items.sort((a, b) => String(b.dateISO).localeCompare(String(a.dateISO)));
}

function PostCard({ it }) {
  return (
    <article className="rounded-3xl border border-white/5 bg-papa-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center italic text-white/40">
            {it.author[0]}
          </div>
          <div>
            <div className="font-black text-white leading-none">{it.author}</div>
            <div className="text-[10px] text-white/40 font-bold uppercase mt-1">
              {it.km}km • Pace {it.pace}
            </div>
          </div>
        </div>
        <span className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black text-white/30 uppercase">
          {formatSmartDate(it.dateISO)}
        </span>
      </div>

      <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-white/10">
        {/* Placeholder para imagem do treino ou mapa */}
        <div className="text-xs font-black uppercase tracking-widest italic">Atividade: {it.title}</div>
      </div>

      <div className="text-sm text-white/70 leading-relaxed italic">
        "{it.note?.trim() ? it.note : it.phraseIfNoNote}"
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white/40 hover:text-papa-orange transition-colors">
          <Flame size={14} /> Curtir
        </button>
        <button className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white/40 hover:text-papa-blue transition-colors">
          <MessageSquare size={14} /> Comentar
        </button>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  const refresh = () => setItems(buildFeedItemsFromCheckins(readAllCheckins()));
  const clearDemo = () => { clearAllCheckins(); refresh(); };

  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return query ? items.filter(it => it.author.toLowerCase().includes(query) || it.title.toLowerCase().includes(query)) : items;
  }, [items, q]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-sm font-bold text-white/20 uppercase tracking-widest mb-1">PapaKM</h1>
          <h2 className="text-4xl font-black text-white italic">Feed Social e Comunidade</h2>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar atletas..."
              className="pl-12 pr-6 py-3 rounded-2xl bg-papa-card border border-white/5 text-sm outline-none focus:border-papa-blue/30 w-64"
            />
          </div>
          <button onClick={refresh} className="p-3 rounded-2xl bg-papa-card border border-white/5 text-white/40 hover:text-white"><RotateCcw size={18}/></button>
          <button onClick={clearDemo} className="p-3 rounded-2xl bg-papa-card border border-white/5 text-white/40 hover:text-red-400"><Trash2 size={18}/></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna Central: Posts */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-3xl bg-papa-card border border-white/5 flex items-center justify-between group cursor-pointer hover:border-papa-blue/20 transition-all">
             <span className="text-xs font-bold text-white/40 uppercase">Notícias do dia: <span className="text-white">Leia o The News</span></span>
             <span className="text-white/20 group-hover:text-papa-blue">→</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">Nenhuma atividade encontrada</div>
          ) : (
            filtered.map(it => <PostCard key={it.id} it={it} />)
          )}
        </div>

        {/* Coluna Lateral: Widgets */}
        <aside className="lg:col-span-5 space-y-8">
          <RaceCalendar />

          <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
             <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-6">Destaques do grupo</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                   <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1"><Flame size={10}/> Curtidas</div>
                   <div className="text-2xl font-black text-white mt-1">87</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                   <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1"><Activity size={10}/> Treinos</div>
                   <div className="text-2xl font-black text-white mt-1">32</div>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Icone Activity que faltou no import da lucide
import { Activity } from "lucide-react";