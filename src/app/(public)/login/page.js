"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setCurrentAthleteSlug } from "@/features/athletes/athletes.storage";
import { writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserEnabled } from "@/lib/supabase/enabled";
import { setAuthRoleCookie } from "@/lib/auth/session.client";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT, validatePassword } from "@/lib/auth/password-policy";
import { birthDateInputBounds, validateBirthDate } from "@/lib/auth/birth-date";
import { getAuthCallbackUrl } from "@/lib/auth/site-url";

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
  const [birthDate, setBirthDate] = useState("");
  const [signupIntent, setSignupIntent] = useState("social");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNextPath(q.get("next") || "/dashboard");
    const authErr = q.get("error");
    if (authErr) {
      setMessage(decodeURIComponent(authErr));
    }
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
        const pwdCheck = validatePassword(password);
        if (!pwdCheck.ok) {
          throw new Error(pwdCheck.message);
        }
        const birthCheck = validateBirthDate(birthDate);
        if (!birthCheck.ok) {
          throw new Error(birthCheck.message);
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: getAuthCallbackUrl(),
            data: {
              signup_intent: signupIntent,
              display_name: name,
              birth_date: birthDate,
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
            ? "Conta criada! Confirme seu e-mail pelo link enviado. Depois de entrar, preencha o questionário PAR-Q enquanto aguarda a aprovação da planilha."
            : "Conta criada! Confirme seu e-mail pelo link enviado e depois entre na plataforma."
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

  const { min: minBirthDate, max: maxBirthDate } = birthDateInputBounds();

  return (
    <main className="login-page min-h-dvh bg-[#060b14] text-slate-100">
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[18%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-papa-orange/10 blur-[100px]" />
          <div className="absolute right-[8%] bottom-[12%] h-[280px] w-[280px] rounded-full bg-papa-blue/10 blur-[90px]" />
          <div className="absolute left-[10%] top-[55%] h-[200px] w-[200px] rounded-full bg-white/[0.03] blur-[80px]" />
        </div>

        <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-10">
          <div className="mb-9 flex flex-col items-center gap-5 text-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-white/15 shadow-[0_0_40px_rgba(255,107,0,0.15)] ring-1 ring-papa-orange/20">
              <Image src="/brand/papakm-logo.jpg" alt="PapaKM" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="login-title text-4xl font-bold tracking-[0.08em] text-white">PAPAKM</h1>
              <p className="mt-2 text-sm text-white/55">
                {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex rounded-2xl border border-white/10 bg-black/25 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-xl py-2.5 transition ${
                  mode === "signin"
                    ? "bg-white/12 text-white shadow-inner"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl py-2.5 transition ${
                  mode === "signup"
                    ? "bg-white/12 text-white shadow-inner"
                    : "text-white/45 hover:text-white/70"
                }`}
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
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20"
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Data de nascimento</label>
                  <input
                    type="date"
                    required
                    min={minBirthDate}
                    max={maxBirthDate}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Tipo de conta</label>
                  <select
                    value={signupIntent}
                    onChange={(e) => setSignupIntent(e.target.value)}
                    className="form-select w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50"
                  >
                    <option value="social">Aluno social (rede e feed)</option>
                    <option value="plan">Aluno planilha (aguarda aprovação)</option>
                  </select>
                  {signupIntent === "plan" && (
                    <p className="text-[11px] leading-relaxed text-amber-200/80">
                      Você entra na plataforma como aluno social e ganha acesso à planilha após um
                      professor aprovar seu cadastro e o questionário PAR-Q.
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
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/70">Senha</label>
              <input
                type="password"
                required
                minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : 1}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-papa-orange/50 focus:ring-2 focus:ring-papa-orange/20"
                placeholder="••••••••"
              />
              {mode === "signup" && (
                <p className="text-[11px] leading-relaxed text-white/45">{PASSWORD_HINT}</p>
              )}
            </div>

            {message && (
              <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-xs leading-relaxed text-white/85">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-papa-orange to-orange-500 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-orange-900/30 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Aguarde…" : mode === "signup" ? "Criar conta" : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
