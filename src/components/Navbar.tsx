"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Users, 
  ListFilter, 
  Settings as SettingsIcon, 
  Zap, 
  Radio
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/mappings", label: "Mapping Studio", icon: Users },
    { href: "/events", label: "Audit Feed", icon: ListFilter },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
    { href: "/simulator", label: "Simulator", icon: Zap },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-zinc-100 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-100 tracking-tight text-sm">UniFi ↔ Jisr Bridge</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[11px] font-medium border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
