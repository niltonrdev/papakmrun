"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { setCurrentAthleteSlug } from "@/features/athletes/athletes.storage";
import { writeActiveWeekNumber } from "@/features/session/prefs.storage";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseBrowserEnabled } from "@/lib/supabase/enabled";

const DEMO_USERS = [
  {
    email: "test.nilton@papakm.test",
    password: "140548",
    role: "admin",
    athleteSlug: "nilton-rodrigues",
  },
  {
    email: "prof.eron@papakm.test",
    password: "123456",
    role: "coach",
    athleteSlug: "prof-eron",
  },
  {
    email: "prof.matheus@papakm.test",
    password: "123456",
    role: "coach",
    athleteSlug: "prof-matheus",
  },
  {
    email: "aluno.rafael@papakm.test",
    password: "123456",
    role: "plan",
    athleteSlug: "aluno-rafael",
  },
  {
    email: "aluna.bianca@papakm.test",
    password: "123456",
    role: "social",
    athleteSlug: "aluna-bianca",
  },
];

function setAuthCookie(value) {
  document.cookie = `papakm_auth=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

async function syncLegacyCookieFromApi() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    const role = data?.profile?.role || "plan";
    setAuthCookie(`1|${role}`);
    const slug = data?.profile?.athlete_slug;
    if (slug) setCurrentAthleteSlug(slug);
    const aw = data?.profile?.active_week;
    if (aw != null && String(aw).trim() !== "") {
      writeActiveWeekNumber(String(aw));
    }
    return data;
  } catch {
    /* ignore */
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

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNextPath(q.get("next") || "/dashboard");
  }, []);

  const supabaseMode = isSupabaseBrowserEnabled();
  const supabase = supabaseMode ? createClient() : null;

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("plan");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onSupabaseSubmit(e) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              role,
              athlete_slug: "nilton-rodrigues",
            },
          },
        });
        if (error) throw error;
        if (data?.session) {
          const me = await syncLegacyCookieFromApi();
          router.push(resolvePostLoginPath(me?.profile?.role, nextPath));
          return;
        }
        setMessage("Conta criada. Se o projeto exigir confirmação por e-mail, abra a caixa de entrada e clique no link antes de entrar.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
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

  function onDemoSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const emailNorm = email.trim().toLowerCase();
    const matched = DEMO_USERS.find(
      (u) => u.email === emailNorm && u.password === password
    );

    if (!matched) {
      setLoading(false);
      setMessage("Credenciais inválidas no modo demo.");
      return;
    }

    setAuthCookie(`1|${matched.role}`);
    if (matched.athleteSlug) {
      setCurrentAthleteSlug(matched.athleteSlug);
    }
    const goAdmin = matched.role === "admin" || matched.role === "coach";
    router.push(goAdmin ? "/admin" : "/dashboard");
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/2 top-[30%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-white/5 blur-2xl" />
        </div>

        <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <Image
                src="/brand/papakm-logo.jpg"
                alt="Logo PapaKM"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="text-center">
              <p className="mt-1 text-sm text-white/70">
                {supabaseMode
                  ? "Entre com e-mail e senha (Supabase). Strava é opcional e liga no perfil."
                  : "Modo demo — sem Supabase nas variáveis de ambiente."}
              </p>
            </div>
          </div>

          {supabaseMode ? (
            <form onSubmit={onSupabaseSubmit} className="mt-6 space-y-4">
              <div className="flex rounded-2xl border border-white/10 bg-black/20 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 rounded-xl py-2 ${mode === "signin" ? "bg-white/10 text-white" : "text-white/50"}`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-xl py-2 ${mode === "signup" ? "bg-white/10 text-white" : "text-white/50"}`}
                >
                  Criar cadastro
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">Senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                  placeholder="••••••••"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs text-white/70">Perfil inicial</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/20"
                  >
                    <option value="plan">Aluno Planilha</option>
                    <option value="social">Aluno Social</option>
                  </select>
                  <p className="text-[11px] text-white/45">
                    Cadastro público cria perfis de aluno. Perfis de professor/admin são criados via seed ou painel.
                  </p>
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Aguarde..." : mode === "signup" ? "Registrar" : "Entrar"}
              </button>
            </form>
          ) : (
            <form onSubmit={onDemoSubmit} className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-white/70">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-white/70">Senha</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/60 leading-relaxed">
                Contas demo habilitadas: <span className="font-mono">test.nilton@papakm.test</span>,{" "}
                <span className="font-mono">prof.eron@papakm.test</span> e{" "}
                <span className="font-mono">prof.matheus@papakm.test</span>,{" "}
                <span className="font-mono">aluno.rafael@papakm.test</span> e{" "}
                <span className="font-mono">aluna.bianca@papakm.test</span>.
              </div>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/80">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar (demo)"}
              </button>
            </form>
          )}

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
            <div className="font-semibold text-white/80">Contas e integrações</div>
            <p className="mt-1 leading-relaxed">
              Crie um projeto gratuito no Supabase, rode o SQL em{" "}
              <span className="font-mono text-white/80">supabase/migrations</span>, copie{" "}
              <span className="font-mono text-white/80">.env.example</span> para{" "}
              <span className="font-mono text-white/80">.env.local</span>. No Strava, crie uma API
              Application e use o mesmo redirect URI configurado na variável{" "}
              <span className="font-mono text-white/80">STRAVA_REDIRECT_URI</span>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
