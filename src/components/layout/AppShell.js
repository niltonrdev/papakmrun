"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/planilha", label: "Planilha" },
  { href: "/feed", label: "Feed" },
  { href: "/calendario", label: "Calendário" },
  { href: "/admin", label: "Admin" },
];

function NavLink({ href, label, onClick }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "block rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Fechar com ESC
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Travar scroll quando drawer abrir
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Fechar clicando fora do painel
  function onOverlayClick(e) {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      setOpen(false);
    }
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
            >
              ☰
            </button>

            <Link href="/dashboard" className="font-semibold tracking-tight">
              PapaKMRun
            </Link>
          </div>

          <div className="text-xs text-white/60">
            v1 - esqueleto
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      {/* Drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onMouseDown={onOverlayClick}
        >
          <aside
            ref={panelRef}
            className="h-full w-[280px] border-r border-white/10 bg-slate-950 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">Menu</div>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              Em breve: login real, check-in e ranking.
            </div>
                        <button
              type="button"
              onClick={() => {
                document.cookie = "papakm_auth=; path=/; max-age=0";
                window.location.href = "/login";
              }}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              Sair
            </button>

          </aside>
        </div>
      )}
    </div>
  );
}
