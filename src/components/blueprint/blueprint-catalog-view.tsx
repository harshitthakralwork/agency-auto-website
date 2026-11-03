"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  GitBranch,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";

interface BlueprintCatalogItem {
  id: string;
  title: string;
  slug: string;
  version: number;
  status: "DRAFT" | "REVIEW" | "APPROVED" | "ARCHIVED";
  industry: string;
  experienceLevel: "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D";
  researchSessionId?: string | null;
  activeDirectionId?: string | null;
  changeSummary?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
  researchSession?: { id: string; targetDomain: string; targetUrl: string } | null;
}

interface ResearchSessionOption {
  id: string;
  targetDomain: string;
  targetUrl: string;
  industry?: string | null;
  status: string;
}

interface BlueprintCatalogViewProps {
  initialBlueprints: BlueprintCatalogItem[];
  availableSessions: ResearchSessionOption[];
}

export function BlueprintCatalogView({
  initialBlueprints,
  availableSessions,
}: BlueprintCatalogViewProps) {
  const router = useRouter();
  const [blueprints, setBlueprints] = useState<BlueprintCatalogItem[]>(initialBlueprints);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [industryFilter, setIndustryFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"research" | "scratch">("research");

  // Form states
  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    availableSessions[0]?.id || ""
  );
  const [scratchIndustry, setScratchIndustry] = useState("healthcare");
  const [customTitle, setCustomTitle] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D"
  >("CINEMATIC");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Stats calculation
  const totalCount = blueprints.length;
  const approvedCount = blueprints.filter((b) => b.status === "APPROVED").length;
  const reviewCount = blueprints.filter((b) => b.status === "REVIEW").length;
  const draftCount = blueprints.filter((b) => b.status === "DRAFT").length;

  // Filtered blueprints
  const filteredBlueprints = blueprints.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (industryFilter !== "ALL" && b.industry !== industryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.industry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateBlueprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        experienceLevel,
      };

      if (modalMode === "research") {
        if (!selectedSessionId) {
          throw new Error("Please select a research session");
        }
        payload.researchSessionId = selectedSessionId;
        if (customTitle.trim()) {
          payload.title = customTitle.trim();
        }
      } else {
        if (!customTitle.trim()) {
          throw new Error("Title is required when creating from category pack");
        }
        payload.industry = scratchIndustry;
        payload.title = customTitle.trim();
      }

      const res = await fetch("/api/blueprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create blueprint");
      }

      setIsCreateModalOpen(false);
      setCustomTitle("");
      router.push(`/blueprints/${data.data.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create blueprint");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete blueprint "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blueprints/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setBlueprints((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(data.error || "Failed to delete blueprint");
      }
    } catch (err: any) {
      alert(err.message || "Network error deleting blueprint");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Approved
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-950 text-blue-400 border border-blue-800">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Design Intelligence & Blueprints
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Evidence-grounded website blueprints, strategic design directions, and version-controlled architectural specifications.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Blueprint</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Blueprints
          </p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            Approved & Locked
          </p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{approvedCount}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
            Under Review
          </p>
          <p className="text-2xl font-bold text-blue-300 mt-1">{reviewCount}</p>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">
            Active Drafts
          </p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{draftCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-1.5">
          {["ALL", "DRAFT", "REVIEW", "APPROVED", "ARCHIVED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {status === "ALL" ? "All Blueprints" : status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search blueprints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Catalog Grid */}
      {filteredBlueprints.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            No blueprints found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No blueprints match the selected filters."
              : "Generate an evidence-backed blueprint from a research session or create one from category templates."}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Create Blueprint
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlueprints.map((bp) => (
            <div
              key={bp.id}
              className="group flex flex-col justify-between p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-950/20"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
                      v{bp.version}
                    </span>
                    {getStatusBadge(bp.status)}
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    {bp.industry}
                  </span>
                </div>

                <Link
                  href={`/blueprints/${bp.id}`}
                  className="block group-hover:text-indigo-400 transition-colors"
                >
                  <h3 className="text-base font-semibold text-white line-clamp-1">
                    {bp.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                  {bp.changeSummary || "Evidence-backed blueprint with 3 strategic design directions."}
                </p>

                {/* Evidence source link */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  {bp.researchSession ? (
                    <span className="flex items-center gap-1.5 text-indigo-400">
                      <Compass className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px]">
                        {bp.researchSession.targetDomain}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Industry Template</span>
                    </span>
                  )}

                  <span className="font-mono text-[11px] text-slate-500">
                    {bp.experienceLevel}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span
                  suppressHydrationWarning
                  className="text-[11px] text-slate-500 font-mono"
                >
                  {bp.updatedAt ? bp.updatedAt.slice(0, 10) : ""}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(bp.id, bp.title)}
                    title="Delete blueprint"
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/blueprints/${bp.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">
                  Generate Design Blueprint
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center gap-2 mt-4 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setModalMode("research")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  modalMode === "research"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                From Research Evidence ({availableSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setModalMode("scratch")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  modalMode === "scratch"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                From Industry Pack
              </button>
            </div>

            <form onSubmit={handleCreateBlueprint} className="mt-4 space-y-4">
              {modalMode === "research" ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Completed Research Session
                  </label>
                  {availableSessions.length === 0 ? (
                    <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-xs text-amber-300">
                      No research sessions available. Run an inspection in the{" "}
                      <Link
                        href="/research"
                        className="underline text-indigo-400 font-semibold"
                      >
                        Research Studio
                      </Link>{" "}
                      first, or create from an Industry Pack.
                    </div>
                  ) : (
                    <select
                      value={selectedSessionId}
                      onChange={(e) => setSelectedSessionId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {availableSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.targetDomain} ({s.industry || "General"}) — {s.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Industry Category Pack
                  </label>
                  <select
                    value={scratchIndustry}
                    onChange={(e) => setScratchIndustry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="healthcare">Healthcare & Medical</option>
                    <option value="hotels-banquets">Hotels & Banquets</option>
                    <option value="schools-coaching">Schools & Coaching</option>
                    <option value="food-restaurants">Food & Restaurants</option>
                    <option value="fitness-sports">Fitness & Sports</option>
                    <option value="salon-beauty">Salon & Beauty</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Blueprint Title {modalMode === "scratch" && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={
                    modalMode === "research"
                      ? "Optional: defaults to domain evidence title"
                      : "e.g. Apex Health Clinic Website Architecture"
                  }
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Target Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(
                      e.target.value as "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D"
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="STANDARD">Standard — Fast, Accessible, Essential</option>
                  <option value="CINEMATIC">Cinematic — GSAP ScrollTrigger & Video Sequence</option>
                  <option value="IMMERSIVE_3D">Immersive 3D — Three.js WebGL & Interactive Models</option>
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-red-950/40 border border-red-900 rounded-lg text-xs text-red-400">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (modalMode === "research" && availableSessions.length === 0)
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {isSubmitting ? "Synthesizing Blueprint..." : "Create Blueprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

