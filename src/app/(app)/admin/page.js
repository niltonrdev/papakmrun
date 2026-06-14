"use client";
import { useEffect, useState } from "react";
import {
  Users,
  AlertTriangle,
  Calendar,
  Search,
  Bell,
  Plus,
  ChevronRight,
  FileText,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  readActiveAnnouncement,
  writeActiveAnnouncement,
} from "@/features/announcements/announcements.storage";

export default function AdminPage() {
  const [aviso, setAviso] = useState("");
  const [latestAnn, setLatestAnn] = useState("");
  const [painList, setPainList] = useState([]);
  const [library, setLibrary] = useState([]);
  const [libTitle, setLibTitle] = useState("");
  const [libDesc, setLibDesc] = useState("");
  const [editingLibId, setEditingLibId] = useState(null);
  const [role, setRole] = useState(null);
  const [coachMsg, setCoachMsg] = useState("");
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateKey, setTemplateKey] = useState("");
  const [templateWeeks, setTemplateWeeks] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templateBusy, setTemplateBusy] = useState(false);
  const [groupRaces, setGroupRaces] = useState([]);
  const [raceTitle, setRaceTitle] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [raceLocation, setRaceLocation] = useState("");
  const [raceUrl, setRaceUrl] = useState("");
  const [coaches, setCoaches] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  async function loadAnnouncementPreview() {
    try {
      const res = await fetch("/api/announcements", { credentials: "include" });
      const j = await res.json();
      if (j?.body) setLatestAnn(String(j.body));
      else setLatestAnn("");
    } catch {
      setLatestAnn("");
    }
  }

  async function loadPainFeedback() {
    try {
      const res = await fetch("/api/pain-feedback?limit=80", { credentials: "include" });
      const j = await res.json();
      if (res.ok && Array.isArray(j.items)) {
        setPainList(j.items);
        return;
      }
    } catch {
      /* ignore */
    }
    setPainList([]);
  }

  async function loadLibrary() {
    try {
      const res = await fetch("/api/coach/library", { credentials: "include" });
      const j = await res.json();
      if (res.ok) setLibrary(Array.isArray(j.items) ? j.items : []);
    } catch {
      setLibrary([]);
    }
  }

  async function loadGroupRaces() {
    try {
      const res = await fetch("/api/coach/group-races", { credentials: "include" });
      const j = await res.json();
      if (res.ok) setGroupRaces(Array.isArray(j.items) ? j.items : []);
    } catch {
      setGroupRaces([]);
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/coach/plan-templates", { credentials: "include" });
      const j = await res.json();
      if (res.ok) setSavedTemplates(Array.isArray(j.items) ? j.items : []);
    } catch {
      setSavedTemplates([]);
    }
  }

  async function loadCoaches() {
    try {
      const res = await fetch("/api/coach/coaches", { credentials: "include" });
      const j = await res.json();
      if (res.ok) setCoaches(Array.isArray(j.items) ? j.items : []);
    } catch {
      setCoaches([]);
    }
  }

  function refresh() {
    setAviso(readActiveAnnouncement());
    loadAnnouncementPreview();
    loadPainFeedback();
    if (role === "admin" || role === "coach") {
      loadLibrary();
      loadGroupRaces();
      loadTemplates();
      loadCoaches();
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (role === "admin" || role === "coach") {
      loadLibrary();
      loadGroupRaces();
      loadTemplates();
      loadCoaches();
    }
  }, [role]);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) return;
        const j = await res.json();
        if (!c) setRole(j?.profile?.role ?? null);
      } catch {
        if (!c) setRole(null);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  async function loadStudents() {
    try {
      const res = await fetch("/api/coach/students", { credentials: "include" });
      const j = await res.json();
      if (res.ok) setStudents(Array.isArray(j.items) ? j.items : []);
    } catch {
      setStudents([]);
    }
  }

  useEffect(() => {
    if (role === "admin" || role === "coach") loadStudents();
  }, [role]);

  async function approvePlanStudent(studentId) {
    if (!studentId) {
      setCoachMsg("ID do aluno inválido. Recarregue a página.");
      return;
    }
    setApprovingId(studentId);
    setCoachMsg("Aprovando…");
    try {
      const res = await fetch(`/api/coach/students/${studentId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Não foi possível aprovar.");
      setCoachMsg("Aluno aprovado como planilha.");
      await loadStudents();
    } catch (e) {
      setCoachMsg(e?.message || "Erro ao aprovar.");
    } finally {
      setApprovingId(null);
    }
  }

  const unreadPain = painList.filter((p) => !p.read).length;
  const unreadRelatos = painList.filter((p) => !p.read);

  async function markPainRead(id) {
    try {
      await fetch("/api/pain-feedback", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* ignore */
    }
    await loadPainFeedback();
  }

  async function assignCoach(studentId, coachId) {
    try {
      const res = await fetch(`/api/coach/students/${studentId}/assign-coach`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId: coachId || null }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Falha ao atribuir.");
      await loadStudents();
      setCoachMsg("Professor atribuído ao aluno.");
    } catch (e) {
      setCoachMsg(e?.message || "Erro ao atribuir professor.");
    }
  }
  const filteredStudents = students.filter((s) => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.athleteSlug || "").toLowerCase().includes(q)
    );
  });

  async function publishAviso() {
    const text = aviso.trim();
    if (!text) return;
    setCoachMsg("");
    if (role === "admin" || role === "coach") {
      try {
        const res = await fetch("/api/announcements", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        const j = await res.json();
        if (!res.ok) {
          setCoachMsg(j?.error || "Falha ao publicar no servidor.");
          return;
        }
        setCoachMsg("Aviso publicado para todos.");
        await loadAnnouncementPreview();
        return;
      } catch (e) {
        setCoachMsg(e?.message || "Erro de rede.");
        return;
      }
    }
    writeActiveAnnouncement(text);
    setCoachMsg("Aviso salvo só neste navegador (perfil não é professor).");
    refresh();
  }

  function clearAviso() {
    writeActiveAnnouncement("");
    setAviso("");
    refresh();
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 pb-20 w-full min-w-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-white/20 uppercase tracking-widest mb-1">
            Painel do Professor
          </h1>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white italic uppercase break-words leading-tight">
            Gestão de Performance
          </h2>
          {role && role !== "admin" && role !== "coach" && (
            <p className="mt-3 text-xs text-amber-200/90 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 max-w-xl">
              Você está como <span className="font-black">{role}</span>. Avisos globais e edição de planilha no
              servidor exigem perfil <span className="font-black">coach</span> ou <span className="font-black">admin</span>{" "}
              (ex.: prof.eron@papakm.test).
            </p>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-papa-card p-5 sm:p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase">
              Atletas Ativos
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white italic">{students.length}</div>
        </div>
        <div className="bg-papa-card p-5 sm:p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase">
              Feedback de Dor (novo)
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white italic">{unreadPain}</div>
          {unreadPain > 0 && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch("/api/pain-feedback", {
                    method: "PATCH",
                    credentials: "include",
                  });
                } catch {
                  /* ignore */
                }
                refresh();
              }}
              className="mt-3 text-[10px] font-black uppercase text-papa-blue hover:underline"
            >
              Marcar como lidos
            </button>
          )}
        </div>
        <div className="bg-papa-card p-5 sm:p-6 rounded-3xl border border-white/5 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-papa-orange/10 text-papa-orange">
              <Bell size={20} />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase">
              Aviso no app
            </span>
          </div>
          <div className="text-xs text-white/50 font-medium line-clamp-3">
            {latestAnn || readActiveAnnouncement() || "Nenhum aviso publicado."}
          </div>
        </div>
      </div>

      {unreadRelatos.length > 0 && (
        <div className="bg-papa-card rounded-3xl border border-red-500/20 p-6 space-y-3">
          <h3 className="text-xs font-black uppercase text-red-400 tracking-widest">
            Relatos recentes (não lidos)
          </h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {unreadRelatos.slice(0, 8).map((p) => (
              <li
                key={p.id}
                className="text-xs text-white/70 border border-red-500/20 rounded-xl p-3 bg-red-500/[0.04] flex justify-between gap-3"
              >
                <div>
                  <span className="font-black text-white">{p.athleteName}</span> ·{" "}
                  {p.date} · {p.workoutTitle}
                  <p className="mt-1 text-white/50 italic">{p.painNote}</p>
                </div>
                <button
                  type="button"
                  onClick={() => markPainRead(p.id)}
                  className="shrink-0 self-start text-[9px] font-black uppercase text-papa-blue hover:underline"
                >
                  Marcar lido
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-5 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <Users size={16} className="text-papa-blue" /> Lista de Atletas
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
            />
            <input
              placeholder="Buscar aluno..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white outline-none w-full sm:w-64"
            />
          </div>
        </div>

        {coachMsg && (
          <p className="mx-6 mb-2 text-[11px] text-white/70 border border-white/10 rounded-2xl px-4 py-3 bg-white/[0.03]">
            {coachMsg}
          </p>
        )}

        {/* Tabela em telas md+; lista de cartões no mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                <th className="p-6">Nome</th>
                <th className="p-6">Professor</th>
                <th className="p-6">Objetivo Principal</th>
                <th className="p-6">Último Teste</th>
                <th className="p-6">Saúde</th>
                <th className="p-6">Plano</th>
                <th className="p-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6 text-xs font-black text-white">
                    {aluno.name}
                    <div className="text-[10px] text-white/35 font-mono mt-1 break-all">{aluno.email}</div>
                  </td>
                  <td className="p-6">
                    {role === "admin" ? (
                      <select
                        value={aluno.coachId || ""}
                        onChange={(e) => assignCoach(aluno.id, e.target.value)}
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white max-w-[140px]"
                      >
                        <option value="">Sem professor</option>
                        {coaches.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-papa-blue">
                        {aluno.coachName || (aluno.coachId ? "Atribuído" : "—")}
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-[10px] text-white/40 font-bold uppercase italic">
                    {aluno.selectedBasePlan ? `Plano ${aluno.selectedBasePlan}` : "Sem plano base"}
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-emerald-400">Ativo</span>
                  </td>
                  <td className="p-6">
                    {aluno.planStatus === "pending" ? (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase text-amber-200">
                        Aguardando aprovação
                      </span>
                    ) : aluno.role === "plan" ? (
                      <span className="text-[10px] font-black uppercase text-papa-orange">
                        Planilha ativa
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-white/50">
                        Social
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-[10px] font-bold uppercase text-white/40">
                    {aluno.planStatus === "pending"
                      ? "Pendente"
                      : aluno.role === "plan"
                        ? "Planilha"
                        : "Social"}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {aluno.planStatus === "pending" && (
                        <button
                          type="button"
                          disabled={approvingId === aluno.id}
                          onClick={() => approvePlanStudent(aluno.id)}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          {approvingId === aluno.id ? "…" : "Aprovar planilha"}
                        </button>
                      )}
                      <Link
                        href={`/admin/aluno/${encodeURIComponent(aluno.athleteSlug || aluno.id)}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-papa-orange px-4 py-2 text-[10px] font-black uppercase text-papa-dark hover:scale-105 transition-transform"
                      >
                        Abrir <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-white/35">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-white/5">
          {filteredStudents.map((aluno) => (
            <div key={aluno.id} className="p-5 space-y-3">
              <div>
                <div className="text-sm font-black text-white">{aluno.name}</div>
                <div className="mt-0.5 break-all text-[10px] font-mono text-white/35">
                  {aluno.email}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {aluno.planStatus === "pending" ? (
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase text-amber-200">
                    Aguardando
                  </span>
                ) : aluno.role === "plan" ? (
                  <span className="rounded-full bg-papa-orange/15 px-3 py-1 text-[10px] font-black uppercase text-papa-orange">
                    Planilha
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-black uppercase text-white/50">
                    Social
                  </span>
                )}
                <span className="text-[10px] font-bold uppercase text-white/35">
                  {aluno.selectedBasePlan ? `Plano ${aluno.selectedBasePlan}` : "Sem plano"}
                </span>
                {aluno.coachName && (
                  <span className="text-[10px] font-bold uppercase text-papa-blue">
                    Prof. {aluno.coachName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {aluno.planStatus === "pending" && (
                  <button
                    type="button"
                    disabled={approvingId === aluno.id}
                    onClick={() => approvePlanStudent(aluno.id)}
                    className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {approvingId === aluno.id ? "…" : "Aprovar"}
                  </button>
                )}
                <Link
                  href={`/admin/aluno/${encodeURIComponent(aluno.athleteSlug || aluno.id)}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-papa-orange px-4 py-2 text-[10px] font-black uppercase text-papa-dark"
                >
                  Abrir <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <p className="p-6 text-center text-xs text-white/35">
              Nenhum aluno encontrado.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-papa-card rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-papa-orange" /> Provas do Grupo
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={raceTitle}
              onChange={(e) => setRaceTitle(e.target.value)}
              placeholder="Nome da prova"
              className="flex-1 min-w-[120px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white"
            />
            <input
              type="date"
              value={raceDate}
              onChange={(e) => setRaceDate(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white"
            />
            <input
              value={raceLocation}
              onChange={(e) => setRaceLocation(e.target.value)}
              placeholder="Local"
              className="flex-1 min-w-[100px] rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white"
            />
          </div>
          <input
            value={raceUrl}
            onChange={(e) => setRaceUrl(e.target.value)}
            placeholder="Link do site oficial da corrida (opcional)"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (!raceTitle.trim()) return;
                try {
                  const res = await fetch("/api/coach/group-races", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: raceTitle,
                      raceDate: raceDate || null,
                      location: raceLocation,
                      raceUrl: raceUrl.trim() || null,
                    }),
                  });
                  if (!res.ok) throw new Error();
                  setRaceTitle("");
                  setRaceDate("");
                  setRaceLocation("");
                  setRaceUrl("");
                  await loadGroupRaces();
                } catch {
                  setCoachMsg("Erro ao criar prova.");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-papa-orange text-papa-dark text-xs font-black uppercase hover:brightness-110"
            >
              <Plus size={16} /> Adicionar prova
            </button>
          </div>
          <div className="space-y-3">
            {groupRaces.length === 0 ? (
              <p className="text-xs text-white/30 italic">Nenhuma prova cadastrada.</p>
            ) : (
              groupRaces.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <input
                        defaultValue={r.title}
                        onBlur={async (e) => {
                          const v = e.target.value.trim();
                          if (v && v !== r.title) {
                            await fetch(`/api/coach/group-races/${r.id}`, {
                              method: "PATCH",
                              credentials: "include",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ title: v }),
                            });
                            loadGroupRaces();
                          }
                        }}
                        className="w-full text-xs font-black text-white bg-transparent outline-none border-b border-transparent focus:border-white/20"
                      />
                      <p className="text-[10px] text-white/20 font-bold uppercase mt-1">
                        {r.raceDate || "Data a definir"}
                        {r.location ? ` • ${r.location}` : ""}
                      </p>
                      <span className="inline-block mt-2 rounded-full border border-papa-blue/30 bg-papa-blue/10 px-2.5 py-1 text-[10px] font-black uppercase text-papa-blue">
                        {r.rsvpCount ?? 0} confirmado{(r.rsvpCount ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/coach/group-races/${r.id}`, {
                          method: "DELETE",
                          credentials: "include",
                        });
                        loadGroupRaces();
                      }}
                      className="p-2 text-white/30 hover:text-red-400 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    defaultValue={r.raceUrl || ""}
                    placeholder="Link do site oficial"
                    onBlur={async (e) => {
                      const v = e.target.value.trim();
                      if (v !== (r.raceUrl || "")) {
                        await fetch(`/api/coach/group-races/${r.id}`, {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ raceUrl: v || null }),
                        });
                        loadGroupRaces();
                      }
                    }}
                    className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-[11px] text-white/80"
                  />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-papa-card rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-papa-blue" /> Avisos Gerais
            </h3>
          </div>
          <textarea
            value={aviso}
            onChange={(e) => setAviso(e.target.value)}
            rows={3}
            placeholder="Texto exibido no topo do app dos alunos..."
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-papa-blue/40 placeholder:text-white/30"
          />
          {coachMsg && (
            <p className="text-[11px] text-white/60 border border-white/10 rounded-2xl px-3 py-2">{coachMsg}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={publishAviso}
              className="flex-1 py-3 rounded-2xl bg-papa-blue text-papa-dark text-[10px] font-black uppercase"
            >
              Publicar aviso
            </button>
            <button
              type="button"
              onClick={clearAviso}
              className="px-4 py-3 rounded-2xl border border-white/10 text-[10px] font-black uppercase text-white/50 hover:text-white"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      {(role === "admin" || role === "coach") && (
        <div className="bg-papa-card rounded-3xl border border-white/5 p-8 space-y-4">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-papa-orange" /> Criar planilha modelo (template)
          </h3>
          <p className="text-xs text-white/45">
            Monte uma planilha do zero e salve como template. Ela aparecerá na lista de templates ao
            editar a planilha de um aluno.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="Nome do modelo (ex.: Base 10 semanas)"
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none"
            />
            <input
              value={templateKey}
              onChange={(e) =>
                setTemplateKey(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                )
              }
              placeholder="Chave única (ex.: base-10)"
              className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white font-mono outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={templateBusy}
              onClick={() => {
                const key = templateKey.trim() || `tpl-${Date.now()}`;
                setTemplateWeeks({
                  "1": {
                    id: "week-1",
                    title: "Semana 1",
                    phase: "Base",
                    blocks: [
                      {
                        dayLabel: "Terça",
                        slug: "s1-terca",
                        km: 6,
                        zoneKey: "z2",
                        title: "Ritmo",
                        description: "",
                      },
                      {
                        dayLabel: "Quinta",
                        slug: "s1-quinta",
                        km: 8,
                        zoneKey: "z3",
                        title: "Intervalado",
                        description: "",
                      },
                      {
                        dayLabel: "Sábado",
                        slug: "s1-sabado",
                        km: 12,
                        zoneKey: "z1",
                        title: "Longo",
                        description: "",
                      },
                    ],
                  },
                });
                if (!templateKey.trim()) setTemplateKey(key);
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-white/80"
            >
              Nova planilha em branco
            </button>
            <button
              type="button"
              disabled={templateBusy || !templateWeeks}
              onClick={async () => {
                const key = templateKey.trim();
                const title = templateTitle.trim() || key;
                if (!key || !templateWeeks) {
                  setCoachMsg("Defina chave e crie a planilha.");
                  return;
                }
                setTemplateBusy(true);
                try {
                  const res = await fetch(
                    `/api/coach/plan-template/${encodeURIComponent(key)}`,
                    {
                      method: "PUT",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ weeks: templateWeeks, title }),
                    }
                  );
                  const j = await res.json();
                  if (!res.ok) throw new Error(j?.error || "Falha ao salvar");
                  setCoachMsg(`Template "${title}" salvo. Use em Clonar template no aluno.`);
                  setTemplateWeeks(null);
                  setTemplateTitle("");
                  setTemplateKey("");
                  await loadTemplates();
                } catch (e) {
                  setCoachMsg(e?.message || "Erro ao salvar template.");
                } finally {
                  setTemplateBusy(false);
                }
              }}
              className="rounded-xl bg-papa-orange px-4 py-2 text-[10px] font-black uppercase text-white disabled:opacity-40"
            >
              Salvar como template
            </button>
          </div>
          {templateWeeks && (
            <p className="text-[11px] text-emerald-400/90">
              Rascunho com {Object.keys(templateWeeks).length} semana(s). Abra um aluno para editar em
              detalhe ou salve agora.
            </p>
          )}
          {savedTemplates.length > 0 && (
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] font-black uppercase text-white/30 mb-2">Templates no servidor</p>
              <ul className="flex flex-wrap gap-2">
                {savedTemplates.map((t) => (
                  <li
                    key={t.planKey}
                    className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
                  >
                    {t.title || t.planKey}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-papa-card rounded-3xl border border-white/5 p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-emerald-400" /> Biblioteca do Professor
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={libTitle}
            onChange={(e) => setLibTitle(e.target.value)}
            placeholder="Título do modelo"
            className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none"
          />
          <input
            value={libDesc}
            onChange={(e) => setLibDesc(e.target.value)}
            placeholder="Descrição / observações padrão"
            className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none"
          />
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!libTitle.trim()) return;
            try {
              if (editingLibId) {
                await fetch(`/api/coach/library/${editingLibId}`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: libTitle, description: libDesc }),
                });
                setEditingLibId(null);
              } else {
                await fetch("/api/coach/library", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title: libTitle, description: libDesc }),
                });
              }
              setLibTitle("");
              setLibDesc("");
              await loadLibrary();
            } catch {
              setCoachMsg("Erro ao salvar biblioteca.");
            }
          }}
          className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl hover:bg-white/10 transition-all"
        >
          {editingLibId ? "Atualizar modelo" : "Salvar na biblioteca +"}
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {library.length === 0 ? (
            <p className="text-xs text-white/30 italic col-span-full">
              Nenhum modelo salvo ainda. Crie treinos reutilizáveis para copiar nas planilhas.
            </p>
          ) : (
            library.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white/5 border border-white/5 flex gap-4 items-start"
              >
                <Settings2 size={20} className="text-white/20 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white uppercase">{item.title}</p>
                  <p className="text-xs text-white/50 mt-1 line-clamp-3">{item.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingLibId(item.id);
                      setLibTitle(item.title);
                      setLibDesc(item.description || "");
                    }}
                    className="text-[9px] font-black uppercase text-papa-blue hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch(`/api/coach/library/${item.id}`, {
                        method: "DELETE",
                        credentials: "include",
                      });
                      loadLibrary();
                    }}
                    className="p-2 text-white/30 hover:text-red-400"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
