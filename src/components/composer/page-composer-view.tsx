"use client";

import React, { useState, useMemo } from "react";
import { PageCompositionData, PageSectionCompositionData } from "@/modules/composition/types";
import { ComponentDefinition } from "@/modules/registry/types";
import { ComponentAdapter } from "@/modules/registry/adapter";
import { AdaptiveComponentPreview } from "@/components/registry/adaptive-component-preview";
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Check,
  Settings,
  ChevronRight,
  FileText,
  Boxes,
  Zap,
} from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  category: string;
  experienceLevel: string;
}

interface BlueprintOption {
  id: string;
  title: string;
  projectId: string | null;
}

interface PageComposerViewProps {
  initialPages: PageCompositionData[];
  projects: ProjectOption[];
  blueprints: BlueprintOption[];
  componentDefinitions: ComponentDefinition[];
  currentProjectId?: string;
}

export function PageComposerView({
  initialPages,
  projects,
  blueprints,
  componentDefinitions,
  currentProjectId,
}: PageComposerViewProps) {
  const [pages, setPages] = useState<PageCompositionData[]>(initialPages);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    currentProjectId || projects[0]?.id || ""
  );
  const [activePageId, setActivePageId] = useState<string>(
    initialPages[0]?.id || ""
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialPages[0]?.sections[0]?.id || null
  );

  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showComponentDrawer, setShowComponentDrawer] = useState<boolean>(false);

  // Active Project Data
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Project Blueprints
  const projectBlueprints = useMemo(() => {
    return blueprints.filter(
      (b) => b.projectId === selectedProjectId || b.projectId === null
    );
  }, [blueprints, selectedProjectId]);

  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>(
    projectBlueprints[0]?.id || ""
  );

  // Active Page
  const activePage = useMemo(() => {
    return pages.find((p) => p.id === activePageId) || pages[0] || null;
  }, [pages, activePageId]);

  // Active Section
  const activeSection = useMemo(() => {
    if (!activePage) return null;
    return activePage.sections.find((s) => s.id === activeSectionId) || activePage.sections[0] || null;
  }, [activePage, activeSectionId]);

  // Active Component Definition for selected section
  const activeCompDef = useMemo(() => {
    if (!activeSection) return null;
    return componentDefinitions.find((c) => c.id === activeSection.componentId) || null;
  }, [activeSection, componentDefinitions]);

  // Generate pages from blueprint
  const handleGenerateFromBlueprint = async () => {
    if (!selectedBlueprintId || !selectedProjectId) return;
    setIsGenerating(true);
    setFeedback("Synthesizing page composition from blueprint...");

    try {
      const res = await fetch(`/api/projects/${selectedProjectId}/pages/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blueprintId: selectedBlueprintId }),
      });

      if (res.ok) {
        const data = await res.json();
        setPages(data.pages);
        if (data.pages.length > 0) {
          setActivePageId(data.pages[0].id);
          setActiveSectionId(data.pages[0].sections[0]?.id || null);
        }
        setFeedback(`Generated ${data.pages.length} pages from blueprint!`);
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback("Failed to generate pages.");
      }
    } catch {
      setFeedback("Error generating pages.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Reorder sections (Move Up / Down)
  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    if (!activePage) return;
    const newSections = [...activePage.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    // Swap
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Optimistic update
    const reorderedIds = newSections.map((s) => s.id);
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage.id
          ? {
              ...p,
              sections: newSections.map((s, idx) => ({ ...s, order: idx })),
            }
          : p
      )
    );

    // Call API
    try {
      await fetch(`/api/pages/${activePage.id}/sections/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedSectionIds: reorderedIds }),
      });
    } catch {
      // ignore
    }
  };

  // Toggle Section Enabled
  const handleToggleSection = async (sectionId: string, currentEnabled: boolean) => {
    // Optimistic update
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === sectionId ? { ...s, enabled: !currentEnabled } : s
              ),
            }
          : p
      )
    );

    try {
      await fetch(`/api/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
    } catch {
      // ignore
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.filter((s) => s.id !== sectionId),
            }
          : p
      )
    );

    if (activeSectionId === sectionId) {
      setActiveSectionId(null);
    }

    try {
      await fetch(`/api/sections/${sectionId}`, {
        method: "DELETE",
      });
    } catch {
      // ignore
    }
  };

  // Add Section to Active Page
  const handleAddSection = async (componentId: string) => {
    if (!activePage) return;
    try {
      const res = await fetch(`/api/pages/${activePage.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId }),
      });

      if (res.ok) {
        const data = await res.json();
        setPages((prev) =>
          prev.map((p) =>
            p.id === activePage.id
              ? { ...p, sections: [...p.sections, data.section] }
              : p
          )
        );
        setActiveSectionId(data.section.id);
        setShowComponentDrawer(false);
      }
    } catch {
      // ignore
    }
  };

  // Update Section Variant or Props
  const handleUpdateSectionProps = async (updates: Partial<PageSectionCompositionData>) => {
    if (!activeSection) return;

    // Optimistic update
    setPages((prev) =>
      prev.map((p) =>
        p.id === activePage?.id
          ? {
              ...p,
              sections: p.sections.map((s) =>
                s.id === activeSection.id ? { ...s, ...updates } : s
              ),
            }
          : p
      )
    );

    try {
      await fetch(`/api/sections/${activeSection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Composer Header */}
      <header className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">Page Composition Engine</h1>
              <p className="text-[11px] text-slate-400">
                Visual Slot Filling & Section Architecture
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-indigo-400 font-semibold focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name} ({p.experienceLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Blueprint Generator & Viewport Mode */}
        <div className="flex items-center gap-3">
          {projectBlueprints.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">Blueprint:</span>
              <select
                value={selectedBlueprintId}
                onChange={(e) => setSelectedBlueprintId(e.target.value)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none"
              >
                {projectBlueprints.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900">
                    {b.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerateFromBlueprint}
                disabled={isGenerating}
                className="ml-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3" />
                <span>Sync Blueprint</span>
              </button>
            </div>
          )}

          {/* Device Breakpoint Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDeviceMode("desktop")}
              className={`p-1.5 rounded ${deviceMode === "desktop" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              title="Desktop (1280px)"
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode("tablet")}
              className={`p-1.5 rounded ${deviceMode === "tablet" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              title="Tablet (768px)"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeviceMode("mobile")}
              className={`p-1.5 rounded ${deviceMode === "mobile" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              title="Mobile (375px)"
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {feedback && (
        <div className="px-6 py-2 bg-indigo-950/80 border-b border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2">
          <Check className="h-3.5 w-3.5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Composer Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Pages & Section Hierarchy */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
          {/* Pages Tab Bar */}
          <div className="p-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Site Pages ({pages.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePageId(p.id);
                    setActiveSectionId(p.sections[0]?.id || null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activePage?.id === p.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section Outline */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Page Sections ({activePage?.sections.length || 0})
            </span>
            <button
              onClick={() => setShowComponentDrawer(true)}
              className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add Section</span>
            </button>
          </div>

          {/* Sections List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {!activePage || activePage.sections.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No sections composed for this page yet. Click "Add Section" or "Sync Blueprint".
              </div>
            ) : (
              activePage.sections.map((sec, idx) => {
                const isSelected = activeSection?.id === sec.id;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 text-white"
                        : "bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-mono text-slate-500 w-4">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-semibold truncate">
                          {sec.customName || sec.componentId}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {sec.componentId} {sec.variantId ? `(${sec.variantId})` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Move Up/Down */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveSection(idx, "down");
                        }}
                        disabled={idx === activePage.sections.length - 1}
                        className="p-1 rounded text-slate-500 hover:text-slate-200 disabled:opacity-20"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>

                      {/* Enable/Disable */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSection(sec.id, sec.enabled);
                        }}
                        className={`p-1 rounded ${sec.enabled ? "text-emerald-400" : "text-slate-600"}`}
                      >
                        {sec.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(sec.id);
                        }}
                        className="p-1 rounded text-slate-600 hover:text-rose-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Canvas: Live Composed Page View */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-6 items-center">
          <div
            className={`w-full transition-all duration-300 space-y-6 ${
              deviceMode === "desktop"
                ? "max-w-5xl"
                : deviceMode === "tablet"
                ? "max-w-3xl"
                : "max-w-sm"
            }`}
          >
            {/* Visual Page Canvas Banner */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-2">
              <span className="font-mono">
                Route: {activePage?.slug || "/"} • Mode: {deviceMode.toUpperCase()}
              </span>
              <span>{activePage?.sections.filter((s) => s.enabled).length || 0} Active Sections</span>
            </div>

            {/* Sections Rendering in Order */}
            {!activePage || activePage.sections.length === 0 ? (
              <div className="p-16 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-sm">
                Page is empty. Add sections or sync from a blueprint.
              </div>
            ) : (
              activePage.sections.map((sec) => {
                if (!sec.enabled) return null;

                const compDef = componentDefinitions.find((c) => c.id === sec.componentId);
                if (!compDef) return null;

                // Adapt component to current project category and tokens
                const adapted = ComponentAdapter.adaptComponent(
                  compDef,
                  {
                    category: currentProject?.category || "healthcare",
                    experienceLevel: (currentProject?.experienceLevel || "CINEMATIC") as any,
                  },
                  sec.variantId || undefined
                );

                // Apply custom overrides
                const finalAdapted = {
                  ...adapted,
                  props: {
                    ...adapted.props,
                    ...sec.propsOverride,
                  },
                };

                const isSelected = activeSection?.id === sec.id;

                return (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer relative ${
                      isSelected
                        ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-950/40"
                        : "hover:ring-1 hover:ring-slate-700"
                    }`}
                  >
                    {/* Section Label Badge */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-slate-300 border border-white/10">
                      {sec.customName || sec.componentId}
                    </div>

                    <AdaptiveComponentPreview data={finalAdapted} interactive={false} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Inspector: Section Settings & Overrides */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/40 flex flex-col shrink-0 p-4 space-y-5 overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Settings className="h-4 w-4 text-indigo-400" />
            <span>Section Inspector</span>
          </div>

          {activeSection && activeCompDef ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Custom Section Name</label>
                <input
                  type="text"
                  value={activeSection.customName || ""}
                  onChange={(e) => handleUpdateSectionProps({ customName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {activeCompDef.variants.length > 1 && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Layout Variant</label>
                  <select
                    value={activeSection.variantId || activeCompDef.variants[0].id}
                    onChange={(e) => handleUpdateSectionProps({ variantId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none"
                  >
                    {activeCompDef.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Responsive Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Responsive Visibility</span>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!activeSection.responsiveSettings.hideOnMobile}
                      onChange={(e) =>
                        handleUpdateSectionProps({
                          responsiveSettings: {
                            ...activeSection.responsiveSettings,
                            hideOnMobile: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span>Hide on Mobile (&lt; 640px)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!activeSection.responsiveSettings.hideOnTablet}
                      onChange={(e) =>
                        handleUpdateSectionProps({
                          responsiveSettings: {
                            ...activeSection.responsiveSettings,
                            hideOnTablet: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-indigo-500"
                    />
                    <span>Hide on Tablet (&lt; 1024px)</span>
                  </label>
                </div>
              </div>

              {/* Component Info */}
              <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-500 text-[10px]">
                <div>Component ID: <span className="text-slate-300 font-mono">{activeCompDef.id}</span></div>
                <div>Family: <span className="text-slate-300">{activeCompDef.family}</span></div>
                <div>Section Type: <span className="text-slate-300">{activeCompDef.sectionType}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs">Select a section to inspect and customize</div>
          )}
        </div>
      </div>

      {/* Component Picker Modal / Drawer */}
      {showComponentDrawer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Add Component to Page</h3>
                <p className="text-xs text-slate-400">Choose from 42 production-ready components</p>
              </div>
              <button
                onClick={() => setShowComponentDrawer(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {componentDefinitions.map((def) => (
                <div
                  key={def.id}
                  onClick={() => handleAddSection(def.id)}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 font-mono">
                        {def.family}
                      </span>
                      <span className="text-[10px] text-slate-500">{def.sectionType}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{def.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{def.description}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>{def.variants.length} variant{def.variants.length > 1 ? "s" : ""}</span>
                    <span className="text-indigo-400 font-semibold">+ Add to Page</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

