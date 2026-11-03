"use client";

import React, { useState, useMemo } from "react";
import { ComponentDefinition, ComponentFamily, ExperienceLevel } from "@/modules/registry/types";
import { ComponentAdapter } from "@/modules/registry/adapter";
import { AdaptiveComponentPreview } from "./adaptive-component-preview";
import {
  Search,
  Filter,
  Star,
  Sparkles,
  Eye,
  Sliders,
  Layers,
  ChevronRight,
  Plus,
  Check,
  Palette,
  Box,
  Laptop,
  Film,
  Compass,
} from "lucide-react";

interface RegistryStudioViewProps {
  initialDefinitions: ComponentDefinition[];
  projects?: Array<{ id: string; name: string }>;
}

const FAMILIES: Array<{ id: ComponentFamily | "ALL"; label: string }> = [
  { id: "ALL", label: "All Families" },
  { id: "HERO", label: "Hero" },
  { id: "BUSINESS", label: "Business" },
  { id: "CONVERSION", label: "Conversion" },
  { id: "SOCIAL_PROOF", label: "Social Proof" },
  { id: "MEDIA", label: "Media" },
  { id: "CONTENT", label: "Content" },
  { id: "ADVANCED", label: "Advanced" },
];

const CATEGORIES = [
  { id: "healthcare", label: "Healthcare & Clinics" },
  { id: "hotels-banquets", label: "Hotels & Banquets" },
  { id: "food-restaurants", label: "Food & Restaurants" },
  { id: "fitness-sports", label: "Fitness & Sports" },
  { id: "salon-beauty", label: "Salon & Beauty" },
  { id: "schools-coaching", label: "Schools & Coaching" },
];

const PRESETS = [
  { id: "cinematic", label: "Cinematic Dark" },
  { id: "minimal", label: "Clean Minimal" },
  { id: "luxury", label: "Warm Luxury" },
  { id: "creative", label: "Bold Creative" },
  { id: "corporate", label: "Executive Trust" },
];

export function RegistryStudioView({
  initialDefinitions,
  projects = [],
}: RegistryStudioViewProps) {
  const [definitions, setDefinitions] = useState<ComponentDefinition[]>(initialDefinitions);
  const [selectedFamily, setSelectedFamily] = useState<ComponentFamily | "ALL">("ALL");
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | "ALL">("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Adaptation Inspector State
  const [activeCategory, setActiveCategory] = useState<string>("healthcare");
  const [activePreset, setActivePreset] = useState<string>("cinematic");
  const [selectedComponent, setSelectedComponent] = useState<ComponentDefinition>(
    initialDefinitions[0] || null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    initialDefinitions[0]?.variants[0]?.id || ""
  );

  // Project Library Binding State
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || "");
  const [bindSuccess, setBindSuccess] = useState<string | null>(null);

  // Filtered definitions
  const filtered = useMemo(() => {
    return definitions.filter((item) => {
      if (selectedFamily !== "ALL" && item.family !== selectedFamily) return false;
      if (selectedLevel !== "ALL" && !item.supportedExperienceLevels.includes(selectedLevel))
        return false;
      if (favoritesOnly && !item.isFavorite) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesType = item.sectionType.toLowerCase().includes(q);
        const matchesTag = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesType && !matchesTag) return false;
      }
      return true;
    });
  }, [definitions, selectedFamily, selectedLevel, favoritesOnly, searchQuery]);

  // Compute live adaptation
  const adaptedData = useMemo(() => {
    if (!selectedComponent) return null;
    return ComponentAdapter.adaptComponent(
      selectedComponent,
      {
        category: activeCategory,
        experienceLevel: (selectedComponent.supportedExperienceLevels.includes("CINEMATIC")
          ? "CINEMATIC"
          : selectedComponent.supportedExperienceLevels[0]) as ExperienceLevel,
        designPreset: activePreset as any,
      },
      selectedVariantId
    );
  }, [selectedComponent, selectedVariantId, activeCategory, activePreset]);

  // Toggle favorite
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/registry/components/${id}/favorite`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setDefinitions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isFavorite: data.isFavorite } : c))
        );
      }
    } catch {
      // optimistic update
      setDefinitions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
      );
    }
  };

  // Add to project library
  const handleAddToProject = async () => {
    if (!selectedProject || !selectedComponent) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject}/components`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: selectedComponent.id,
          variantId: selectedVariantId,
        }),
      });
      if (res.ok) {
        setBindSuccess(`Added ${selectedComponent.name} to project library!`);
        setTimeout(() => setBindSuccess(null), 3000);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Box className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Component Registry</h1>
              <p className="text-xs text-slate-400">
                {definitions.length} Production Components Across 7 Families with Category & Token Adaptation
              </p>
            </div>
          </div>
        </div>

        {/* Global Adaptation Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-transparent text-indigo-400 font-semibold focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-medium">Preset:</span>
            <select
              value={activePreset}
              onChange={(e) => setActivePreset(e.target.value)}
              className="bg-transparent text-pink-400 font-semibold focus:outline-none cursor-pointer"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Catalog, Right Inspector & Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Filterable Catalog */}
        <div className="w-1/3 min-w-[340px] max-w-[460px] border-r border-slate-800 flex flex-col bg-slate-900/40">
          {/* Search & Quick Filters */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search components, tags, sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Family Tabs */}
            <div className="flex flex-wrap gap-1">
              {FAMILIES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFamily(f.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    selectedFamily === f.id
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Experience Level & Favorites Filter */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Tier:</span>
                <button
                  onClick={() => setSelectedLevel("ALL")}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    selectedLevel === "ALL" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedLevel("STANDARD")}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    selectedLevel === "STANDARD" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  Std
                </button>
                <button
                  onClick={() => setSelectedLevel("CINEMATIC")}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    selectedLevel === "CINEMATIC" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  Cine
                </button>
                <button
                  onClick={() => setSelectedLevel("IMMERSIVE_3D")}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    selectedLevel === "IMMERSIVE_3D" ? "bg-slate-700 text-white" : "text-slate-400"
                  }`}
                >
                  3D
                </button>
              </div>

              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors ${
                  favoritesOnly
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Star className={`h-3 w-3 ${favoritesOnly ? "fill-amber-400" : ""}`} />
                <span>Favorites</span>
              </button>
            </div>
          </div>

          {/* Component List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No components match the selected filters.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedComponent?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedComponent(item);
                      setSelectedVariantId(item.variants[0]?.id || "");
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/30"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400 border border-indigo-500/20">
                            {item.family}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.sectionType}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200 leading-snug">
                          {item.name}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => handleToggleFavorite(item.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-amber-400 transition-colors"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            item.isFavorite ? "fill-amber-400 text-amber-400" : ""
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {item.supportedExperienceLevels.map((lvl) => (
                          <span
                            key={lvl}
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              lvl === "IMMERSIVE_3D"
                                ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                                : lvl === "CINEMATIC"
                                ? "bg-indigo-950 text-indigo-300 border border-indigo-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {lvl === "IMMERSIVE_3D" ? "3D" : lvl === "CINEMATIC" ? "Cine" : "Std"}
                          </span>
                        ))}
                      </div>

                      <span className="text-slate-400">
                        {item.variants.length} variant{item.variants.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Preview & Token Inspector */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
          {selectedComponent && adaptedData ? (
            <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
              {/* Component Control Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      {selectedComponent.family} // {selectedComponent.sectionType}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedComponent.name}</h2>
                </div>

                {/* Variant & Project Binding */}
                <div className="flex flex-wrap items-center gap-3">
                  {selectedComponent.variants.length > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400">Variant:</span>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none"
                      >
                        {selectedComponent.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {projects.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-200 focus:outline-none"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddToProject}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add to Project</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {bindSuccess && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>{bindSuccess}</span>
                </div>
              )}

              {/* Live Adaptive Preview Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Eye className="h-4 w-4 text-emerald-400" />
                    Live Component Render (Category: {activeCategory} • Preset: {activePreset})
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    ID: {selectedComponent.id}
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-white">
                  <AdaptiveComponentPreview data={adaptedData} interactive={true} />
                </div>
              </div>

              {/* Tokens & Props Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resolved Tokens Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Palette className="h-4 w-4 text-pink-400" />
                    <span>Applied Design Tokens</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Heading Font</span>
                      <span className="font-mono text-slate-200">{adaptedData.tokenStyles.fontHeading}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 block">Body Font</span>
                      <span className="font-mono text-slate-200">{adaptedData.tokenStyles.fontBody}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Primary Color</span>
                        <span className="font-mono text-slate-200">{adaptedData.tokenStyles.colorPrimary}</span>
                      </div>
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: adaptedData.tokenStyles.colorPrimary }}
                      />
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Secondary Accent</span>
                        <span className="font-mono text-slate-200">{adaptedData.tokenStyles.colorSecondary}</span>
                      </div>
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: adaptedData.tokenStyles.colorSecondary }}
                      />
                    </div>
                  </div>
                </div>

                {/* Properties & Schema Card */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Sliders className="h-4 w-4 text-indigo-400" />
                    <span>Configured Properties ({selectedComponent.propDefinitions.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                    {selectedComponent.propDefinitions.map((prop) => (
                      <div
                        key={prop.name}
                        className="p-2 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-mono text-slate-300 font-semibold">{prop.name}</span>
                          <span className="text-[10px] text-slate-500 block">{prop.description}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {prop.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-sm">Select a component to inspect</div>
          )}
        </div>
      </div>
    </div>
  );
}
