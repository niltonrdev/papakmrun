"use client";
import { Home, Rss, Calendar, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/planilha", label: "Performance", icon: Calendar },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-papa-dark">
      {/* Sidebar - Oculta no mobile (hidden), visível no desktop (lg:flex) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-papa-dark p-6 flex-col z-50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="relative w-10 h-10">
            <Image src="/brand/papakm-logo-vazada.png" alt="Logo" fill className="object-contain" priority />
          </div>
          <span className="font-black text-xl tracking-tighter text-white uppercase">PapaKM</span>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
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

        <button onClick={() => { document.cookie = "papakm_auth=; path=/; max-age=0"; window.location.href = "/login"; }}
          className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white transition-colors mt-auto">
          <LogOut size={20} />
          <span className="font-bold text-sm">Sair</span>
        </button>
      </aside>

      {/* Main Content - Remove a margem no mobile (ml-0) e adiciona no desktop (lg:ml-64) */}
      <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-10 pb-24 lg:pb-10 overflow-y-auto w-full">
        {children}
      </main>

      {/* Mobile Nav Bar - Visível apenas no mobile (lg:hidden) conforme protótipo */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-papa-card/80 backdrop-blur-xl border-t border-white/5 px-6 py-3 flex justify-between items-center z-50">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <item.icon size={20} className={active ? "text-papa-blue" : "text-white/40"} />
              <span className={`text-[10px] font-bold ${active ? "text-white" : "text-white/40"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}