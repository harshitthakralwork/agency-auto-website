"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sliders,
  Palette,
  Eye,
  Trash2,
  Edit,
  Clock,
  MapPin,
  Target,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle,
  FileText,
  AlertTriangle,
  Box,
  Layout,
  Video,
  Film,
  Download,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge, CategoryBadge, ExperienceBadge } from "@/components/layout/status-badge";
import { getCategoryPack } from "@/modules/categories/registry";
import { formatDate } from "@/lib/utils";

interface ProjectDetailProps {
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    experienceLevel: string;
    location: string | null;
    description: string | null;
    services: string;
    targetAudience: string | null;
    status: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    designConfig: {
      experienceLevel: string;
      preset: string;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      headingFont: string;
      bodyFont: string;
      layoutStyle: string;
      borderRadius: string;
      threeDPreferences: string;
      mediaPreferences: string;
      sectionsConfigJson: string;
    } | null;
  };
}

export function ProjectDetailView({ project }: ProjectDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [currentStatus, setCurrentStatus] = useState(project.status);
  const [currentLevel, setCurrentLevel] = useState(project.experienceLevel);
  const [isUpdating, setIsUpdating] = useState(false);

  const categoryPack = getCategoryPack(project.category);

  // Parse enabled sections
  let enabledSections: { id: string; name: string; enabled: boolean }[] = [];
  try {
    if (project.designConfig?.sectionsConfigJson) {
      enabledSections = JSON.parse(project.designConfig.sectionsConfigJson);
    }
  } catch {
    enabledSections = [];
  }

  // Parse 3D Preferences
  let threeDPrefs: Record<string, unknown> = {};
  try {
    if (project.designConfig?.threeDPreferences) {
      threeDPrefs = JSON.parse(project.designConfig.threeDPreferences);
    }
  } catch {
    threeDPrefs = {};
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/projects");
        router.refresh();
      } else {
        alert("Failed to delete project");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCurrentStatus(newStatus);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportWebsite = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to export standalone website");
      }
      setExportMessage(`Site exported successfully to ${json.data.exportPath}`);
      setTimeout(() => setExportMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || "Export error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLevelChange = async (newLevel: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceLevel: newLevel }),
      });
      if (res.ok) {
        setCurrentLevel(newLevel);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const adaptation =
    categoryPack.experienceAdaptations[
      currentLevel as "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D"
    ] || categoryPack.experienceAdaptations.CINEMATIC;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Projects Catalog</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              {project.name}
            </h1>
            <CategoryBadge categoryId={project.category} />
            <ExperienceBadge level={currentLevel} />
            <StatusBadge status={currentStatus} />
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400 font-mono">
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Updated {formatDate(project.updatedAt)}
            </span>
            <span>Slug: {project.slug}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Experience Level Selector */}
          <select
            value={currentLevel}
            disabled={isUpdating}
            onChange={(e) => handleLevelChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="STANDARD">Level 1 • Standard</option>
            <option value="CINEMATIC">Level 2 • Cinematic</option>
            <option value="IMMERSIVE_3D">Level 3 • Immersive 3D</option>
          </select>

          {/* Quick Status Selector */}
          <select
            value={currentStatus}
            disabled={isUpdating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="DRAFT">Status: Draft Spec</option>
            <option value="IN_PROGRESS">Status: In Production</option>
            <option value="READY_FOR_REVIEW">Status: Ready for Review</option>
            <option value="COMPLETED">Status: Completed</option>
            <option value="ARCHIVED">Status: Archived</option>
          </select>

          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              <span>Edit Metadata</span>
            </Button>
          </Link>

          <Link href={`/projects/${project.id}/media`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-cyan-300">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Media Studio</span>
            </Button>
          </Link>

          <Link href={`/projects/${project.id}/design`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-pink-300">
              <Palette className="h-3.5 w-3.5" />
              <span>Design Studio</span>
            </Button>
          </Link>

          <Link href={`/projects/${project.id}/3d`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-indigo-300 border border-indigo-800/60 bg-indigo-950/40 hover:bg-indigo-900/60">
              <Box className="h-3.5 w-3.5" />
              <span>3D Scene Studio</span>
            </Button>
          </Link>

          <Link href={`/projects/${project.id}/animation-3d`}>
            <Button variant="secondary" size="sm" className="gap-1.5 text-purple-300 border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/60">
              <Film className="h-3.5 w-3.5" />
              <span>3D Animation</span>
            </Button>
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportWebsite}
            disabled={isExporting}
            className="gap-1.5 text-emerald-300 border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/60"
            data-testid="export-website-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? "Exporting..." : "Export Site"}</span>
          </Button>

          <Link href={`/projects/${project.id}/preview`} target="_blank">
            <Button size="sm" className="gap-1.5 shadow-md shadow-indigo-600/20">
              <Eye className="h-3.5 w-3.5" />
              <span>Live Preview</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-800 bg-emerald-950/60 p-4 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span className="font-mono">{exportMessage}</span>
          </div>
          <button onClick={() => setExportMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Experience Tier Architecture Card */}
      <Card className="border-indigo-900/60 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-900/40 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Active Experience Tier
              </span>
              <ExperienceBadge level={currentLevel} />
            </div>
            <h3 className="text-lg font-bold text-white">{adaptation.title}</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">{adaptation.tagline}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {adaptation.recommendedComponents.map((comp, idx) => (
              <span
                key={idx}
                className="bg-slate-900/90 border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-200 font-mono text-[11px]"
              >
                {comp}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid: Overview & Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Client Profile & Scope (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Business Overview Card */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-white">
                Client Profile & Strategic Scope
              </CardTitle>
              <CardDescription>
                Business context and positioning guiding content and aesthetic choices.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Overview & Value Proposition
                </p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {project.description || "No overview provided."}
                </p>
              </div>

              {project.services && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Configured Services
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.services.split(",").map((service, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300 font-mono"
                      >
                        {service.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {project.targetAudience && (
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-400" />
                    Target Audience
                  </p>
                  <p className="text-xs text-slate-300">{project.targetAudience}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Architecture & Pages Card */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  <span>Industry Pack: {categoryPack.title}</span>
                </CardTitle>
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                  {categoryPack.suggestedPreset} preset
                </span>
              </div>
              <CardDescription>{categoryPack.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recommended Website Pages
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryPack.recommendedPages.map((pg) => (
                    <div
                      key={pg.id}
                      className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-start gap-2.5"
                    >
                      <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-200">{pg.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{pg.slug}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {pg.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Domain Features & Hooks
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                  {categoryPack.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-slate-900/40 p-2 rounded border border-slate-800/60">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Design Tokens & Quick Links (1 col) */}
        <div className="space-y-6">
          {/* Active Design Tokens Card */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-pink-400" />
                  <span>Design Tokens</span>
                </CardTitle>
                <Link
                  href={`/projects/${project.id}/design`}
                  className="text-xs text-pink-400 hover:underline flex items-center gap-1"
                >
                  Edit Studio
                </Link>
              </div>
              <CardDescription>
                Preset: <span className="capitalize text-white font-medium">{project.designConfig?.preset || "cinematic"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Color Swatches
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="space-y-1">
                    <div
                      className="h-8 rounded-lg border border-slate-700 shadow-sm"
                      style={{ backgroundColor: project.designConfig?.primaryColor || "#6366f1" }}
                    />
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {project.designConfig?.primaryColor}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Primary</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-8 rounded-lg border border-slate-700 shadow-sm"
                      style={{ backgroundColor: project.designConfig?.secondaryColor || "#a855f7" }}
                    />
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {project.designConfig?.secondaryColor}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Secondary</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-8 rounded-lg border border-slate-700 shadow-sm"
                      style={{ backgroundColor: project.designConfig?.accentColor || "#f59e0b" }}
                    />
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {project.designConfig?.accentColor}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Accent</p>
                  </div>
                  <div className="space-y-1">
                    <div
                      className="h-8 rounded-lg border border-slate-700 shadow-sm"
                      style={{ backgroundColor: project.designConfig?.backgroundColor || "#090d16" }}
                    />
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {project.designConfig?.backgroundColor}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase">Canvas</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 space-y-2 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Heading Typography:</span>
                  <span className="font-semibold text-white font-mono">
                    {project.designConfig?.headingFont || "Inter"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Body Typography:</span>
                  <span className="font-semibold text-white font-mono">
                    {project.designConfig?.bodyFont || "Inter"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Layout Structure:</span>
                  <span className="capitalize text-slate-300">
                    {project.designConfig?.layoutStyle || "Modern Contained"}
                  </span>
                </div>
                {currentLevel === "IMMERSIVE_3D" && (
                  <div className="flex justify-between py-1">
                    <span className="text-violet-400 flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      3D Model Object:
                    </span>
                    <span className="font-mono text-violet-300 capitalize">
                      {String(threeDPrefs.objectType || "Product Model")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section Blueprint Status */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-white">
                Active Sections Blueprint
              </CardTitle>
              <CardDescription>
                Toggled in Design Studio for live rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-2">
              {enabledSections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs border border-slate-800/60"
                >
                  <span className="text-slate-200">{sec.name}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                      sec.enabled
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {sec.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Media & Asset Pipeline Card */}
          <Card className="border-slate-800 bg-slate-950/60">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-cyan-400" />
                  <span>Media & Asset Pipeline</span>
                </CardTitle>
                <Link href={`/projects/${project.id}/media`}>
                  <span className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer">
                    Open Studio →
                  </span>
                </Link>
              </div>
              <CardDescription>
                Assign images, before/after transformation pairs, and video backgrounds.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-2">
              <Link href={`/projects/${project.id}/media`}>
                <Button variant="outline" size="sm" className="w-full gap-2 border-slate-700 hover:border-cyan-500 hover:text-cyan-300">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Manage Project Media</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Project Deletion"
        description="This action cannot be undone. All project metadata, industry pack settings, and design configurations will be permanently removed from SQLite."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <p>
              To confirm, type the client business name{" "}
              <strong className="text-white font-mono">{project.name}</strong> below:
            </p>
          </div>

          <input
            type="text"
            placeholder={project.name}
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmationText !== project.name || isDeleting}
              isLoading={isDeleting}
              onClick={handleDelete}
            >
              Permanently Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
