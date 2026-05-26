"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  MapPin,
  Crown,
  Loader2,
  ChevronLeft,
  Flame,
  Activity as ActivityIcon,
  Clock,
  Mountain,
} from "lucide-react";

const WorkoutMap = dynamic(
  () => import("@/features/feed/WorkoutMap"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full bg-white/5 animate-pulse rounded-2xl" />
    ),
  }
);

function EmptyAvatar() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-papa-card via-black/60 to-black/80 text-white/30">
      <svg viewBox="0 0 64 64" fill="none" className="h-1/2 w-1/2" aria-hidden>
        <circle cx="32" cy="22" r="10" stroke="currentColor" strokeWidth="3" />
        <path
          d="M12 54c2.5-9 10-14 20-14s17.5 5 20 14"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function EmptyBanner() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-papa-blue/20 via-papa-card to-papa-orange/15">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(0,180,255,0.12),transparent_60%)]" />
    </div>
  );
}

function roleLabel(role) {
  if (role === "admin") return "Admin";
  if (role === "coach") return "Professor";
  if (role === "plan") return "PapaKM Club";
  return "Rede Social";
}

function roleBadgeClass(role) {
  if (role === "plan") return "bg-papa-orange text-white";
  if (role === "coach" || role === "admin")
    return "bg-papa-blue/20 text-papa-blue border border-papa-blue/30";
  return "bg-white/10 text-white/50";
}

function formatSmartDate(iso) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "hoje";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function metaFor(item) {
  const km = item.distanceKm != null ? `${item.distanceKm}km` : "—";
  if (item.kind === "strava") {
    const pace = item.pacePerKm ? `${item.pacePerKm} /km` : "—";
    return `${km} • Pace ${pace}`;
  }
  return `${km}`;
}

export default function AtletaPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(id)}`, {
        credentials: "include",
        cache: "no-store",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Perfil indisponível.");
      setData(j);
    } catch (e) {
      setError(e?.message || "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const profile = data?.profile;
  const stats = data?.stats;
  const items = useMemo(() => data?.items || [], [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando perfil…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-white/60">
        <p className="mb-4 text-sm">{error || "Perfil indisponível."}</p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-xs font-bold uppercase text-white/70 hover:bg-white/5"
        >
          <ChevronLeft size={14} /> Voltar ao feed
        </Link>
      </div>
    );
  }

  const displayName = profile.displayName || profile.athleteSlug || "Atleta";
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto w-full max-w-5xl pb-24 lg:pb-10">
      <div className="mb-4 px-4 sm:px-0">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-white/40 hover:text-papa-blue transition-colors font-black uppercase text-[10px] tracking-widest"
        >
          <ChevronLeft size={16} /> Voltar ao feed
        </Link>
      </div>

      <div className="relative mb-20 sm:mb-24">
        <div className="relative h-40 w-full overflow-hidden rounded-b-[32px] border-b border-white/5 bg-papa-card shadow-2xl sm:h-48 lg:h-64 lg:rounded-b-[40px]">
          {profile.bannerUrl ? (
            <Image
              src={profile.bannerUrl}
              alt="Banner"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <EmptyBanner />
          )}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="absolute -bottom-14 left-4 z-20 flex items-end gap-4 sm:-bottom-16 sm:left-8 sm:gap-6 lg:-bottom-[70px] lg:left-12">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-papa-dark bg-papa-card shadow-[0_0_40px_rgba(0,0,0,0.7)] sm:h-32 sm:w-32 lg:h-40 lg:w-40 lg:border-8">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={`Foto de ${displayName}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            ) : (
              <EmptyAvatar />
            )}
          </div>

          <div className="mb-3 hidden min-w-0 md:block">
            <h2 className="truncate text-2xl font-black italic leading-none tracking-tight text-white lg:text-3xl">
              {displayName}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <MapPin size={12} className="text-papa-blue" />
              {location || "Local não informado"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 px-4 sm:px-8 md:hidden">
        <h2 className="break-words text-2xl font-black italic leading-tight tracking-tight text-white">
          {displayName}
        </h2>
        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
          <MapPin size={12} className="text-papa-blue" />
          {location || "—"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 px-4 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-4 rounded-3xl border border-white/5 bg-papa-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${roleBadgeClass(profile.role)}`}
              >
                <Crown size={10} /> {roleLabel(profile.role)}
              </span>
              {data.isSelf ? (
                <Link
                  href="/perfil"
                  className="ml-auto text-[10px] font-black uppercase text-papa-blue hover:underline"
                >
                  Editar
                </Link>
              ) : null}
            </div>

            <p className="text-sm italic leading-relaxed text-white/60">
              {profile.bio?.trim() ||
                "Este atleta ainda não escreveu uma bio."}
            </p>
          </div>

          <div className="rounded-3xl border border-white/5 bg-papa-card p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">
              Últimos 30 dias
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/30 uppercase flex items-center gap-1">
                  <ActivityIcon size={10} /> Corridas
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {stats?.runs ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/30 uppercase flex items-center gap-1">
                  <Flame size={10} /> Check-ins
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {stats?.checkins ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/30 uppercase flex items-center gap-1">
                  <Mountain size={10} /> Km
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {stats?.kmLast30d ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-[10px] font-black text-white/30 uppercase flex items-center gap-1">
                  <Clock size={10} /> Min
                </div>
                <div className="text-xl font-black text-white mt-1">
                  {stats?.movingMinutesLast30d ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-8">
          <h3 className="text-sm font-black uppercase italic tracking-widest text-white">
            Atividades recentes
          </h3>

          {items.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-white/10 text-center text-white/30 font-bold uppercase text-xs">
              Nenhuma atividade nos últimos 30 dias.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <article
                  key={it.id}
                  className="rounded-3xl border border-white/5 bg-papa-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-black text-white">
                      {it.title}
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
                  <div className="text-[11px] font-bold uppercase text-white/50">
                    {metaFor(it)}
                  </div>
                  {it.note?.trim() ? (
                    <p className="text-xs text-white/60 italic">&quot;{it.note}&quot;</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
