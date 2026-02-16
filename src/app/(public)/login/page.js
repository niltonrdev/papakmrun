"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

function setAuthCookie(value) {
  // cookie simples (V1). Depois vai virar NextAuth.
  // max-age 7 dias
  document.cookie = `papakm_auth=${value}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("plan");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Simula login
    setAuthCookie(`1|${role}`);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="relative mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
        {/* glow */}
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
                V1 — esqueleto funcional. Entre para acessar seu painel.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* Campos “fake” por enquanto */}
            <div className="space-y-1">
              <label className="text-xs text-white/70">E-mail</label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/70">Senha</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
              />
            </div>

            {/* Role demo */}
            <div className="space-y-1">
              <label className="text-xs text-white/70">Entrar como</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/20"
              >
                <option value="plan">Aluno Planilha</option>
                <option value="social">Aluno Social</option>
                <option value="coach">Professor</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-white/50">
                (Demo) Esse perfil vai servir para liberar/tirar acesso no V2.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs text-white/70">
              <button
                type="button"
                onClick={() => {
                  setAuthCookie("1|social");
                  router.push("/dashboard");
                }}
                className="underline underline-offset-4 hover:text-white"
              >
                Entrar como Aluno Social
              </button>

              <span className="text-white/40">V1</span>
            </div>
          </form>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/60">
            <div className="font-semibold text-white/80">Dica</div>
            No V2 a gente troca esse login “fake” por NextAuth + Supabase.
          </div>
        </section>
      </div>
    </main>
  );
}
