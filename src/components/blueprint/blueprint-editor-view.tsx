"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Save,
  GitBranch,
  CheckCircle2,
  Clock,
  Lock,
  ArrowLeft,
  Compass,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Sliders,
  ShieldCheck,
  Target,
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  WebsiteBlueprintData,
  BlueprintStatus,
  ExperienceLevel,
  DesignDirection,
  ProvenanceRecord,
} from "@/modules/blueprint/types";

interface BlueprintEditorViewProps {
  initialBlueprint: WebsiteBlueprintData & {
    project?: any;
    researchSession?: any;
  };
}

export function BlueprintEditorView({
  initialBlueprint,
}: BlueprintEditorViewProps) {
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<WebsiteBlueprintData>(initialBlueprint);
  const [activeTab, setActiveTab] = useState<
    "strategy" | "tokens" | "structure" | "tiers" | "directions" | "provenance" | "seo"
  >("strategy");

  // State management
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Branch modal state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchSummary, setBranchSummary] = useState("");
  const [isBranching, setIsBranching] = useState(false);

  // Status transition state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<BlueprintStatus>("REVIEW");
  const [approverName, setApproverName] = useState("Lead Agency Architect");
  const [statusNotes, setStatusNotes] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isApproved = blueprint.status === "APPROVED";

  // Tab definitions
  const tabs = [
    { id: "strategy", label: "Strategy & Profile", icon: Target },
    { id: "tokens", label: "Brand & Tokens", icon: Palette },
    { id: "structure", label: "Sitemap & Structure", icon: Layers },
    { id: "tiers", label: "Experience Tiers", icon: Sparkles },
    { id: "directions", label: "Design Directions (3)", icon: Zap },
    { id: "provenance", label: "Evidence Provenance", icon: ShieldCheck },
    { id: "seo", label: "SEO & Accessibility", icon: Search },
  ];

  // Save changes
  const handleSave = async () => {
    if (isApproved) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: blueprint.title,
          experienceLevel: blueprint.experienceLevel,
          businessProfile: blueprint.businessProfile,
          brandDirection: blueprint.brandDirection,
          websiteStrategy: blueprint.websiteStrategy,
          sitemap: blueprint.sitemap,
          pageHierarchy: blueprint.pageHierarchy,
          designSystem: blueprint.designSystem,
          experienceRequirements: blueprint.experienceRequirements,
          seoAccessibility: blueprint.seoAccessibility,
          provenanceMetadata: blueprint.provenanceMetadata,
          changeSummary: `Updated by operator at ${new Date().toISOString()}`,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save blueprint");
      }

      setBlueprint(data.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Error saving blueprint");
    } finally {
      setIsSaving(false);
    }
  };

  // Branch new version
  const handleBranchVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchSummary.trim()) return;

    setIsBranching(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary: branchSummary }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to branch version");
      }

      setIsBranchModalOpen(false);
      router.push(`/blueprints/${data.data.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to branch version");
      setIsBranching(false);
    }
  };

  // Status transition
  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          approvedBy: approverName,
          notes: statusNotes,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to transition status");
      }

      setBlueprint(data.data);
      setIsStatusModalOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to transition status");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Apply design direction
  const handleApplyDirection = async (directionId: string) => {
    if (isApproved) return;
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/blueprints/${blueprint.id}/direction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directionId }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to apply direction");
      }

      setBlueprint(data.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to apply direction");
    }
  };

  // Toggle operator confirmation for provenance
  const handleToggleProvenanceConfirmation = (fieldKey: string) => {
    if (isApproved) return;
    setBlueprint((prev) => {
      const currentRec = prev.provenanceMetadata[fieldKey];
      if (!currentRec) return prev;
      return {
        ...prev,
        provenanceMetadata: {
          ...prev.provenanceMetadata,
          [fieldKey]: {
            ...currentRec,
            operatorConfirmed: !currentRec.operatorConfirmed,
          },
        },
      };
    });
  };

  const getStatusBadge = (status: BlueprintStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Lock className="w-3 h-3" /> Approved & Locked
          </span>
        );
      case "REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumb & Metadata Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link
              href="/blueprints"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Blueprints
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-500">{blueprint.slug}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {blueprint.title}
            </h1>
            <span className="px-2.5 py-0.5 font-mono text-xs font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 rounded">
              v{blueprint.version}
            </span>
            {getStatusBadge(blueprint.status)}
            {blueprint.parentBlueprintId && (
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> from v{blueprint.version - 1}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setBranchSummary(`Version ${blueprint.version + 1} iteration`);
              setIsBranchModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Branch Version</span>
          </button>

          <button
            onClick={() => {
              setTargetStatus(
                blueprint.status === "DRAFT"
                  ? "REVIEW"
                  : blueprint.status === "REVIEW"
                  ? "APPROVED"
                  : "DRAFT"
              );
              setIsStatusModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Lifecycle: {blueprint.status}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isApproved || isSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-lg ${
              isApproved
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            }`}
          >
            {isApproved ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Locked</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Immutability Banner when APPROVED */}
      {isApproved && (
        <div className="flex items-center justify-between p-4 bg-emerald-950/40 border border-emerald-900/80 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900/60 rounded-lg text-emerald-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Approved Blueprint — Immutable Production Specification
              </p>
              <p className="text-xs text-emerald-400/80">
                Approved by {blueprint.approvedBy || "Lead Architect"} on{" "}
                <span suppressHydrationWarning>
                  {blueprint.approvedAt ? blueprint.approvedAt.slice(0, 10) : ""}
                </span>
                . Direct modifications are locked to safeguard production integrity.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setBranchSummary(`Version ${blueprint.version + 1} iteration`);
              setIsBranchModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md"
          >
            Branch New Version (v{blueprint.version + 1})
          </button>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-900 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Multi-Tab Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? "bg-slate-900 text-indigo-400 border-indigo-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Strategy & Business Profile */}
      {activeTab === "strategy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Business Profile */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" /> Business Profile
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Company / Project Name
              </label>
              <input
                type="text"
                disabled={isApproved}
                value={blueprint.businessProfile.companyName || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    businessProfile: {
                      ...prev.businessProfile,
                      companyName: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Tagline
              </label>
              <input
                type="text"
                disabled={isApproved}
                value={blueprint.businessProfile.tagline || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    businessProfile: {
                      ...prev.businessProfile,
                      tagline: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Core Description
              </label>
              <textarea
                rows={3}
                disabled={isApproved}
                value={blueprint.businessProfile.description || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    businessProfile: {
                      ...prev.businessProfile,
                      description: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                disabled={isApproved}
                value={blueprint.businessProfile.targetAudience || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    businessProfile: {
                      ...prev.businessProfile,
                      targetAudience: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Key Services
              </label>
              <div className="space-y-1.5">
                {blueprint.businessProfile.services?.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800/80 rounded-lg text-xs text-slate-300"
                  >
                    <span className="font-mono text-indigo-400">0{idx + 1}.</span>
                    <span>{svc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Website Strategy */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Conversion & Customer Journeys
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Primary Conversion Goal
              </label>
              <input
                type="text"
                disabled={isApproved}
                value={blueprint.websiteStrategy.primaryConversionGoal || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    websiteStrategy: {
                      ...prev.websiteStrategy,
                      primaryConversionGoal: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Primary Call To Action (Button Label)
              </label>
              <input
                type="text"
                disabled={isApproved}
                value={blueprint.websiteStrategy.primaryCallToAction || ""}
                onChange={(e) =>
                  setBlueprint((prev) => ({
                    ...prev,
                    websiteStrategy: {
                      ...prev.websiteStrategy,
                      primaryCallToAction: e.target.value,
                    },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target Customer Journeys
              </label>
              <div className="space-y-2">
                {blueprint.websiteStrategy.targetCustomerJourneys?.map((journey, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span>{journey.persona}</span>
                      <span className="text-[11px] font-mono text-indigo-400">
                        {journey.initialLanding}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Action: {journey.keyAction}
                    </p>
                    <p className="text-emerald-400 text-[11px] font-medium">
                      Outcome: {journey.conversionOutcome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Brand & Tokens */}
      {activeTab === "tokens" && (
        <div className="space-y-6">
          {/* Color Tokens */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-pink-400" /> Color System Tokens
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(blueprint.designSystem.colors || {}).map(
                ([key, val]) => (
                  <div
                    key={key}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div
                      className="w-full h-12 rounded-lg border border-slate-700/50 shadow-inner"
                      style={{ backgroundColor: val }}
                    />
                    <div>
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        {key}
                      </span>
                      <input
                        type="text"
                        disabled={isApproved}
                        value={val}
                        onChange={(e) =>
                          setBlueprint((prev) => ({
                            ...prev,
                            designSystem: {
                              ...prev.designSystem,
                              colors: {
                                ...prev.designSystem.colors,
                                [key]: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] font-mono text-slate-200 mt-1 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Typography & Layout Tokens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Typography System
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Heading Font Family
                  </label>
                  <input
                    type="text"
                    disabled={isApproved}
                    value={blueprint.designSystem.typography?.headingFont || ""}
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        designSystem: {
                          ...prev.designSystem,
                          typography: {
                            ...prev.designSystem.typography,
                            headingFont: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Body Font Family
                  </label>
                  <input
                    type="text"
                    disabled={isApproved}
                    value={blueprint.designSystem.typography?.bodyFont || ""}
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        designSystem: {
                          ...prev.designSystem,
                          typography: {
                            ...prev.designSystem.typography,
                            bodyFont: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" /> Layout & Motion
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Layout Container Width
                  </label>
                  <input
                    type="text"
                    disabled={isApproved}
                    value={blueprint.designSystem.layout?.containerWidth || "1280px"}
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        designSystem: {
                          ...prev.designSystem,
                          layout: {
                            ...prev.designSystem.layout,
                            containerWidth: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Border Radius Scale
                  </label>
                  <input
                    type="text"
                    disabled={isApproved}
                    value={blueprint.designSystem.layout?.borderRadius || "0.5rem"}
                    onChange={(e) =>
                      setBlueprint((prev) => ({
                        ...prev,
                        designSystem: {
                          ...prev.designSystem,
                          layout: {
                            ...prev.designSystem.layout,
                            borderRadius: e.target.value,
                          },
                        },
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Sitemap & Page Hierarchy */}
      {activeTab === "structure" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sitemap */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" /> Information Architecture & Sitemap
            </h3>

            <div className="space-y-2">
              {blueprint.sitemap?.map((page) => (
                <div
                  key={page.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-200">{page.title}</span>
                    <span className="font-mono text-slate-500 ml-2">{page.slug}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {page.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">
                      {page.routePriority}
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 font-mono text-[10px] rounded">
                      {page.navigationPlacement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page Sections */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Section Sequence (Home Page)
            </h3>

            <div className="space-y-2">
              {blueprint.pageHierarchy?.[0]?.sections?.map((section) => (
                <div
                  key={section.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">
                      {section.order}. {section.name}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 font-mono text-[11px] rounded">
                      {section.recommendedComponent}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{section.contentOutline}</p>
                  {section.cinematicHook && (
                    <p className="text-amber-400 text-[11px] font-mono">
                      Cinematic Hook: {section.cinematicHook}
                    </p>
                  )}
                  {section.threeDHook && (
                    <p className="text-cyan-400 text-[11px] font-mono">
                      3D Hook: {section.threeDHook}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Experience Tiers */}
      {activeTab === "tiers" && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Experience Tier Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current active level: <span className="font-bold text-indigo-400">{blueprint.experienceLevel}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"] as ExperienceLevel[]).map(
                (lvl) => (
                  <button
                    key={lvl}
                    disabled={isApproved}
                    onClick={() =>
                      setBlueprint((prev) => ({
                        ...prev,
                        experienceLevel: lvl,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      blueprint.experienceLevel === lvl
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    } disabled:opacity-60`}
                  >
                    {lvl}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Standard Tier */}
            <div
              className={`p-4 rounded-xl border ${
                blueprint.experienceLevel === "STANDARD"
                  ? "bg-indigo-950/20 border-indigo-500"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              <h4 className="font-bold text-white text-sm mb-2">Standard Tier</h4>
              <p className="text-xs text-slate-400 mb-3">
                Core performance, semantic accessibility, fluid mobile responsiveness.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {blueprint.experienceRequirements.standardFeatures?.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cinematic Tier */}
            <div
              className={`p-4 rounded-xl border ${
                blueprint.experienceLevel === "CINEMATIC"
                  ? "bg-indigo-950/20 border-indigo-500"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              <h4 className="font-bold text-white text-sm mb-2">Cinematic Tier (GSAP)</h4>
              <p className="text-xs text-slate-400 mb-3">
                Scroll-triggered storytelling, video sequences, split-text pacing.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {blueprint.experienceRequirements.gsapScrollTriggerHooks?.map((h, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Immersive 3D Tier */}
            <div
              className={`p-4 rounded-xl border ${
                blueprint.experienceLevel === "IMMERSIVE_3D"
                  ? "bg-indigo-950/20 border-indigo-500"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              <h4 className="font-bold text-white text-sm mb-2">Immersive 3D (WebGL)</h4>
              <p className="text-xs text-slate-400 mb-3">
                Real-time Three.js spatial viewport, interactive lighting & camera orbits.
              </p>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-2 bg-slate-900 rounded">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">
                    Object Type
                  </span>
                  <span className="font-semibold text-cyan-300">
                    {blueprint.experienceRequirements.threeDRequirements?.objectType}
                  </span>
                </div>
                <div className="p-2 bg-slate-900 rounded">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">
                    Lighting Environment
                  </span>
                  <span className="font-semibold text-cyan-300">
                    {blueprint.experienceRequirements.threeDRequirements?.lightingEnvironment}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Strategic Design Directions (Minimum 3 Directions) */}
      {activeTab === "directions" && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Strategic Design Directions
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select and activate one of the 3 generated strategic design directions. Activating a direction automatically synchronizes the blueprint’s design tokens and aesthetic preset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blueprint.designDirections?.map((dir) => {
              const isActive = blueprint.activeDirectionId === dir.id;
              return (
                <div
                  key={dir.id}
                  className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-indigo-950/30 border-indigo-500 shadow-xl shadow-indigo-950/30"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {dir.tag}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{dir.name}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {dir.rationale}
                      </p>
                    </div>

                    {/* Color Swatches */}
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        Palette Foundation
                      </p>
                      <div className="flex items-center gap-1.5">
                        {Object.values(dir.colors || {}).map((c, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-md border border-slate-700/60 shadow-sm"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Typography & Hero Style */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">
                          Typography Pairing
                        </span>
                        <span className="text-slate-300 font-medium">
                          {dir.typography.headingFont} / {dir.typography.bodyFont}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">
                          Hero Treatment
                        </span>
                        <span className="text-slate-300 text-[11px]">
                          {dir.heroStyle}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">
                          Key Differentiator
                        </span>
                        <span className="text-emerald-400 text-[11px] font-medium">
                          {dir.keyDifferentiator}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800">
                    <button
                      onClick={() => handleApplyDirection(dir.id)}
                      disabled={isActive || isApproved}
                      className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-slate-800 text-slate-400 cursor-default"
                          : isApproved
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      }`}
                    >
                      {isActive
                        ? "Currently Active"
                        : isApproved
                        ? "Locked (Approved)"
                        : "Activate This Direction"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: Evidence Provenance & Audit */}
      {activeTab === "provenance" && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Evidence Provenance Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Every design decision in this blueprint tracks its grounding: verified observed facts from REA, curated operator inputs, or explicit category suggestions. Zero fabrication.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="py-2.5 px-3">Field Target</th>
                  <th className="py-2.5 px-3">Source Classification</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Source Citation / Evidence</th>
                  <th className="py-2.5 px-3 text-right">Operator Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {Object.entries(blueprint.provenanceMetadata || {}).map(
                  ([key, rec]) => {
                    const getSourceStyle = (st: string) => {
                      switch (st) {
                        case "OBSERVED_FACT":
                          return "bg-emerald-950 text-emerald-300 border-emerald-800";
                        case "OPERATOR_INPUT":
                          return "bg-purple-950 text-purple-300 border-purple-800";
                        case "AI_SUGGESTION":
                          return "bg-blue-950 text-blue-300 border-blue-800";
                        case "INFERENCE":
                          return "bg-amber-950 text-amber-300 border-amber-800";
                        default:
                          return "bg-slate-800 text-slate-400 border-slate-700";
                      }
                    };

                    return (
                      <tr key={key} className="hover:bg-slate-950/40">
                        <td className="py-3 px-3 font-mono text-indigo-300 font-medium">
                          {rec.fieldPath || key}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getSourceStyle(
                              rec.sourceType
                            )}`}
                          >
                            {rec.sourceType}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {Math.round((rec.confidence || 0) * 100)}%
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                          {rec.citation || rec.notes || "—"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            disabled={isApproved}
                            onClick={() =>
                              handleToggleProvenanceConfirmation(key)
                            }
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              rec.operatorConfirmed
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-slate-800 text-slate-400 hover:text-slate-200"
                            } disabled:opacity-50`}
                          >
                            {rec.operatorConfirmed ? (
                              <>
                                <Check className="w-3 h-3" /> Confirmed
                              </>
                            ) : (
                              "Confirm"
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: SEO & Accessibility */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Accessibility (WCAG 2.2)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Target WCAG Compliance Level
                </label>
                <select
                  disabled={isApproved}
                  value={blueprint.seoAccessibility.targetWcagLevel || "AA"}
                  onChange={(e) =>
                    setBlueprint((prev) => ({
                      ...prev,
                      seoAccessibility: {
                        ...prev.seoAccessibility,
                        targetWcagLevel: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                >
                  <option value="AA">Level AA (Agency Standard)</option>
                  <option value="AAA">Level AAA (Government / Medical)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Prefers Reduced Motion Fallback Mode
                </label>
                <select
                  disabled={isApproved}
                  value={
                    blueprint.seoAccessibility.prefersReducedMotionHandling ||
                    "disable-kinetic"
                  }
                  onChange={(e) =>
                    setBlueprint((prev) => ({
                      ...prev,
                      seoAccessibility: {
                        ...prev.seoAccessibility,
                        prefersReducedMotionHandling: e.target.value as any,
                      },
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                >
                  <option value="disable-kinetic">
                    Disable Kinetic (Instant Jump & Plain Reveal)
                  </option>
                  <option value="reduce-scale">Reduce Scale & Velocity</option>
                  <option value="instant-fade">Instant Fade Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" /> Search Engine Optimization
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Meta Description Template
                </label>
                <textarea
                  rows={3}
                  disabled={isApproved}
                  value={blueprint.seoAccessibility.metaDescriptionTemplate || ""}
                  onChange={(e) =>
                    setBlueprint((prev) => ({
                      ...prev,
                      seoAccessibility: {
                        ...prev.seoAccessibility,
                        metaDescriptionTemplate: e.target.value,
                      },
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 disabled:opacity-60"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Social Open Graph Preview
                </p>
                <p className="text-xs font-semibold text-white">
                  {blueprint.seoAccessibility.socialOpenGraphTemplate?.title ||
                    blueprint.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {blueprint.seoAccessibility.socialOpenGraphTemplate
                    ?.description || blueprint.businessProfile.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Version Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Branch New Blueprint Version
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Creating version <span className="font-bold text-white">v{blueprint.version + 1}</span> from current v{blueprint.version}. The new version will start in DRAFT status.
            </p>

            <form onSubmit={handleBranchVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Change Summary / Iteration Goal *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Iterating on luxury typography and adding 3D interactive hero model."
                  value={branchSummary}
                  onChange={(e) => setBranchSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBranching || !branchSummary.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                >
                  {isBranching ? "Branching..." : `Create v${blueprint.version + 1}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-bold text-white">
                Transition Lifecycle Status
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Current Status: <span className="font-bold text-white">{blueprint.status}</span>
            </p>

            <form onSubmit={handleStatusTransition} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select New Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as BlueprintStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="DRAFT">DRAFT — Active Editing</option>
                  <option value="REVIEW">REVIEW — Stakeholder & Peer Review</option>
                  <option value="APPROVED">APPROVED — Locked & Production Ready</option>
                  <option value="ARCHIVED">ARCHIVED — Deprecated Historical</option>
                </select>
              </div>

              {targetStatus === "APPROVED" && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Approver Name / Role
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Transition Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved for client presentation."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium"
                >
                  {isTransitioning ? "Updating..." : "Update Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

