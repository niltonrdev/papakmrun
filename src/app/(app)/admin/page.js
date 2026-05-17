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
import {
  readLibraryItems,
  addLibraryItem,
  removeLibraryItem,
} from "@/features/library/library.storage";

export default function AdminPage() {
  const [aviso, setAviso] = useState("");
  const [latestAnn, setLatestAnn] = useState("");
  const [painList, setPainList] = useState([]);
  const [library, setLibrary] = useState([]);
  const [libTitle, setLibTitle] = useState("");
  const [libDesc, setLibDesc] = useState("");
  const [role, setRole] = useState(null);
  const [coachMsg, setCoachMsg] = useState("");
  const [planKey, setPlanKey] = useState("sub20");
  const [planJson, setPlanJson] = useState("");
  const [planBusy, setPlanBusy] = useState(false);
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

  function refresh() {
    setAviso(readActiveAnnouncement());
    setLibrary(readLibraryItems());
    loadAnnouncementPreview();
    loadPainFeedback();
  }

  useEffect(() => {
    refresh();
  }, []);

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
    setApprovingId(studentId);
    setCoachMsg("");
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
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-sm font-bold text-white/20 uppercase tracking-widest mb-1">
            Painel do Professor
          </h1>
          <h2 className="text-4xl font-black text-white italic uppercase">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-papa-card p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase">
              Atletas Ativos
            </span>
          </div>
          <div className="text-3xl font-black text-white italic">{students.length}</div>
        </div>
        <div className="bg-papa-card p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-black text-white/30 uppercase">
              Feedback de Dor (novo)
            </span>
          </div>
          <div className="text-3xl font-black text-white italic">{unreadPain}</div>
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
        <div className="bg-papa-card p-6 rounded-3xl border border-white/5">
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

      {painList.length > 0 && (
        <div className="bg-papa-card rounded-3xl border border-red-500/20 p-6 space-y-3">
          <h3 className="text-xs font-black uppercase text-red-400 tracking-widest">
            Relatos recentes
          </h3>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {painList.slice(0, 8).map((p) => (
              <li
                key={p.id}
                className="text-xs text-white/70 border border-white/5 rounded-xl p-3 bg-white/[0.02]"
              >
                <span className="font-black text-white">{p.athleteName}</span> ·{" "}
                {p.date} · {p.workoutTitle}
                <p className="mt-1 text-white/50 italic">{p.painNote}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-papa-card rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <Users size={16} className="text-papa-blue" /> Lista de Atletas
          </h3>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
            />
            <input
              placeholder="Buscar aluno..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white outline-none w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                <th className="p-6">Nome</th>
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
                    <div className="text-[10px] text-white/35 font-mono mt-1">{aluno.email}</div>
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
                  <td colSpan={6} className="p-6 text-center text-xs text-white/35">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-papa-card rounded-3xl border border-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
              <Calendar size={16} className="text-papa-orange" /> Provas do Grupo
            </h3>
            <button
              type="button"
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white">Meia de Brasília</p>
                <p className="text-[10px] text-white/20 font-bold uppercase">
                  24 de Maio • Eixão Lazer
                </p>
              </div>
              <span className="text-[9px] font-black px-2 py-1 bg-papa-blue/10 text-papa-blue rounded-lg">
                12 Atletas
              </span>
            </div>
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
            <FileText size={16} className="text-papa-orange" /> Planilha base no servidor
          </h3>
          <p className="text-xs text-white/45">
            Chaves <span className="font-mono text-white/70">sub20</span> e{" "}
            <span className="font-mono text-white/70">volume</span> são as mesmas que os alunos escolhem ao
            entrar. Salvar aqui atualiza treinos, FIT e feed para quem usa cada plano.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-[10px] font-black uppercase text-white/40">Chave</label>
            <select
              value={planKey}
              onChange={(e) => setPlanKey(e.target.value)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none"
            >
              <option value="sub20">sub20</option>
              <option value="volume">volume</option>
            </select>
            <button
              type="button"
              disabled={planBusy}
              onClick={async () => {
                setPlanBusy(true);
                setCoachMsg("");
                try {
                  const res = await fetch(
                    `/api/coach/plan-template/${encodeURIComponent(planKey)}`,
                    { credentials: "include" }
                  );
                  const j = await res.json();
                  if (!res.ok) throw new Error(j?.error || "Falha ao carregar");
                  setPlanJson(JSON.stringify(j.weeks || {}, null, 2));
                  setCoachMsg("JSON carregado do servidor.");
                } catch (e) {
                  setCoachMsg(e?.message || "Erro ao carregar");
                } finally {
                  setPlanBusy(false);
                }
              }}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase text-white/80 hover:bg-white/10 disabled:opacity-40"
            >
              Carregar do servidor
            </button>
            <button
              type="button"
              disabled={planBusy}
              onClick={async () => {
                setPlanBusy(true);
                setCoachMsg("");
                try {
                  const weeks = JSON.parse(planJson);
                  const res = await fetch(
                    `/api/coach/plan-template/${encodeURIComponent(planKey)}`,
                    {
                      method: "PUT",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ weeks }),
                    }
                  );
                  const j = await res.json();
                  if (!res.ok) throw new Error(j?.error || "Falha ao salvar");
                  setCoachMsg("Planilha salva no Supabase.");
                } catch (e) {
                  setCoachMsg(e?.message || "JSON inválido ou erro ao salvar");
                } finally {
                  setPlanBusy(false);
                }
              }}
              className="rounded-xl bg-papa-orange px-4 py-2 text-[10px] font-black uppercase text-white hover:brightness-110 disabled:opacity-40"
            >
              Salvar no servidor
            </button>
          </div>
          <textarea
            value={planJson}
            onChange={(e) => setPlanJson(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] text-emerald-100/90 outline-none focus:border-papa-blue/40"
            placeholder='{ "1": { "title": "...", "blocks": [...] } }'
          />
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
          onClick={() => {
            if (!libTitle.trim()) return;
            addLibraryItem({ title: libTitle, description: libDesc });
            setLibTitle("");
            setLibDesc("");
            refresh();
          }}
          className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase px-6 py-3 rounded-2xl hover:bg-white/10 transition-all"
        >
          Salvar na biblioteca +
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
                <button
                  type="button"
                  onClick={() => {
                    removeLibraryItem(item.id);
                    refresh();
                  }}
                  className="p-2 text-white/30 hover:text-red-400"
                  aria-label="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
