import React from "react";
import Link from "next/link";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, CheckCircle, FileText, Sparkles, Box, Layout, Video } from "lucide-react";

export default function CategoriesCatalogPage() {
  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col gap-2 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Industry Category Packs (6)
          </h1>
        </div>
        <p className="text-sm text-slate-400 max-w-3xl">
          Modular, independently configurable industry blueprints for our agency. Each pack specifies page structures, domain components, visual asset requirements, and 3-tier adaptations (Standard, Cinematic, Immersive 3D).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {ALL_CATEGORY_PACKS.map((pack) => (
          <Card
            key={pack.id}
            id={pack.id}
            className="border-slate-800 bg-slate-950/70 scroll-mt-20 overflow-hidden"
          >
            <div className="border-b border-slate-800/80 p-6 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-lg font-bold text-white">{pack.title}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/60 uppercase">
                    ID: {pack.id}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                    Default: {pack.suggestedPreset} preset
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium">{pack.tagline}</p>
                <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
                  {pack.description}
                </p>
              </div>

              <Link href={`/projects/new`}>
                <Button size="sm" className="gap-2 shrink-0">
                  <Sparkles className="h-4 w-4" />
                  <span>Start Project with this Pack</span>
                </Button>
              </Link>
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

              {/* Pages & Key Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-400" />
                    Recommended Website Pages ({pack.recommendedPages.length})
                  </h4>
                  <div className="space-y-2">
                    {pack.recommendedPages.map((pg) => (
                      <div
                        key={pg.id}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">{pg.name}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{pg.description}</p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                          {pg.slug}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    Specialized Industry Features ({pack.keyFeatures.length})
                  </h4>
                  <div className="space-y-2">
                    {pack.keyFeatures.map((feat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-300"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-mono shrink-0">
                          ✓
                        </span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual Asset & Production Standards */}
              <div className="pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4 text-indigo-400" />
                  Asset Production Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Image Standard</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {pack.visualAssetRequirements.imageStandard}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Video Standard</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {pack.visualAssetRequirements.videoFormat}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Canvas Frames</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {pack.visualAssetRequirements.frameSequenceSpecs || "Standard WebP frames"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">3D Model Standard</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {pack.visualAssetRequirements.threeDModelSpecs || "GLTF/GLB Draco under 10MB"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
