"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Layers,
  Palette,
  Eye,
  SlidersHorizontal,
  Compass,
  FileText,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects Catalog", href: "/projects", icon: FolderKanban },
  { name: "Research Studio", href: "/research", icon: Compass },
  { name: "Design Blueprints", href: "/blueprints", icon: FileText },
  { name: "Component Registry", href: "/registry", icon: Boxes },
  { name: "Page Composer", href: "/composer", icon: Layers },
  { name: "Industry Packs (6)", href: "/categories", icon: Palette },
  { name: "Design Presets (5)", href: "/design-presets", icon: Palette },
];

export function AgencySidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-800 bg-slate-950 transition-all duration-300 relative",
        collapsed ? "w-18" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-20 h-6 w-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center shadow-md transition-colors"
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="p-3 space-y-6">
        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Engine Studios
            </p>
          )}
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
                  title={collapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative",
                    isActive
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-white transition-colors" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {!collapsed && (
          <div>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Platform Features
            </p>
            <div className="space-y-2 px-3 text-xs text-slate-400">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Palette className="h-3.5 w-3.5 text-indigo-400" />
                  Industry Packs
                </span>
                <span className="font-mono text-[10px] text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/40">
                  6 Packs
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Boxes className="h-3.5 w-3.5 text-cyan-400" />
                  UI Components
                </span>
                <span className="font-mono text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  42 Ready
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  SSRF Egress Proxy
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Enforced
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                  Zero-CDN Export
                </span>
                <span className="font-mono text-[10px] text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/40">
                  Air-Gapped
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-800/80">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Creative Production OS</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              Complete End-to-End Pipeline Active
            </p>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="Creative Production OS: Active">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
