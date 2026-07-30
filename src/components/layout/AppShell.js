"use client";
import { Home, Rss, Calendar, User, LogOut, ShieldCheck, X, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  readActiveAnnouncement,
  readDismissedAnnouncementId,
  writeDismissedAnnouncementId,
} from "@/features/announcements/announcements.storage";
import { syncBackendSession } from "@/features/session/backend-sync";
import { logout, setAuthRoleCookie } from "@/lib/auth/session.client";
import ParqGate from "@/features/health/ParqGate";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/planilha", label: "Performance", icon: Calendar },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "/calcula-pace", label: "Calcula Pace", icon: Timer },
  { href: "/admin", label: "Gestão", icon: ShieldCheck },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [banner, setBanner] = useState("");
  const [announcementId, setAnnouncementId] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [role, setRole] = useState(null);
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/announcements", { credentials: "include" });
        const j = await res.json();
        if (!cancelled && j?.body && String(j.body).trim()) {
          const body = String(j.body).trim();
          const id = j?.id ?? body;
          setBanner(body);
          setAnnouncementId(id);
          setHidden(readDismissedAnnouncementId() === String(id));
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        const local = readActiveAnnouncement();
        setBanner(local);
        setAnnouncementId(local || null);
        setHidden(local ? readDismissedAnnouncementId() === local : false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function dismissBanner() {
    const id = announcementId ?? banner;
    if (id) writeDismissedAnnouncementId(id);
    setHidden(true);
  }

  useEffect(() => {
    syncBackendSession();
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include", cache: "no-store" });
        const j = await res.json();
        if (!cancelled && res.ok) {
          const r = j?.role ?? j?.profile?.role ?? null;
          const staff = Boolean(j?.isStaff) || r === "admin" || r === "coach";
          setRole(r);
          setIsStaff(staff);
          if (r) setAuthRoleCookie(r);
        } else if (!cancelled) {
          setRole(null);
          setIsStaff(false);
        }
      } catch {
        if (!cancelled) {
          setRole(null);
          setIsStaff(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const navItems = NAV_ITEMS.filter((item) => {
    if (item.href !== "/admin") return true;
    return isStaff;
  });

  const showBanner = pathname === "/dashboard";

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-papa-dark">
      {/* Sidebar - Oculta no mobile (hidden), visível no desktop (lg:flex) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-papa-dark p-6 flex-col z-50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="relative w-10 h-10">
            <Image src="/brand/papakm-logo-vazada.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <span className="font-black text-xl tracking-tighter text-white uppercase">PapaKM</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                active ? "bg-white/5 text-papa-blue border border-white/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}>
                <item.icon size={20} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white transition-colors mt-auto"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Sair</span>
        </button>
      </aside>

      {/* Main Content - Remove a margem no mobile (ml-0) e adiciona no desktop (lg:ml-64) */}
      <main className="flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 overflow-x-hidden overflow-y-visible lg:overflow-y-auto w-full min-w-0">
        <ParqGate />
        {banner && !hidden && showBanner && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-papa-blue/30 bg-papa-blue/10 px-4 py-3 text-sm text-white/90">
            <span className="text-papa-blue font-black uppercase text-[10px] tracking-widest shrink-0 mt-0.5">
              Aviso
            </span>
            <p className="flex-1 leading-relaxed">{banner}</p>
            <button
              type="button"
              onClick={dismissBanner}
              className="shrink-0 rounded-lg p-1 text-white/40 hover:text-white"
              aria-label="Fechar aviso"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Mobile Nav Bar - Visível apenas no mobile (lg:hidden) conforme protótipo */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-papa-card/80 backdrop-blur-xl border-t border-white/5 px-2 sm:px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] flex justify-between items-center z-50 gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
          const shortLabel =
            item.href === "/calcula-pace"
              ? "Pace"
              : item.href === "/planilha"
                ? "Perf."
                : item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 min-w-[3.25rem] px-1"
            >
              <item.icon size={20} className={active ? "text-papa-blue" : "text-white/40"} />
              <span className={`text-[9px] font-bold truncate max-w-full ${active ? "text-white" : "text-white/40"}`}>
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}