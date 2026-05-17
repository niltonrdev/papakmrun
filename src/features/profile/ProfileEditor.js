"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Edit2,
  MapPin,
  Crown,
  Medal,
  Award,
  Camera,
  Loader2,
  Clock,
} from "lucide-react";
import StravaPanel from "@/features/strava/StravaPanel";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_AVATAR = "/brand/foto-perfil2.png";
const DEFAULT_BANNER = "/brand/banner3.png";

function accountLabel(profile) {
  if (profile?.role === "admin") return "Admin";
  if (profile?.role === "coach") return "Professor";
  if (profile?.role === "plan") return "PapaKM Club";
  if (profile?.planStatus === "pending") return "Aguardando Club";
  return "Rede Social";
}

function accountBadgeClass(profile) {
  if (profile?.role === "plan") return "bg-papa-orange text-white";
  if (profile?.planStatus === "pending")
    return "bg-amber-500/20 text-amber-200 border border-amber-500/30";
  return "bg-white/10 text-white/50";
}

export default function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    city: "",
    country: "Brasil",
  });
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível carregar o perfil.");
      const p = j.profile || {};
      setProfile({
        displayName:
          p.display_name?.trim() ||
          (j.user?.email ? String(j.user.email).split("@")[0] : "Atleta"),
        email: j.user?.email || "",
        role: p.role,
        planStatus: p.plan_status,
        bio: p.bio || "",
        city: p.city || "",
        country: p.country || "Brasil",
        avatarUrl: p.avatar_url || null,
        bannerUrl: p.banner_url || null,
      });
      setForm({
        displayName:
          p.display_name?.trim() ||
          (j.user?.email ? String(j.user.email).split("@")[0] : ""),
        bio: p.bio || "",
        city: p.city || "",
        country: p.country || "Brasil",
      });
    } catch (e) {
      setMessage(e?.message || "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function saveProfile(e) {
    e?.preventDefault?.();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          bio: form.bio,
          city: form.city,
          country: form.country,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível salvar.");
      setMessage("Perfil atualizado.");
      setEditOpen(false);
      await refresh();
    } catch (e) {
      setMessage(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage("Use uma senha com pelo menos 6 caracteres.");
      return;
    }
    const supabase = createClient();
    if (!supabase) return;
    setPasswordBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setMessage("Senha atualizada com sucesso.");
    } catch (e) {
      setMessage(e?.message || "Não foi possível alterar a senha.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function uploadImage(kind, file) {
    if (!file) return;
    const supabase = createClient();
    if (!supabase) {
      setMessage("Upload indisponível.");
      return;
    }
    setUploading(kind);
    setMessage("");
    try {
      const meRes = await fetch("/api/me", { credentials: "include" });
      const me = await meRes.json();
      const userId = me?.user?.id;
      if (!userId) throw new Error("Sessão necessária.");

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${kind}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("profile-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("profile-media").getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

      const patchBody =
        kind === "avatar" ? { avatarUrl: publicUrl } : { bannerUrl: publicUrl };
      const res = await fetch("/api/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao salvar imagem.");
      await refresh();
      setMessage(kind === "avatar" ? "Foto atualizada." : "Banner atualizado.");
    } catch (e) {
      setMessage(e?.message || "Erro no upload.");
    } finally {
      setUploading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-white/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando perfil…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10 text-center text-white/50">{message || "Perfil indisponível."}</div>
    );
  }

  const avatarSrc = profile.avatarUrl || DEFAULT_AVATAR;
  const bannerSrc = profile.bannerUrl || DEFAULT_BANNER;
  const nameUpper = String(profile.displayName || "Atleta").toUpperCase();

  return (
    <div className="mx-auto max-w-5xl pb-24 lg:pb-10">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadImage("avatar", e.target.files?.[0])}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => uploadImage("banner", e.target.files?.[0])}
      />

      <div className="relative mb-20">
        <div className="relative h-48 w-full overflow-hidden rounded-b-[40px] border-b border-white/5 bg-papa-card shadow-2xl lg:h-64">
          <Image
            src={bannerSrc}
            alt="Banner"
            fill
            className="object-cover"
            priority
            unoptimized={!!profile.bannerUrl}
          />
          <div className="absolute inset-0 bg-black/20" />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === "banner"}
            className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[10px] font-black uppercase text-white/80 backdrop-blur-md hover:bg-black/70"
          >
            {uploading === "banner" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            Banner
          </button>
        </div>

        <div className="absolute -bottom-16 left-8 z-20 flex items-end gap-6 lg:-bottom-[70px] lg:left-12">
          <div className="group relative aspect-square">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-papa-dark bg-papa-card shadow-[0_0_40px_rgba(0,0,0,0.7)] lg:h-40 lg:w-40 lg:border-8">
              <Image
                src={avatarSrc}
                alt="Avatar"
                fill
                className="object-cover"
                priority
                unoptimized={!!profile.avatarUrl}
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploading === "avatar"}
              className="absolute bottom-2 right-2 rounded-full border-4 border-papa-dark bg-papa-blue p-2 text-papa-dark transition-transform hover:scale-110"
            >
              {uploading === "avatar" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Edit2 size={16} />
              )}
            </button>
          </div>

          <div className="mb-4 hidden md:block">
            <h2 className="text-2xl font-black uppercase italic leading-none tracking-tighter text-white">
              {nameUpper}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
              <MapPin size={12} className="text-papa-blue" />
              {[profile.city, profile.country].filter(Boolean).join(", ") || "Local não informado"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 px-8 md:hidden">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{nameUpper}</h2>
        <div className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
          <MapPin size={12} className="text-papa-blue" />
          {profile.city || "—"}
        </div>
      </div>

      {profile.planStatus === "pending" && (
        <div className="mx-8 mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 lg:mx-12">
          <Clock size={18} className="mt-0.5 shrink-0" />
          <p>
            Seu cadastro como <strong>aluno planilha</strong> está em análise. Enquanto isso você usa a
            plataforma como <strong>aluno social</strong>. Um professor aprovará em breve.
          </p>
        </div>
      )}

      {message && (
        <p className="mx-8 mb-4 text-center text-xs text-white/60 lg:mx-12">{message}</p>
      )}

      <div className="grid grid-cols-1 gap-8 px-8 lg:grid-cols-12 lg:px-12">
        <div className="space-y-6 lg:col-span-4">
          <div className="space-y-4 rounded-3xl border border-white/5 bg-papa-card p-6">
            <div className="flex items-center justify-between">
              <span
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase ${accountBadgeClass(profile)}`}
              >
                <Crown size={10} /> {accountLabel(profile)}
              </span>
              <button
                type="button"
                onClick={() => setEditOpen((v) => !v)}
                className="text-[10px] font-black uppercase text-papa-blue hover:underline"
              >
                {editOpen ? "Fechar" : "Editar perfil"}
              </button>
            </div>

            {editOpen ? (
              <form onSubmit={saveProfile} className="space-y-3">
                <label className="block text-[10px] font-bold uppercase text-white/40">Nome</label>
                <input
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-papa-blue/40"
                />
                <label className="block text-[10px] font-bold uppercase text-white/40">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <label className="block text-[10px] font-bold uppercase text-white/40">Cidade</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <label className="block text-[10px] font-bold uppercase text-white/40">País</label>
                <input
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-papa-orange py-2.5 text-xs font-black uppercase text-white disabled:opacity-60"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </form>
            ) : (
              <p className="text-sm italic leading-relaxed text-white/60">
                {profile.bio?.trim() || "Conte um pouco sobre você e seus objetivos na corrida."}
              </p>
            )}

            <p className="border-t border-white/5 pt-3 text-[10px] text-white/30">{profile.email}</p>

            <form onSubmit={changePassword} className="space-y-2 border-t border-white/5 pt-4">
              <label className="block text-[10px] font-bold uppercase text-white/40">
                Nova senha
              </label>
              <input
                type="password"
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                placeholder="••••••••"
              />
              <button
                type="submit"
                disabled={passwordBusy}
                className="w-full rounded-xl border border-white/10 py-2 text-[10px] font-black uppercase text-white/70 hover:bg-white/5 disabled:opacity-50"
              >
                {passwordBusy ? "Salvando…" : "Alterar senha"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-8">
          <StravaPanel />

          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-papa-card p-8">
            <div className="absolute right-0 top-0 p-10 opacity-5">
              <Award size={120} className="text-papa-blue" />
            </div>
            <h3 className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-white/20">
              Assinatura PapaKM
            </h3>
            <p className="text-lg font-black text-white">
              {profile.role === "plan"
                ? "Acesso completo à planilha e performance."
                : profile.planStatus === "pending"
                  ? "Modo social ativo — planilha após aprovação."
                  : "Modo rede social — feed e Strava liberados."}
            </p>
          </div>

          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase italic tracking-widest text-white">
              <Medal size={16} className="text-papa-orange" /> Conquistas
            </h3>
            <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-white/35">
              Medalhas e pontos chegam em breve com dados do Strava e check-ins.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
