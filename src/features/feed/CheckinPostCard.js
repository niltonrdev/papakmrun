"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Loader2,
  MessageSquare,
  Route,
  Send,
  Smile,
} from "lucide-react";

const EFFORT_LABELS = {
  1: "Muito leve",
  2: "Leve",
  3: "Moderado",
  4: "Intenso",
  5: "Muito intenso",
};

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

function formatKm(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const v = Number(n);
  return Number.isInteger(v) ? `${v} km` : `${v.toFixed(1)} km`;
}

function AuthorAvatar({ author, size = "h-12 w-12" }) {
  if (author?.avatarUrl) {
    return (
      <img
        src={author.avatarUrl}
        alt={author.name}
        className={`${size} rounded-full border border-papa-blue/30 object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-full border border-papa-blue/30 bg-papa-blue/10 text-sm font-black italic text-papa-blue`}
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
      <p className="text-[11px] text-white/30 italic">Seja o primeiro a comentar.</p>
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
                <AuthorAvatar author={c.author} size="h-8 w-8" />
              </Link>
            ) : (
              <AuthorAvatar author={c.author} size="h-8 w-8" />
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

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3">
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-white/35">
        <Icon size={12} />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-black text-white leading-tight">{value}</div>
    </div>
  );
}

export default function CheckinPostCard({ it }) {
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
  const effortN = Number(it.effort);
  const effortLabel = Number.isFinite(effortN) ? EFFORT_LABELS[effortN] : null;
  const note = typeof it.note === "string" ? it.note.trim() : "";

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
      if (next) setTimeout(() => textareaRef.current?.focus(), 80);
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
    <article className="overflow-hidden rounded-3xl border border-white/5 bg-papa-card">
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {profileHref ? (
              <Link href={profileHref} className="shrink-0">
                <AuthorAvatar author={it.author} />
              </Link>
            ) : (
              <AuthorAvatar author={it.author} />
            )}
            <div className="min-w-0">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="block truncate font-black leading-none text-white hover:text-papa-blue"
                >
                  {it.author?.name ?? "Atleta"}
                </Link>
              ) : (
                <div className="truncate font-black leading-none text-white">
                  {it.author?.name ?? "Atleta"}
                </div>
              )}
              <p className="mt-1.5 text-sm font-bold text-white/80 truncate">{it.title}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-white/35">
                Treino concluído
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-white/40">
            {formatSmartDate(it.dateISO)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat icon={Route} label="Distância" value={formatKm(it.distanceKm)} />
          <Stat icon={Flame} label="Na semana" value={formatKm(it.weekKm)} />
        </div>

        {effortLabel || note ? (
          <div className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-white/35">
              <Smile size={12} /> Como foi
            </div>
            {effortLabel ? (
              <p className="text-sm font-bold text-white">
                {effortLabel}
                <span className="ml-2 text-white/40 font-semibold">
                  esforço {effortN}/5
                </span>
              </p>
            ) : null}
            {note ? (
              <p className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                {note}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
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
      </div>
    </article>
  );
}
