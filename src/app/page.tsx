import Link from "next/link";
import { db } from "@/lib/db";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { DESIGN_PRESETS } from "@/modules/design/presets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, CategoryBadge } from "@/components/layout/status-badge";
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
  SlidersHorizontal,
  Eye,
} from "lucide-react";

export default async function DashboardPage() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { designConfig: true },
    take: 6,
  });

  const totalCount = await db.project.count();
  const draftCount = await db.project.count({ where: { status: "DRAFT" } });
  const inProgressCount = await db.project.count({ where: { status: "IN_PROGRESS" } });
  const reviewCount = await db.project.count({ where: { status: "READY_FOR_REVIEW" } });
  const completedCount = await db.project.count({ where: { status: "COMPLETED" } });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Agency Website Production Hub
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Phase 1 Engine
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Design, configure, and orchestrate custom client websites with modular industry packs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/projects/new">
            <Button className="gap-2 shadow-lg shadow-indigo-600/25">
              <Plus className="h-4 w-4" />
              <span>New Client Project</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Projects</p>
            <p className="mt-2 text-2xl font-bold text-white font-mono">{totalCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Persistent in SQLite</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Draft Specs</p>
            <p className="mt-2 text-2xl font-bold text-slate-300 font-mono">{draftCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Requirements gathering</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-400">In Production</p>
            <p className="mt-2 text-2xl font-bold text-indigo-300 font-mono">{inProgressCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Active design & layout</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Ready for Review</p>
            <p className="mt-2 text-2xl font-bold text-amber-300 font-mono">{reviewCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Live preview validated</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Completed</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300 font-mono">{completedCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Finished client sites</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Projects (2 Columns) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Active Agency Projects</h2>
              <p className="text-xs text-slate-400">Recent client configurations and current production statuses</p>
            </div>
            {totalCount > 0 && (
              <Link href="/projects" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <span>View all ({totalCount})</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {projects.length === 0 ? (
            /* Empty State */
            <Card className="border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 mb-4">
                <FolderKanban className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-white">No Client Projects Yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
                Start by creating your first agency project. Pick an industry pack, customize its design tokens, and launch the live interactive preview.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/projects/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create First Project</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="group relative transition-all hover:border-slate-700 hover:bg-slate-900/90"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CategoryBadge categoryId={project.category} />
                      <StatusBadge status={project.status} />
                    </div>
                    <CardTitle className="mt-2 text-base font-semibold group-hover:text-indigo-300 transition-colors">
                      <Link href={`/projects/${project.id}`}>
                        <span className="absolute inset-0 z-0" />
                        {project.name}
                      </Link>
                    </CardTitle>
                    {project.location && (
                      <CardDescription className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{project.location}</span>
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 pt-2">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span className="uppercase text-indigo-400 font-semibold tracking-wider">
                        {project.designConfig?.preset || "cinematic"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Engine Modules & Quick References (1 Column) */}
        <div className="space-y-6">
          {/* Category Packs Widget */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>Configured Industry Packs</span>
                </CardTitle>
                <Link href="/categories" className="text-xs text-indigo-400 hover:underline">
                  View All (6)
                </Link>
              </div>
              <CardDescription>
                Each pack defines pages, sections, and business features.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {ALL_CATEGORY_PACKS.map((pack) => (
                <Link
                  key={pack.id}
                  href={`/categories#${pack.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 transition-colors text-xs text-slate-300"
                >
                  <span className="font-medium text-white">{pack.title}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {pack.recommendedSections.length} sections
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Design Engine Presets Widget */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Palette className="h-4 w-4 text-pink-400" />
                  <span>Design Presets</span>
                </CardTitle>
                <Link href="/design-presets" className="text-xs text-pink-400 hover:underline">
                  Specs (5)
                </Link>
              </div>
              <CardDescription>
                Customizable token systems with editable typography & palettes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-2">
              {Object.values(DESIGN_PRESETS).map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full border border-slate-700"
                      style={{ backgroundColor: preset.colors.primary }}
                    />
                    <span className="font-medium text-white">{preset.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    {preset.typography.headingFont}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Engine Workflow Card */}
          <div className="rounded-xl border border-indigo-900/50 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-5">
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-xs font-semibold uppercase tracking-wider">Phase 1 Pipeline</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create a project, select an industry pack, customize color tokens & layout in Design Studio, and test with the Live Responsive Preview canvas.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/projects/new" className="w-full">
                <Button size="sm" className="w-full text-xs">
                  Scaffold Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
