"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setCurrentAthleteSlug } from "@/features/athletes/athletes.storage";
import { writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserEnabled } from "@/lib/supabase/enabled";
import { setAuthRoleCookie } from "@/lib/auth/session.client";

async function syncLegacyCookieFromApi() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    const role = data?.profile?.role || "social";
    setAuthRoleCookie(role);
    const slug = data?.profile?.athlete_slug;
    if (slug) setCurrentAthleteSlug(slug);
    const aw = data?.profile?.active_week;
    if (aw != null && String(aw).trim() !== "") {
      writeActiveWeekNumber(String(aw));
    }
    return data;
  } catch {
    return null;
  }
}

function resolvePostLoginPath(profileRole, nextPath) {
  const hasExplicitNext = Boolean(nextPath && nextPath !== "/dashboard");
  if (hasExplicitNext) return nextPath;
  if (profileRole === "admin" || profileRole === "coach") return "/admin";
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");
  const supabaseMode = isSupabaseBrowserEnabled();
  const supabase = supabaseMode ? createClient() : null;

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [signupIntent, setSignupIntent] = useState("social");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNextPath(q.get("next") || "/dashboard");
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (!supabase) {
      setMessage("Serviço indisponível. Tente novamente mais tarde.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const name = displayName.trim();
        if (!name) {
          throw new Error("Informe seu nome para o cadastro.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              signup_intent: signupIntent,
              display_name: name,
            },
          },
        });
        if (error) throw error;
        if (data?.session) {
          const me = await syncLegacyCookieFromApi();
          router.push(resolvePostLoginPath(me?.profile?.role, nextPath));
          return;
        }
        setMessage(
          signupIntent === "plan"
            ? "Conta criada! Se precisar confirmar o e-mail, verifique sua caixa de entrada. Após entrar, você usará o modo social até a aprovação da planilha."
            : "Conta criada! Se o e-mail pedir confirmação, abra o link enviado e depois entre."
        );
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        const me = await syncLegacyCookieFromApi();
        router.push(resolvePostLoginPath(me?.profile?.role, nextPath));
      }
    } catch (err) {
      setMessage(err?.message || "Não foi possível autenticar.");
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
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        </div>

        <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10">
              <Image src="/brand/papakm-logo.jpg" alt="PapaKM" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tight text-white">PapaKM</h1>
              <p className="mt-1 text-sm text-white/50">
                {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex rounded-2xl border border-white/10 bg-black/20 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-xl py-2.5 ${mode === "signin" ? "bg-white/10 text-white" : "text-white/50"}`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl py-2.5 ${mode === "signup" ? "bg-white/10 text-white" : "text-white/50"}`}
              >
                Cadastrar
              </button>
            </div>

            {mode === "signup" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Nome completo</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-papa-orange/50"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Tipo de conta</label>
                  <select
                    value={signupIntent}
                    onChange={(e) => setSignupIntent(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none"
                  >
                    <option value="social">Aluno social (rede e feed)</option>
                    <option value="plan">Aluno planilha (aguarda aprovação)</option>
                  </select>
                  {signupIntent === "plan" && (
                    <p className="text-[11px] leading-relaxed text-amber-200/80">
                      Você entra na plataforma como aluno social e ganha acesso à planilha após um
                      professor aprovar seu cadastro.
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs text-white/70">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-papa-orange/50"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/70">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-papa-orange/50"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-white/85">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-papa-orange py-3.5 text-sm font-black uppercase text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
