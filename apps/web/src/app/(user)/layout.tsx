"use client";

import { Activity, LayoutDashboard, Settings, LogOut, Utensils, PieChart } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/auth";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Today's Intake", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meal Log", href: "/dashboard/meals", icon: Utensils },
    { name: "Analytics", href: "/dashboard/analytics", icon: PieChart },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Send Feedback", href: "/dashboard/feedback", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-20 flex items-center px-8 border-b border-zinc-100">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-[#111] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">Z</span>
             </div>
             <span className="font-semibold text-lg tracking-tight">Zoro</span>
           </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest px-4 mb-4">Command Center</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : ''}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex md:hidden items-center px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2">
             <div className="w-5 h-5 bg-[#111] rounded-full flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">Z</span>
             </div>
             <span className="font-semibold tracking-tight">Zoro</span>
           </div>
        </header>

        <div className="flex-1 p-6 md:p-10 w-full max-w-5xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
