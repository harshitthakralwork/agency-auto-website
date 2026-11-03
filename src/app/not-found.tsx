import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  Home,
  FolderKanban,
  Compass,
  FileText,
  Boxes,
  Layers,
  ArrowLeft,
} from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 md:p-12 max-w-lg w-full backdrop-blur shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <FileQuestion className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
            Error 404 • Resource Not Found
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Page Does Not Exist
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            The studio page or project route you navigated to could not be found in the Agency Website Engine workspace.
          </p>
        </div>

        {/* Quick Launch Links */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2 text-left">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
            Direct Agency Workspaces:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <Home className="h-3.5 w-3.5 text-indigo-400" />
              <span>Command Center</span>
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5 text-indigo-400" />
              <span>Projects Catalog</span>
            </Link>
            <Link
              href="/research"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <Compass className="h-3.5 w-3.5 text-indigo-400" />
              <span>Research Studio</span>
            </Link>
            <Link
              href="/blueprints"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Design Blueprints</span>
            </Link>
            <Link
              href="/registry"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <Boxes className="h-3.5 w-3.5 text-indigo-400" />
              <span>Component Registry</span>
            </Link>
            <Link
              href="/composer"
              className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Page Composer</span>
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

