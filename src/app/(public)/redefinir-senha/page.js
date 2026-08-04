"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserEnabled } from "@/lib/supabase/enabled";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, validatePassword } from "@/lib/auth/password-policy";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabaseMode = isSupabaseBrowserEnabled();
  const supabase = supabaseMode ? createClient() : null;

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!data?.user) {
        router.replace("/login?error=" + encodeURIComponent("Link inválido ou expirado. Solicite um novo."));
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, router]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!supabase) {
      setMessage("Serviço indisponível. Tente novamente mais tarde.");
      return;
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.ok) {
      setMessage(pwdCheck.message);
      return;
    }
    if (password !== confirm) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setMessage("Senha atualizada. Você já pode entrar na plataforma.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setMessage(err?.message || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  }

  if (!supabaseMode) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-center text-white/70">
        <p>Plataforma em manutenção. Tente novamente em instantes.</p>
      </main>
    );
  }

  return (
    <main className="login-page min-h-dvh bg-[#060b14] text-slate-100">
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-papa-orange/10 blur-[100px]" />
          <div className="absolute right-[8%] bottom-[12%] h-[280px] w-[280px] rounded-full bg-papa-blue/10 blur-[90px]" />
        </div>

        <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="mb-9 flex flex-col items-center gap-5 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-white/15 shadow-[0_0_40px_rgba(255,107,0,0.15)] ring-1 ring-papa-orange/20">
              <Image src="/brand/papakm-logo.jpg" alt="PapaKM" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="login-title text-4xl font-bold tracking-[0.08em] text-white">PAPAKM</h1>
              <p className="mt-2 text-sm text-white/55">Redefinir senha</p>
            </div>
          </div>

          {!ready ? (
            <p className="text-center text-sm text-white/55">Validando link…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/70">Nova senha</label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={done}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20 disabled:opacity-60"
                  placeholder="••••••••"
                />
                <p className="text-[11px] leading-relaxed text-white/45">{PASSWORD_HINT}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">Confirmar senha</label>
                <input
                  type="password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={done}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20 disabled:opacity-60"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs leading-relaxed text-white/85">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || done}
                className="w-full rounded-2xl bg-gradient-to-r from-papa-orange to-orange-500 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Aguarde…" : done ? "Senha atualizada" : "Salvar nova senha"}
              </button>

              <p className="text-center text-xs text-white/45">
                <Link href="/login" className="text-papa-orange hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
