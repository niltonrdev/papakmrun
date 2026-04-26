"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Link2, Unlink, Download } from "lucide-react";

export default function StravaPanel() {
  const [backend, setBackend] = useState(null);
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await fetch("/api/me", { credentials: "include" });
      const meJson = await me.json();
      setBackend(meJson.backend || (me.ok ? "supabase" : "legacy"));

      if (!me.ok || meJson.backend === "legacy") {
        setStatus(null);
        setSummary(null);
        return;
      }

      const st = await fetch("/api/strava/status", { credentials: "include" });
      const stJson = await st.json();
      setStatus(stJson);

      if (stJson.linked) {
        const sm = await fetch("/api/strava/summary", { credentials: "include" });
        const smJson = await sm.json();
        setSummary(smJson);
      } else {
        setSummary(null);
      }
    } catch {
      setStatus(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/strava/disconnect", { method: "POST", credentials: "include" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-papa-card p-6 rounded-3xl border border-white/5 text-sm text-white/50">
        Carregando integrações…
      </div>
    );
  }

  if (backend === "legacy") {
    return (
      <div className="bg-papa-card p-6 rounded-3xl border border-white/5 space-y-2">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-papa-orange" /> Strava
        </h3>
        <p className="text-xs text-white/50 leading-relaxed">
          Configure o Supabase e faça login com e-mail para ligar o Strava e sincronizar volume real.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-papa-card p-6 rounded-3xl border border-white/5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-papa-orange" /> Strava
        </h3>
        {status?.linked ? (
          <button
            type="button"
            disabled={busy}
            onClick={disconnect}
            className="text-[10px] font-black uppercase text-white/40 hover:text-red-400 flex items-center gap-1"
          >
            <Unlink size={12} /> Desligar
          </button>
        ) : null}
      </div>

      <p className="text-xs text-white/50 leading-relaxed">
        O login da PapaKM continua separado: aqui você só autoriza a leitura das suas corridas no Strava.
      </p>
      <p className="text-[10px] text-papa-blue/80 font-mono leading-relaxed border border-white/10 rounded-xl px-3 py-2 bg-black/20">
        Dica dev: com o Strava ligado, rode <span className="font-black">npm run dev</span> e veja o terminal do
        servidor — as rotas <span className="font-black">/api/strava/status</span> e{" "}
        <span className="font-black">/api/strava/summary</span> registram um resumo JSON do que veio da API.
      </p>

      {!status?.linked ? (
        <a
          href="/api/strava/connect"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fc4c02] px-4 py-3 text-xs font-black uppercase text-white hover:brightness-110 w-full sm:w-auto"
        >
          <Link2 size={14} /> Conectar Strava
        </a>
      ) : (
        <div className="space-y-4">
          {summary?.athlete && (
            <div className="text-xs text-white/60">
              Conectado como{" "}
              <span className="text-white font-bold">
                {summary.athlete.firstname} {summary.athlete.lastname}
              </span>
            </div>
          )}
          {summary?.totals && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[9px] font-black text-white/30 uppercase">Total corrida</div>
                <div className="text-lg font-black text-white">
                  {summary.totals.allRunKm != null ? `${summary.totals.allRunKm} km` : "—"}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[9px] font-black text-white/30 uppercase">Ano (YTD)</div>
                <div className="text-lg font-black text-white">
                  {summary.totals.ytdRunKm != null ? `${summary.totals.ytdRunKm} km` : "—"}
                </div>
              </div>
            </div>
          )}

          {Array.isArray(summary?.recentActivities) && summary.recentActivities.length > 0 && (
            <div>
              <div className="text-[10px] font-black text-white/30 uppercase mb-2">Recentes</div>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {summary.recentActivities.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{a.name}</div>
                      <div className="text-white/40">
                        {a.distanceKm != null ? `${a.distanceKm} km` : "—"} ·{" "}
                        {a.date ? new Date(a.date).toLocaleDateString("pt-BR") : ""}
                      </div>
                    </div>
                    <a
                      href={`/api/strava/activities/${a.id}/gpx`}
                      className="shrink-0 rounded-lg border border-white/10 p-2 text-white/70 hover:text-papa-blue"
                      title="GPX (se houver GPS)"
                    >
                      <Download size={14} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
