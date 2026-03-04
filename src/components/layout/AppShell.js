"use client";
import { Home, Rss, Calendar, User, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/planilha", label: "Planilha", icon: Calendar },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-papa-dark">
      {/* Sidebar Fixa */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-papa-dark p-6 flex flex-col">
       <div className="flex items-center gap-3 px-2 mb-10">
          <div className="relative w-10 h-10">
            <Image 
              src="/brand/papakm-logo-vazada.png" 
              alt="PapaKM Logo" 
              fill
              className="object-contain"
              priority 
            />
          </div>
          <span className="font-black text-xl tracking-tighter text-white uppercase">PapaKM</span>
        </div>

        <nav className="flex-1 space-y-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  active 
                  ? "bg-white/5 text-papa-blue border border-white/5" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Card de Treino Rápido na Sidebar */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-5">
           <span className="text-[10px] text-white/30 uppercase font-black tracking-widest">Treino de hoje</span>
           <div className="font-bold text-sm mt-1 text-white">Intervalado · 8km</div>
           <button className="w-full bg-papa-orange mt-4 py-3 rounded-2xl font-black text-xs text-white shadow-lg shadow-orange-900/20 hover:bg-orange-600 transition-colors">
             Check-in
           </button>
        </div>

        <button
          onClick={() => {
            document.cookie = "papakm_auth=; path=/; max-age=0";
            window.location.href = "/login";
          }}
          className="flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-bold text-sm">Sair</span>
        </button>
      </aside>

      {/* Área de Conteúdo (com margem para a sidebar) */}
      <main className="flex-1 ml-64 p-4 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}