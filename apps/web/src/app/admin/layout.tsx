"use client";

import { LayoutDashboard, Users, Activity, Settings, Database, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Command Center", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "User Base", href: "/admin/users", icon: Users },
    { name: "Food Catalog", href: "/admin/catalog", icon: Database },
    { name: "User Feedback", href: "/admin/feedback", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 flex font-sans selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-zinc-800/50 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-zinc-800/50">
           <div className="flex items-center gap-3 w-full">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="font-semibold text-lg tracking-tight text-white uppercase tracking-widest text-sm">Zoro Admin</span>
           </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5">
          <div className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-4 mb-4">Infrastructure</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-600/10 text-blue-400 shadow-sm border border-blue-500/20' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            End Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden relative">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-[#050505] to-[#050505] pointer-events-none" />
        
        <div className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>

    </div>
  );
}
