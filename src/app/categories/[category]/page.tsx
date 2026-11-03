import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryPack, isValidCategory, ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Sparkles,
  Layout,
  Box,
  CheckCircle,
  FileText,
  Video,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
} from "lucide-react";

export function generateStaticParams() {
  return ALL_CATEGORY_PACKS.map((p) => ({ category: p.id }));
}

export default async function CategoryDetailPage(props: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await props.params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const pack = getCategoryPack(category);

  return (
    <div className="space-y-8 pb-16">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href="/categories"
          className="hover:text-slate-200 transition-colors flex items-center gap-1 text-slate-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Industry Packs</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="text-white font-medium capitalize">{pack.title}</span>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/50 to-slate-950 p-6 md:p-8 backdrop-blur shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {pack.title}
              </h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 uppercase">
                ID: {pack.id}
              </span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize">
                Suggested: {pack.suggestedPreset} Preset
              </span>
            </div>

            <p className="text-sm font-medium text-indigo-300">
              {pack.tagline}
            </p>

            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              {pack.description}
            </p>

            {/* Key Features Badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              {pack.keyFeatures.map((feat, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-800/80 text-slate-300 border border-slate-700/60"
                >
                  <CheckCircle className="h-3 w-3 text-emerald-400" />
                  {feat}
                </span>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2.5">
            <Link href={`/projects/new?category=${pack.id}`}>
              <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25">
                <Sparkles className="h-4 w-4" />
                <span>Create {pack.title} Project</span>
              </Button>
            </Link>
            <Link href={`/registry?category=${pack.id}`}>
              <Button variant="outline" size="sm" className="w-full gap-2 border-slate-700 hover:bg-slate-800 text-slate-300">
                <Layers className="h-4 w-4" />
                <span>View Adapted Components</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 3-Tier Experience Adaptations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-indigo-400" />
              Experience Level Adaptations
            </h2>
            <p className="text-xs text-slate-400">
              How page components and visual choreography adapt across delivery tiers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Level 1: Standard */}
          <Card className="border-slate-800 bg-slate-900/60 shadow-lg">
            <CardContent className="p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Layout className="h-4 w-4 text-slate-400" />
                  Level 1 • Standard
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  Minimal / Zero-FX
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {pack.experienceAdaptations.STANDARD.title}
              </h3>
              <p className="text-xs text-slate-400 leading-snug">
                {pack.experienceAdaptations.STANDARD.tagline}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Characteristics:</p>
                <ul className="space-y-1 text-xs text-slate-300">
                  {pack.experienceAdaptations.STANDARD.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-slate-500">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Level 2: Cinematic */}
          <Card className="border-indigo-900/60 bg-indigo-950/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            <CardContent className="p-5 space-y-3.5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  Level 2 • Cinematic
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
                  GSAP Storytelling
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {pack.experienceAdaptations.CINEMATIC.title}
              </h3>
              <p className="text-xs text-indigo-200/80 leading-snug">
                {pack.experienceAdaptations.CINEMATIC.tagline}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-indigo-900/40">
                <p className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Characteristics:</p>
                <ul className="space-y-1 text-xs text-indigo-100">
                  {pack.experienceAdaptations.CINEMATIC.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Level 3: Immersive 3D */}
          <Card className="border-violet-900/60 bg-violet-950/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
            <CardContent className="p-5 space-y-3.5 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Box className="h-4 w-4" />
                  Level 3 • Immersive 3D
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-900/50 text-violet-300">
                  Three.js WebGL
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {pack.experienceAdaptations.IMMERSIVE_3D.title}
              </h3>
              <p className="text-xs text-violet-200/80 leading-snug">
                {pack.experienceAdaptations.IMMERSIVE_3D.tagline}
              </p>
              <div className="space-y-1.5 pt-2 border-t border-violet-900/40">
                <p className="text-[11px] font-semibold text-violet-300 uppercase tracking-wider">Characteristics:</p>
                <ul className="space-y-1 text-xs text-violet-100">
                  {pack.experienceAdaptations.IMMERSIVE_3D.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-violet-400">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommended Multi-Page Architecture & Recommended Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Sitemap */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">
                Recommended Page Architecture
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Multi-page tree synthesized automatically during Page Composition
            </p>
            <div className="space-y-2.5">
              {pack.recommendedPages.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {p.slug}
                      </span>
                      {p.isPrimary && (
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/40">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visual Asset Specifications */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-indigo-400" />
              <h3 className="text-base font-semibold text-white">
                Visual Asset & Media Specifications
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Format rules enforced by Asset Matcher & Media Optimization Engine
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Image Standard:</span>
                <span className="text-slate-400">{pack.visualAssetRequirements.imageStandard}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="font-semibold text-slate-300 block mb-1">Video Format:</span>
                <span className="text-slate-400">{pack.visualAssetRequirements.videoFormat}</span>
              </div>
              {pack.visualAssetRequirements.threeDModelSpecs && (
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
                  <span className="font-semibold text-slate-300 block mb-1">3D Mesh Standard:</span>
                  <span className="text-slate-400">{pack.visualAssetRequirements.threeDModelSpecs}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                SEO & Accessibility Standards:
              </h4>
              <ul className="space-y-1 text-[11px] text-slate-400">
                {pack.seoAndAccessibility.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Section Architecture */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-400" />
                Recommended Component & Section Architecture ({pack.recommendedSections.length})
              </h3>
              <p className="text-xs text-slate-400">
                Pre-configured section components that populate the blueprint and canvas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {pack.recommendedSections.map((sec) => (
              <div
                key={sec.id}
                className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{sec.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Order: {sec.order}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{sec.description}</p>
                {sec.cinematicHook && (
                  <p className="text-[10px] text-indigo-300 font-mono">
                    ✦ Cinematic: {sec.cinematicHook}
                  </p>
                )}
                {sec.threeDHook && (
                  <p className="text-[10px] text-violet-300 font-mono">
                    ✦ 3D Hook: {sec.threeDHook}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
