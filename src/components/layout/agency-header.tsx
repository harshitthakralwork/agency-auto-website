"use client";

import React from "react";
import Link from "next/link";
import { Plus, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgencyHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  AGENCY ENGINE
                </span>
                <span className="rounded bg-indigo-950 px-1.5 py-0.5 text-[10px] font-mono font-medium text-indigo-400 border border-indigo-800/60">
                  PHASE 1
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Internal Website Production System</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>SQLite Engine: Active</span>
          </div>

          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5 shadow-md shadow-indigo-600/20">
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
