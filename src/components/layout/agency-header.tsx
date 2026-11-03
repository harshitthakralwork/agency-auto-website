"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Sparkles,
  Terminal,
  Menu,
  X,
  LayoutDashboard,
  FolderKanban,
  Compass,
  FileText,
  Boxes,
  Layers,
  Palette,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Projects Catalog", href: "/projects", icon: FolderKanban },
  { name: "Research Studio", href: "/research", icon: Compass },
  { name: "Design Blueprints", href: "/blueprints", icon: FileText },
  { name: "Component Registry", href: "/registry", icon: Boxes },
  { name: "Page Composer", href: "/composer", icon: Layers },
  { name: "Industry Packs (6)", href: "/categories", icon: Palette },
  { name: "Design Presets (5)", href: "/design-presets", icon: Palette },
];

export function AgencyHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 md:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  AGENCY ENGINE
                </span>
                <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono font-medium text-indigo-400 border border-indigo-800/60 uppercase">
                  PRODUCTION OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Autonomous Website Production System
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>SQLite & Zero-CDN Engine: Active</span>
          </div>

          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Engine Studios & Workspaces
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
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
      )}
    </header>
  );
}
