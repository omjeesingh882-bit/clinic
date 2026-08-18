"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Upload, Search, Stethoscope, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface SidebarProps {
  doctorName: string;
  doctorEmail: string;
}

export function Sidebar({ doctorName, doctorEmail }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Upload Prescription", href: "/upload", icon: Upload },
    { name: "Search", href: "/search", icon: Search },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] flex-col border-r bg-white/50 backdrop-blur-xl transition-transform sm:flex hidden">
      <div className="flex h-16 items-center px-6 border-b border-border/50 bg-white/40">
        <div className="flex items-center gap-3 font-semibold text-primary">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight">ClinicOCR</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50 bg-white/40 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {doctorName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{doctorName}</p>
            <p className="text-xs text-muted-foreground truncate">{doctorEmail}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
