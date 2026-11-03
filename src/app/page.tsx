import React from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, CategoryBadge, ExperienceBadge } from "@/components/layout/status-badge";
import { formatDate } from "@/lib/utils";
import {
  FolderKanban,
  Plus,
  Layers,
  Palette,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Box,
  Layout,
  Compass,
  FileText,
  Boxes,
  Eye,
  CheckCircle2,
  DownloadCloud,
  Activity,
  Workflow,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let projects: any[] = [];
  let totalProjects = 0;
  let draftCount = 0;
  let inProgressCount = 0;
  let reviewCount = 0;
  let completedCount = 0;
  let standardCount = 0;
  let cinematicCount = 0;
  let threeDCount = 0;
  let recentSessions: any[] = [];
  let totalSessions = 0;
  let recentBlueprints: any[] = [];
  let totalBlueprints = 0;
  let totalPagesCount = 0;

  try {
    const results = await Promise.all([
      db.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          designConfig: true,
          pageCompositions: { select: { id: true, title: true } },
          blueprints: { select: { id: true, title: true, version: true, status: true } },
        },
        take: 6,
      }),
      db.project.count(),
      db.project.count({ where: { status: "DRAFT" } }),
      db.project.count({ where: { status: "IN_PROGRESS" } }),
      db.project.count({ where: { status: "READY_FOR_REVIEW" } }),
      db.project.count({ where: { status: "COMPLETED" } }),
      db.project.count({ where: { experienceLevel: "STANDARD" } }),
      db.project.count({ where: { experienceLevel: "CINEMATIC" } }),
      db.project.count({ where: { experienceLevel: "IMMERSIVE_3D" } }),
      db.researchSession.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          targetDomain: true,
          targetUrl: true,
          industry: true,
          status: true,
          createdAt: true,
        },
      }),
      db.researchSession.count(),
      db.websiteBlueprint.findMany({
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          version: true,
          status: true,
          industry: true,
          updatedAt: true,
        },
      }),
      db.websiteBlueprint.count(),
      db.pageComposition.count(),
    ]);

    projects = results[0];
    totalProjects = results[1];
    draftCount = results[2];
    inProgressCount = results[3];
    reviewCount = results[4];
    completedCount = results[5];
    standardCount = results[6];
    cinematicCount = results[7];
    threeDCount = results[8];
    recentSessions = results[9];
    totalSessions = results[10];
    recentBlueprints = results[11];
    totalBlueprints = results[12];
    totalPagesCount = results[13];
  } catch (err) {
    console.warn("Could not load dashboard data from database:", err);
  }

  const pipelineStages = [
    {
      id: "research",
      number: "01",
      name: "Research",
      description: "SSRF-guarded web crawling & intelligence extraction",
      href: "/research",
      icon: Compass,
      countLabel: `${totalSessions} Sessions`,
      activeColor: "text-sky-400 border-sky-500/30 bg-sky-950/20",
    },
    {
      id: "blueprint",
      number: "02",
      name: "Blueprint",
      description: "Sitemap planning, industry packs & design directions",
      href: "/blueprints",
      icon: FileText,
      countLabel: `${totalBlueprints} Blueprints`,
      activeColor: "text-indigo-400 border-indigo-500/30 bg-indigo-950/20",
    },
    {
      id: "components",
      number: "03",
      name: "Components",
      description: "42 adapted UI components across 7 families",
      href: "/registry",
      icon: Boxes,
      countLabel: "42 In Registry",
      activeColor: "text-purple-400 border-purple-500/30 bg-purple-950/20",
    },
    {
      id: "pages",
      number: "04",
      name: "Pages",
      description: "Visual multi-page tree & section ordering",
      href: "/composer",
      icon: Layers,
      countLabel: `${totalPagesCount} Composed`,
      activeColor: "text-blue-400 border-blue-500/30 bg-blue-950/20",
    },
    {
      id: "content",
      number: "05",
      name: "Content",
      description: "Asset slot matching & synthesized copy with provenance",
      href: projects[0] ? `/projects/${projects[0].id}` : "/projects",
      icon: Palette,
      countLabel: "Auto-Enrichment",
      activeColor: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20",
    },
    {
      id: "preview",
      number: "06",
      name: "Preview",
      description: "Interactive real-time responsive browser preview",
      href: projects[0] ? `/projects/${projects[0].id}/preview` : "/projects",
      icon: Eye,
      countLabel: "Multi-Device",
      activeColor: "text-amber-400 border-amber-500/30 bg-amber-950/20",
    },
    {
      id: "qa",
      number: "07",
      name: "QA Audit",
      description: "WCAG 2.1 AA accessibility & zero-CDN security checks",
      href: projects[0] ? `/projects/${projects[0].id}/preview` : "/projects",
      icon: CheckCircle2,
      countLabel: "Automated Suite",
      activeColor: "text-teal-400 border-teal-500/30 bg-teal-950/20",
    },
    {
      id: "export",
      number: "08",
      name: "Export",
      description: "Standalone air-gapped package & cloud deploy manifests",
      href: "/docs/deployment",
      icon: DownloadCloud,
      countLabel: "Vercel / Netlify",
      activeColor: "text-rose-400 border-rose-500/30 bg-rose-950/20",
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Agency Command Center Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Agency Website Production Command Center
            </h1>
            <span className="rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Activity className="h-3 w-3 animate-pulse text-indigo-400" />
              Production Ready
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 max-w-3xl leading-relaxed">
            Autonomous multi-page website creation pipeline: from competitive intelligence crawling and blueprint design to component assembly, QA validation, and zero-CDN static export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/research">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 hover:bg-slate-800 text-slate-200">
              <Compass className="h-4 w-4 text-sky-400" />
              <span>Start Research</span>
            </Button>
          </Link>
          <Link href="/projects/new">
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25">
              <Plus className="h-4 w-4" />
              <span>New Client Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Production Pipeline Stepper */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Workflow className="h-4 w-4 text-indigo-400" />
            End-to-End Production Pipeline
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            8 Integrated Stages
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link
                key={stage.id}
                href={stage.href}
                className={`p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-all group flex flex-col justify-between min-h-[110px]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {stage.number}
                    </span>
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {stage.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {stage.description}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] font-mono font-medium text-slate-400">
                    {stage.countLabel}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Projects</p>
            <p className="mt-1 text-2xl font-bold text-white font-mono">{totalProjects}</p>
            <p className="text-[10px] text-slate-500">Active client workspaces</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">Research Sessions</p>
            <p className="mt-1 text-2xl font-bold text-sky-300 font-mono">{totalSessions}</p>
            <p className="text-[10px] text-slate-500">SSRF-audited crawls</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Design Blueprints</p>
            <p className="mt-1 text-2xl font-bold text-indigo-300 font-mono">{totalBlueprints}</p>
            <p className="text-[10px] text-slate-500">Versioned & immutable</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">Composed Pages</p>
            <p className="mt-1 text-2xl font-bold text-blue-300 font-mono">{totalPagesCount}</p>
            <p className="text-[10px] text-slate-500">Multi-page sitemaps</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 col-span-2 md:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Completed & Live</p>
            <p className="mt-1 text-2xl font-bold text-emerald-300 font-mono">{completedCount}</p>
            <p className="text-[10px] text-slate-500">Zero-CDN static builds</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Projects (2 Cols) + Intelligence & Blueprints (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects List (2 Cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Active Production Projects</h2>
              <p className="text-xs text-slate-400">Recent client configurations and current pipeline stages</p>
            </div>
            {totalProjects > 0 && (
              <Link href="/projects" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <span>View all ({totalProjects})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            <Card className="border-dashed border-slate-800 bg-slate-950/40 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 mb-3">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Client Projects Initialized</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
                Start by creating your first agency project. Pick an industry pack, configure design tokens, and compose multi-page site trees.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/projects/new">
                  <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
                    <Plus className="h-4 w-4" />
                    <span>Create First Project</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CategoryBadge categoryId={project.category} />
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="mb-1">
                      <ExperienceBadge level={project.experienceLevel} />
                    </div>

                    <CardTitle className="text-base font-bold text-white hover:text-indigo-300 transition-colors line-clamp-1">
                      <Link href={`/projects/${project.id}`}>{project.name}</Link>
                    </CardTitle>

                    {project.location && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        <span>{project.location}</span>
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-3">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {project.description || "No project overview description recorded."}
                    </p>

                    {/* Quick Stats: Pages, Blueprints */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono py-1.5 border-y border-slate-900">
                      <span>{project.pageCompositions.length} Pages</span>
                      <span>•</span>
                      <span>{project.blueprints.length > 0 ? `Blueprint v${project.blueprints[0].version}` : "No Blueprint"}</span>
                      <span>•</span>
                      <span className="capitalize">{project.designConfig?.preset || "cinematic"}</span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <Link
                        href={`/composer?project=${project.id}`}
                        className="text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                      >
                        <Layers className="h-3 w-3 text-indigo-400" />
                        <span>Compose</span>
                      </Link>

                      <Link
                        href={`/projects/${project.id}/preview`}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Preview & QA</span>
                      </Link>

                      <Link
                        href={`/projects/${project.id}`}
                        className="text-xs font-medium text-slate-400 hover:text-slate-200"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Intelligence, Blueprints & Quick Launch (1 Col) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Quick Launch Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              <Link
                href="/projects/new"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-white border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="h-4 w-4 text-indigo-400" />
                  <span className="font-medium">New Client Project</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/research"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-white border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-sky-400" />
                  <span className="font-medium">Crawl & Research Target URL</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/blueprints"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-white border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">Design Blueprints Studio</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/registry"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-white border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Component Registry (42 Specs)</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/categories"
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-xs text-white border border-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Palette className="h-4 w-4 text-amber-400" />
                  <span className="font-medium">Industry Packs & Presets</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </Link>
            </CardContent>
          </Card>

          {/* Recent Research Intelligence */}
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  Latest Research Crawls
                </CardTitle>
                <Link href="/research" className="text-[11px] text-sky-400 hover:underline">
                  All ({totalSessions})
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {recentSessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No research crawls executed yet.
                </p>
              ) : (
                recentSessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/research/${s.id}`}
                    className="block p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                        {s.targetDomain}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize">{s.industry}</span>
                      <span>{formatDate(s.createdAt)}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Blueprints */}
          <Card className="border-slate-800 bg-slate-950/70">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Latest Design Blueprints
                </CardTitle>
                <Link href="/blueprints" className="text-[11px] text-indigo-400 hover:underline">
                  All ({totalBlueprints})
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {recentBlueprints.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No blueprints generated yet.
                </p>
              ) : (
                recentBlueprints.map((bp) => (
                  <Link
                    key={bp.id}
                    href={`/blueprints/${bp.id}`}
                    className="block p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                        {bp.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                        v{bp.version}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize">{bp.industry}</span>
                      <span className="uppercase text-emerald-400 font-semibold">{bp.status}</span>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
