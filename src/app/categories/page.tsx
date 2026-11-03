"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { CategoryPack } from "@/modules/categories/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  CheckCircle,
  Layout,
  Box,
  FileText,
  Video,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoriesCatalogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Read URL hash or query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ALL_CATEGORY_PACKS.some((p) => p.id === hash)) {
        setSelectedCategory(hash);
        // Scroll into view if needed
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const filteredPacks = ALL_CATEGORY_PACKS.filter((pack) => {
    const matchesCategory =
      selectedCategory === "all" || pack.id === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Layers className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Industry Category Packs (6)
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-2xl">
            Modular, independently configurable industry blueprints for our agency. Each pack specifies page structures, domain components, visual asset requirements, and 3-tier adaptations (Standard, Cinematic, Immersive 3D).
          </p>
        </div>

        <Link href="/projects/new">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-4 w-4" />
            <span>Launch New Project</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory("all");
              if (typeof window !== "undefined") window.history.replaceState(null, "", "/categories");
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
              selectedCategory === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            )}
          >
            All Categories (6)
          </button>
          {ALL_CATEGORY_PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedCategory(p.id);
                if (typeof window !== "undefined") window.history.replaceState(null, "", `/categories#${p.id}`);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5",
                selectedCategory === p.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packs..."
            className="pl-9 bg-slate-950 border-slate-700/80 text-xs h-9"
          />
        </div>
      </div>

      {/* Grid of Category Packs */}
      <div className="grid grid-cols-1 gap-8">
        {filteredPacks.map((pack) => (
          <Card
            key={pack.id}
            id={pack.id}
            className={cn(
              "border-slate-800 bg-slate-950/70 scroll-mt-20 overflow-hidden transition-all duration-200",
              selectedCategory === pack.id && "ring-2 ring-indigo-500/60 shadow-xl shadow-indigo-500/5"
            )}
          >
            {/* Header of Card */}
            <div className="border-b border-slate-800/80 p-6 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <span className="text-lg font-bold text-white">{pack.title}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60 uppercase">
                    ID: {pack.id}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                    Default: {pack.suggestedPreset} preset
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium">{pack.tagline}</p>
                <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
                  {pack.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link href={`/categories/${pack.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-slate-700 hover:bg-slate-800 text-slate-200">
                    <span>Full Industry Pack</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link href={`/projects/new?category=${pack.id}`}>
                  <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Start Project</span>
                  </Button>
                </Link>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* 3 Experience Level Adaptations Strip */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400" />
                  3-Tier Experience Adaptations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                      <Layout className="h-3.5 w-3.5 text-slate-400" />
                      <span>Level 1 • Standard</span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {pack.experienceAdaptations.STANDARD.title}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {pack.experienceAdaptations.STANDARD.tagline}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Level 2 • Cinematic</span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {pack.experienceAdaptations.CINEMATIC.title}
                    </p>
                    <p className="text-[11px] text-indigo-200/80 leading-snug">
                      {pack.experienceAdaptations.CINEMATIC.tagline}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
                      <Box className="h-3.5 w-3.5" />
                      <span>Level 3 • Immersive 3D</span>
                    </div>
                    <p className="text-xs font-semibold text-white">
                      {pack.experienceAdaptations.IMMERSIVE_3D.title}
                    </p>
                    <p className="text-[11px] text-violet-200/80 leading-snug">
                      {pack.experienceAdaptations.IMMERSIVE_3D.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended Pages & Section Counts */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <strong>{pack.recommendedPages.length}</strong> Recommended Pages
                  </span>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-500" />
                    <strong>{pack.recommendedSections.length}</strong> Section Types
                  </span>
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    WCAG 2.1 AA Compliant
                  </span>
                </div>

                <Link
                  href={`/categories/${pack.id}`}
                  className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                >
                  <span>Explore Architecture, Media & Components</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
