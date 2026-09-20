"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Construction, Flame, Search, RotateCcw } from "lucide-react";
import RaceCalendar from "@/features/events/RaceCalendar";
import DailyWordCard from "@/features/feed/DailyWordCard";
import CheckinPostCard from "@/features/feed/CheckinPostCard";

const FEED_COMING_SOON = false;

function FeedComingSoon() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
      <header>
        <h1 className="text-xs sm:text-sm font-bold text-white/20 uppercase tracking-widest mb-1">
          PapaKM
        </h1>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic break-words leading-tight">
          Feed Social e Comunidade
        </h2>
      </header>

      <div className="rounded-3xl border border-dashed border-papa-blue/30 bg-papa-card p-10 sm:p-14 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-papa-blue/10 border border-papa-blue/20">
          <Construction className="text-papa-blue" size={32} />
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          Novo feed em construção
        </h3>
        <p className="mt-4 max-w-md mx-auto text-sm text-white/50 leading-relaxed">
          Estamos montando a nova versão do feed da comunidade. Por enquanto, use o{" "}
          <strong className="text-white/70">Início</strong> e a{" "}
          <strong className="text-white/70">Performance</strong> para acompanhar seus treinos.
        </p>
      </div>
    </div>
  );
}

export default function FeedPage() {
  if (FEED_COMING_SOON) return <FeedComingSoon />;
  return <FeedPageActive />;
}

function FeedPageActive() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    try {
      const communityRes = await fetch("/api/feed/community", {
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);

      let list = [];
      if (communityRes?.ok) {
        const j = await communityRes.json();
        list = Array.isArray(j.items) ? j.items : [];
      }

      setItems(list);
      setEmpty(list.length === 0);
    } catch {
      setItems([]);
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (it) =>
        (it.author?.name || "").toLowerCase().includes(query) ||
        (it.title || "").toLowerCase().includes(query)
    );
  }, [items, q]);

  const weekKmTotal = useMemo(
    () =>
      items.reduce((acc, it) => {
        const n = Number(it.distanceKm);
        return acc + (Number.isFinite(n) ? n : 0);
      }, 0),
    [items]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-white/20 uppercase tracking-widest mb-1">
            PapaKM
          </h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic break-words leading-tight">
            Feed Social e Comunidade
          </h2>
          <p className="text-[10px] text-white/30 font-bold uppercase mt-2">
            Check-ins da planilha — últimos 7 dias
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar atletas..."
              className="pl-12 pr-6 py-3 rounded-2xl bg-papa-card border border-white/5 text-sm outline-none focus:border-papa-blue/30 w-full md:w-64"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="shrink-0 p-3 rounded-2xl bg-papa-card border border-white/5 text-white/40 hover:text-white disabled:opacity-50"
            aria-label="Atualizar feed"
          >
            <RotateCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <DailyWordCard />

          {loading && filtered.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">
              Carregando feed…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">
              {empty
                ? "Nenhum treino concluído nos últimos 7 dias."
                : "Nenhuma atividade encontrada"}
            </div>
          ) : (
            filtered.map((it) => <CheckinPostCard key={it.id} it={it} />)
          )}
        </div>

        <aside className="lg:col-span-5 space-y-8">
          <RaceCalendar />

          <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-6">
              Destaques do grupo
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1">
                  <Flame size={10} /> Curtidas
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {items.reduce((acc, it) => acc + (Number(it.likeCount) || 0), 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1">
                  <Activity size={10} /> Treinos
                </div>
                <div className="text-2xl font-black text-white mt-1">{items.length}</div>
              </div>
              <div className="col-span-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/20 uppercase">
                  Km nos últimos 7 dias
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {Math.round(weekKmTotal * 10) / 10}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
