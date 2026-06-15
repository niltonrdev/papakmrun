"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Construction,
  Flame,
  MessageSquare,
  Search,
  RotateCcw,
  Send,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
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

function formatCreatedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function AuthorAvatar({ author, accent, size = "h-10 w-10" }) {
  if (author?.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className={`${size} rounded-full border ${accent} object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full border ${accent} text-xs font-black italic`}
    >
      {author?.name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

function CommentList({ items, busy }) {
  if (busy && items.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/40">
        <Loader2 size={12} className="animate-spin" /> Carregando comentários…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="text-[11px] text-white/30 italic">
        Seja o primeiro a comentar.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => {
        const href = c.author?.id ? `/atleta/${c.author.id}` : null;
        return (
          <li key={c.id} className="flex items-start gap-3">
            {href ? (
              <Link href={href} className="shrink-0">
                <AuthorAvatar
                  author={c.author}
                  accent="border-white/10"
                  size="h-8 w-8"
                />
              </Link>
            ) : (
              <AuthorAvatar
                author={c.author}
                accent="border-white/10"
                size="h-8 w-8"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {href ? (
                  <Link
                    href={href}
                    className="text-[11px] font-black text-white hover:text-papa-blue"
                  >
                    {c.author?.name || "Atleta"}
                  </Link>
                ) : (
                  <span className="text-[11px] font-black text-white">
                    {c.author?.name || "Atleta"}
                  </span>
                )}
                <span className="text-[10px] text-white/30">
                  {formatCreatedAt(c.createdAt)}
                </span>
              </div>
              <p className="mt-1 break-words text-[12px] leading-relaxed text-white/75 whitespace-pre-wrap">
                {c.body}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PostCard({ it, idx }) {
  const isStrava = it.kind === "strava";
  const accent = isStrava
    ? "border-[#fc4c02]/40 bg-[#fc4c02]/15 text-[#fc4c02]"
    : "border-white/10 bg-white/10 text-white/40";
  const description = buildDescription(it, idx);

  const [liked, setLiked] = useState(Boolean(it.likedByMe));
  const [likeCount, setLikeCount] = useState(Number(it.likeCount) || 0);
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(it.commentCount) || 0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLiked(Boolean(it.likedByMe));
    setLikeCount(Number(it.likeCount) || 0);
    setCommentCount(Number(it.commentCount) || 0);
  }, [it.likedByMe, it.likeCount, it.commentCount]);

  const profileHref = it.author?.id ? `/atleta/${it.author.id}` : null;
  const canEngage = Boolean(it.activityId) && Boolean(it.activityKind);

  const toggleLike = useCallback(async () => {
    if (!canEngage || likeBusy) return;
    setLikeBusy(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    try {
      const res = await fetch("/api/feed/likes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityKind: it.activityKind,
          activityId: it.activityId,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao curtir.");
      setLiked(Boolean(j.likedByMe));
      setLikeCount(Number(j.likeCount) || 0);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  }, [canEngage, likeBusy, liked, likeCount, it.activityId, it.activityKind]);

  const loadComments = useCallback(async () => {
    if (!canEngage) return;
    setCommentsLoading(true);
    try {
      const res = await fetch(
        `/api/feed/comments?activityKind=${encodeURIComponent(it.activityKind)}&activityId=${encodeURIComponent(it.activityId)}`,
        { credentials: "include", cache: "no-store" }
      );
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao carregar.");
      const list = Array.isArray(j.items) ? j.items : [];
      setComments(list);
      setCommentCount(list.length);
      setCommentsLoaded(true);
    } catch {
      /* ignore */
    } finally {
      setCommentsLoading(false);
    }
  }, [canEngage, it.activityId, it.activityKind]);

  function toggleComments() {
    setCommentsOpen((open) => {
      const next = !open;
      if (next && !commentsLoaded) loadComments();
      if (next) {
        setTimeout(() => textareaRef.current?.focus(), 80);
      }
      return next;
    });
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!canEngage) return;
    const text = commentDraft.trim();
    if (!text || commentBusy) return;
    setCommentBusy(true);
    setCommentError(null);
    try {
      const res = await fetch("/api/feed/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityKind: it.activityKind,
          activityId: it.activityId,
          body: text,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao comentar.");
      if (j?.item) {
        setComments((prev) => [...prev, j.item]);
        setCommentCount((c) => c + 1);
      }
      setCommentDraft("");
    } catch (err) {
      setCommentError(err?.message || "Falha ao comentar.");
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <article className="rounded-3xl border border-white/5 bg-papa-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {profileHref ? (
            <Link href={profileHref} className="shrink-0">
              <AuthorAvatar author={it.author} accent={accent} />
            </Link>
          ) : (
            <AuthorAvatar author={it.author} accent={accent} />
          )}
          <div className="min-w-0">
            {profileHref ? (
              <Link
                href={profileHref}
                className="font-black leading-none text-white hover:text-papa-blue transition-colors block truncate"
              >
                {it.author?.name ?? "Atleta"}
              </Link>
            ) : (
              <div className="font-black leading-none text-white truncate">
                {it.author?.name ?? "Atleta"}
              </div>
            )}
            {it.title ? (
              <div className="mt-1 text-[11px] font-bold text-white/55 truncate">
                {it.title}
              </div>
            ) : null}
            <div className="mt-0.5 text-[10px] font-bold uppercase text-white/40">
              {metaFor(it)}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-white/30">
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
          onClick={toggleLike}
          disabled={!canEngage || likeBusy}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase transition-colors disabled:opacity-50 ${
            liked
              ? "bg-papa-orange/15 border-papa-orange/40 text-papa-orange"
              : "bg-white/5 border-white/5 text-white/40 hover:text-papa-orange"
          }`}
        >
          <Flame size={14} className={liked ? "fill-papa-orange" : ""} />
          {liked ? "Curtido" : "Curtir"}
          {likeCount > 0 ? <span>· {likeCount}</span> : null}
        </button>
        <button
          type="button"
          onClick={toggleComments}
          disabled={!canEngage}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase transition-colors disabled:opacity-50 ${
            commentsOpen
              ? "bg-papa-blue/15 border-papa-blue/40 text-papa-blue"
              : "bg-white/5 border-white/5 text-white/40 hover:text-papa-blue"
          }`}
        >
          <MessageSquare size={14} /> Comentar
          {commentCount > 0 ? <span>· {commentCount}</span> : null}
        </button>
      </div>

      {commentsOpen && canEngage ? (
        <div className="pt-3 border-t border-white/5 space-y-4">
          <CommentList items={comments} busy={commentsLoading} />

          <form onSubmit={submitComment} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              rows={2}
              maxLength={800}
              placeholder="Escreva um comentário…"
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white outline-none focus:border-papa-blue/40"
            />
            <button
              type="submit"
              disabled={commentBusy || !commentDraft.trim()}
              className="rounded-2xl bg-papa-blue px-4 py-2 text-papa-dark hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
              aria-label="Enviar comentário"
              title="Enviar comentário"
            >
              {commentBusy ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          {commentError ? (
            <p className="text-[11px] text-red-300">{commentError}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

const FEED_COMING_SOON = true;

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
          Em breve disponível
        </h3>
        <p className="mt-4 max-w-md mx-auto text-sm text-white/50 leading-relaxed">
          Estamos finalizando o feed da comunidade — atividades, check-ins e interações entre
          alunos. Por enquanto, use o <strong className="text-white/70">Início</strong> e a{" "}
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
      // 1) Atualiza o cache Strava do usuário atual (não bloqueia a renderização do feed).
      const stravaCachePromise = fetch("/api/strava/feed", {
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);

      // 2) Lê o feed da comunidade (dados de todos os atletas).
      const firstRes = await fetch("/api/feed/community", {
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);

      if (firstRes?.ok) {
        const j = await firstRes.json();
        const list = Array.isArray(j.items) ? j.items : [];
        setItems(list);
        setEmpty(list.length === 0);
      }

      // 3) Após o cache Strava sincronizar, recarrega o feed para incluir as novas atividades.
      const cacheRes = await stravaCachePromise;
      if (cacheRes?.ok) {
        const secondRes = await fetch("/api/feed/community", {
          credentials: "include",
          cache: "no-store",
        }).catch(() => null);
        if (secondRes?.ok) {
          const j2 = await secondRes.json();
          const list2 = Array.isArray(j2.items) ? j2.items : [];
          setItems(list2);
          setEmpty(list2.length === 0);
        }
      }
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
            Atividades, check-ins e curtidas da comunidade — últimos 7 dias
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
                <div className="text-2xl font-black text-white mt-1">
                  {items.reduce((acc, it) => acc + (Number(it.likeCount) || 0), 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/20 uppercase flex items-center gap-1">
                  <Activity size={10} /> Treinos
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {items.length}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
