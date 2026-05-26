"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, Flame, MessageSquare, Search, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import RaceCalendar from "@/features/events/RaceCalendar";
import { findWorkoutInPlanBySlug, getZoneByKey } from "@/features/plans/plans.service";
import { FEED_PHRASES } from "@/features/feed/feed.mock";

const WorkoutMap = dynamic(() => import("@/features/feed/WorkoutMap"), {
  ssr: false,
  loading: () => <div className="aspect-video w-full bg-white/5 animate-pulse rounded-2xl" />,
});

function formatSmartDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "hoje";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function buildDescription(item, idx) {
  if (item.kind === "strava") {
    const km = item.distanceKm != null ? `${item.distanceKm} km` : "";
    const moving =
      item.movingTimeSec != null
        ? new Date(item.movingTimeSec * 1000).toISOString().substr(11, 8).replace(/^00:/, "")
        : null;
    const elev = item.elevationM != null ? `${item.elevationM} m D+` : null;
    return [km, moving, elev].filter(Boolean).join(" · ");
  }
  if (item.note?.trim()) return item.note;
  return FEED_PHRASES[idx % FEED_PHRASES.length];
}

function metaFor(item) {
  if (item.kind === "strava") {
    const km = item.distanceKm != null ? `${item.distanceKm}km` : "—";
    const pace = item.pacePerKm ? `${item.pacePerKm} /km` : "—";
    return `${km} • Pace ${pace}`;
  }
  const found = findWorkoutInPlanBySlug(item.title?.toLowerCase?.());
  const workout = found?.block;
  const zone = workout?.zoneKey ? getZoneByKey(workout.zoneKey) : null;
  const km =
    item.distanceKm != null
      ? `${item.distanceKm}km`
      : workout?.km != null
        ? `${workout.km}km`
        : "—";
  const pace =
    zone?.paceMin && zone?.paceMax ? `${zone.paceMin}–${zone.paceMax}` : "—";
  return `${km} • Pace ${pace}`;
}

function AuthorAvatar({ author, accent }) {
  if (author?.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className={`h-10 w-10 rounded-full border ${accent} object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full border ${accent} text-xs font-black italic`}
    >
      {author?.name?.[0] ?? "?"}
    </div>
  );
}

function PostCard({ it, idx }) {
  const isStrava = it.kind === "strava";
  const accent = isStrava
    ? "border-[#fc4c02]/40 bg-[#fc4c02]/15 text-[#fc4c02]"
    : "border-white/10 bg-white/10 text-white/40";
  const description = buildDescription(it, idx);

  return (
    <article className="rounded-3xl border border-white/5 bg-papa-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AuthorAvatar author={it.author} accent={accent} />
          <div>
            <div className="font-black leading-none text-white">
              {it.author?.name ?? "Atleta"}
            </div>
            {it.title ? (
              <div className="mt-1 text-[11px] font-bold text-white/55">{it.title}</div>
            ) : null}
            <div className="mt-0.5 text-[10px] font-bold uppercase text-white/40">
              {metaFor(it)}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-white/30">
          {formatSmartDate(it.dateISO)}
        </span>
      </div>

      {it.mapPoints && it.mapPoints.length >= 2 ? (
        <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/5 bg-black/40">
          <WorkoutMap points={it.mapPoints} />
        </div>
      ) : null}

      <div className="text-sm text-white/70 leading-relaxed italic">
        &quot;{description}&quot;
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white/40 hover:text-papa-orange transition-colors"
        >
          <Flame size={14} /> Curtir
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase text-white/40 hover:text-papa-blue transition-colors"
        >
          <MessageSquare size={14} /> Comentar
        </button>
      </div>
    </article>
  );
}

export default function FeedPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setEmpty(false);
    try {
      let me = null;
      try {
        const meRes = await fetch("/api/me", { credentials: "include", cache: "no-store" });
        if (meRes.ok) me = await meRes.json();
      } catch {
        /* ignore */
      }

      const [communityRes, stravaRes] = await Promise.all([
        fetch("/api/feed/community", { credentials: "include", cache: "no-store" }).catch(
          () => null
        ),
        fetch("/api/strava/feed", { credentials: "include", cache: "no-store" }).catch(
          () => null
        ),
      ]);

      let community = [];
      if (communityRes?.ok) {
        const j = await communityRes.json();
        community = Array.isArray(j.items) ? j.items : [];
      }

      const cutoffMs = Date.now() - 7 * 86400 * 1000;
      const within7d = (iso) => {
        if (!iso) return false;
        const t = new Date(`${iso}T12:00:00`).getTime();
        return Number.isFinite(t) && t >= cutoffMs;
      };

      let stravaSelf = [];
      if (stravaRes?.ok) {
        const s = await stravaRes.json();
        const author = {
          id: me?.user?.id || "self",
          name:
            s.authorName ||
            me?.profile?.display_name ||
            (me?.user?.email ? String(me.user.email).split("@")[0] : "Você"),
          avatarUrl: me?.profile?.avatar_url || null,
        };
        stravaSelf = (Array.isArray(s.activities) ? s.activities : [])
          .filter((a) => within7d(a.dateISO))
          .map((a) => ({
            kind: "strava",
            id: `self-strava-${a.stravaId ?? a.id}`,
            dateISO: a.dateISO,
            createdAt: a.startAt || a.dateISO,
            title: a.name || "Corrida",
            distanceKm: a.distanceKm ?? null,
            movingTimeSec: a.movingTimeSec ?? null,
            pacePerKm: a.pacePerKm ?? null,
            elevationM: a.elevationM ?? null,
            note: "",
            author,
            mapPoints: Array.isArray(a.mapPoints) && a.mapPoints.length >= 2 ? a.mapPoints : null,
          }));
      }

      const seen = new Set();
      const merged = [];
      for (const it of [...stravaSelf, ...community]) {
        const key =
          it.kind === "strava"
            ? `${it.author?.id || "?"}::${it.dateISO || ""}::${it.distanceKm ?? "?"}`
            : it.id;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(it);
      }

      merged.sort((a, b) => {
        const ka = `${a.dateISO || ""}T${(a.createdAt || "").slice(11, 19) || "00:00:00"}`;
        const kb = `${b.dateISO || ""}T${(b.createdAt || "").slice(11, 19) || "00:00:00"}`;
        return kb.localeCompare(ka);
      });

      setItems(merged);
      setEmpty(merged.length === 0);
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-white/20 uppercase tracking-widest mb-1">PapaKM</h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic break-words leading-tight">
            Feed Social e Comunidade
          </h2>
          <p className="text-[10px] text-white/30 font-bold uppercase mt-2">
            Fonte: check-ins e corridas Strava da comunidade — últimos 7 dias
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
          <div className="p-5 rounded-3xl bg-papa-card border border-white/5 flex items-center justify-between group cursor-pointer hover:border-papa-blue/20 transition-all">
            <span className="text-xs font-bold text-white/40 uppercase">
              Notícias do dia: <span className="text-white">Leia o The News</span>
            </span>
            <span className="text-white/20 group-hover:text-papa-blue">→</span>
          </div>

          {loading && filtered.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">
              Carregando feed…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">
              {empty
                ? "Nenhuma atividade ainda. Faça um check-in ou conecte o Strava."
                : "Nenhuma atividade encontrada"}
            </div>
          ) : (
            filtered.map((it, idx) => <PostCard key={it.id} it={it} idx={idx} />)
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
                <div className="text-2xl font-black text-white mt-1">87</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1">
                  <Activity size={10} /> Treinos
                </div>
                <div className="text-2xl font-black text-white mt-1">32</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
