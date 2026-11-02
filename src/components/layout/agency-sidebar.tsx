"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Palette,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects Catalog", href: "/projects", icon: FolderKanban },
  { name: "Industry Packs (6)", href: "/categories", icon: Layers },
  { name: "Design Presets (5)", href: "/design-presets", icon: Palette },
];

export function AgencySidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Engine Navigation
          </p>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Active Engine Features
          </p>
          <div className="space-y-2 px-3 text-xs text-slate-400">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                Category Packs
              </span>
              <span className="font-mono text-[11px] text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded">
                6 Ready
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-pink-400" />
                Design Presets
              </span>
              <span className="font-mono text-[11px] text-pink-300 bg-pink-950 px-1.5 py-0.5 rounded">
                5 Presets
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
                Live Preview
              </span>
              <span className="font-mono text-[11px] text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded">
                Responsive
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-amber-400" />
                Custom Tokens
              </span>
              <span className="font-mono text-[11px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded">
                Hex + Fonts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">Phase 1 Architecture</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-snug">
            Strict TypeScript • Next.js 16 • Prisma • SQLite
          </p>
        </div>
      </div>
    </aside>
  );
}
