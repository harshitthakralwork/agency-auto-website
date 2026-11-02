"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Palette,
  Eye,
  Save,
  RotateCcw,
  Sparkles,
  Sliders,
  Type,
  Layout,
  Check,
  MoveUp,
  MoveDown,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DESIGN_PRESETS, AVAILABLE_FONTS } from "@/modules/design/presets";
import {
  DesignPresetId,
  ProjectDesignState,
  SectionConfigItem,
} from "@/modules/design/types";
import { resolveDesignState } from "@/modules/design/resolver";
import { getCategoryPack } from "@/modules/categories/registry";
import { CategoryBadge } from "@/components/layout/status-badge";

interface DesignStudioProps {
  project: {
    id: string;
    name: string;
    category: string;
    designConfig: {
      preset: string;
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      backgroundColor: string;
      surfaceColor: string;
      textColor: string;
      mutedTextColor: string;
      headingFont: string;
      bodyFont: string;
      baseFontSize: string;
      layoutStyle: string;
      borderRadius: string;
      containerWidth: string;
      animationIntensity: string;
      enableCanvasFx: boolean;
      sectionsConfigJson: string;
      responsiveSettings: string;
    } | null;
  };
}

export function DesignStudioView({ project }: DesignStudioProps) {
  const router = useRouter();
  const categoryPack = getCategoryPack(project.category);

  // Initialize design state using resolver
  const [designState, setDesignState] = useState<ProjectDesignState>(() =>
    resolveDesignState(project.category, project.designConfig)
  );

  const [activeTab, setActiveTab] = useState<"preset" | "colors" | "typography" | "layout" | "sections">("preset");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply a preset
  const handleApplyPreset = (presetId: Exclude<DesignPresetId, "custom">) => {
    const p = DESIGN_PRESETS[presetId];
    setDesignState((prev) => ({
      ...prev,
      preset: p.id,
      colors: { ...p.colors },
      typography: { ...p.typography },
      layout: { ...p.layout },
      animation: { ...p.animation },
    }));
  };

  // Color change handler
  const handleColorChange = (key: keyof ProjectDesignState["colors"], value: string) => {
    setDesignState((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
  };

  // Typography change handler
  const handleTypographyChange = (key: keyof ProjectDesignState["typography"], value: string) => {
    setDesignState((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
  };

  // Layout change handler
  const handleLayoutChange = (key: keyof ProjectDesignState["layout"], value: string) => {
    setDesignState((prev) => ({
      ...prev,
      layout: { ...prev.layout, [key]: value },
    }));
  };

  // Animation intensity change handler
  const handleAnimationChange = (intensity: ProjectDesignState["animation"]["animationIntensity"]) => {
    setDesignState((prev) => ({
      ...prev,
      animation: { ...prev.animation, animationIntensity: intensity },
    }));
  };

  // Toggle section enabled
  const handleToggleSection = (sectionId: string) => {
    setDesignState((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
      ),
    }));
  };

  // Move section order
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    setDesignState((prev) => {
      const newSections = [...prev.sections];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSections.length) return prev;

      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;

      return {
        ...prev,
        sections: newSections.map((s, idx) => ({ ...s, order: idx + 1 })),
      };
    });
  };

  // Save changes to database
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset: designState.preset,
          primaryColor: designState.colors.primary,
          secondaryColor: designState.colors.secondary,
          accentColor: designState.colors.accent,
          backgroundColor: designState.colors.background,
          surfaceColor: designState.colors.surface,
          textColor: designState.colors.text,
          mutedTextColor: designState.colors.mutedText,
          headingFont: designState.typography.headingFont,
          bodyFont: designState.typography.bodyFont,
          baseFontSize: designState.typography.baseFontSize,
          layoutStyle: designState.layout.layoutStyle,
          borderRadius: designState.layout.borderRadius,
          containerWidth: designState.layout.containerWidth,
          animationIntensity: designState.animation.animationIntensity,
          enableCanvasFx: designState.animation.enableCanvasFx,
          sections: designState.sections,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to save design configuration");
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error occurred while saving design tokens");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Project Hub</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Design Configuration Studio
            </h1>
            <CategoryBadge categoryId={project.category} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Customizing tokens, typography scales, palettes, and section architecture for{" "}
            <strong className="text-white">{project.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}/preview`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="h-4 w-4" />
              <span>Live Preview</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2 shadow-lg shadow-indigo-600/30 px-5"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Design Tokens</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {[
          { id: "preset", label: "Presets", icon: Sparkles },
          { id: "colors", label: "Color Tokens", icon: Palette },
          { id: "typography", label: "Typography", icon: Type },
          { id: "layout", label: "Layout & Motion", icon: Layout },
          { id: "sections", label: "Sections Blueprint", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRESETS */}
      {activeTab === "preset" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Design Style Presets</h2>
              <p className="text-xs text-slate-400">
                Select a foundational style. Choosing a preset updates colors, typography, and motion parameters while keeping custom values fully editable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(DESIGN_PRESETS).map((p) => {
              const isSelected = designState.preset === p.id;
              return (
                <Card
                  key={p.id}
                  onClick={() => handleApplyPreset(p.id as Exclude<DesignPresetId, "custom">)}
                  className={`p-5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500 shadow-xl"
                      : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-slate-700 shadow-sm"
                          style={{ backgroundColor: p.colors.primary }}
                        />
                        <span className="font-semibold text-sm text-white">{p.name}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-indigo-300/80 font-medium">{p.tagline}</p>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Headings: {p.typography.headingFont}</span>
                      <span>Canvas: {p.colors.background}</span>
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      {[p.colors.primary, p.colors.secondary, p.colors.accent, p.colors.background, p.colors.surface].map(
                        (col, i) => (
                          <div
                            key={i}
                            className="h-4 flex-1 rounded border border-slate-800 shadow-sm"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        )
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COLOR TOKENS */}
      {activeTab === "colors" && (
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-400" />
              <span>Custom Color Tokens</span>
            </CardTitle>
            <CardDescription>
              Fine-tune the individual color tokens. Custom hex values override any preset foundation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: "primary", label: "Primary Brand / Accent", desc: "Main CTA buttons, highlights, and primary anchors" },
                { key: "secondary", label: "Secondary Brand", desc: "Subheadings, secondary cards, badges" },
                { key: "accent", label: "Tertiary Spark / Accent", desc: "Special tags, notification sparks, icons" },
                { key: "background", label: "Canvas Background", desc: "Root page canvas color" },
                { key: "surface", label: "Card & Surface", desc: "Containers, sections, dialogs" },
                { key: "text", label: "Primary Headline Text", desc: "Primary text and titles" },
                { key: "mutedText", label: "Muted Body Text", desc: "Descriptions, secondary captions, metadata" },
              ].map((token) => {
                const colorKey = token.key as keyof ProjectDesignState["colors"];
                const val = designState.colors[colorKey];
                return (
                  <div key={token.key} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-200">
                        {token.label}
                      </label>
                      <div
                        className="h-6 w-10 rounded border border-slate-700 shadow-sm"
                        style={{ backgroundColor: val }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{token.desc}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="h-9 w-10 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleColorChange(colorKey, e.target.value)}
                        className="flex-1 h-9 rounded-lg border border-slate-700 bg-slate-900 px-3 text-xs font-mono text-slate-100 uppercase"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: TYPOGRAPHY */}
      {activeTab === "typography" && (
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4 text-indigo-400" />
              <span>Typography Scales</span>
            </CardTitle>
            <CardDescription>
              Configure fonts for headings, subtitles, and body text.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Heading Font */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Heading Font Family
                </label>
                <select
                  value={designState.typography.headingFont}
                  onChange={(e) => handleTypographyChange("headingFont", e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Used for H1 hero titles, section headlines, and banners.</p>
              </div>

              {/* Body Font */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Body Font Family
                </label>
                <select
                  value={designState.typography.bodyFont}
                  onChange={(e) => handleTypographyChange("bodyFont", e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {AVAILABLE_FONTS.map((font) => (
                    <option key={font.name} value={font.name}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Used for paragraphs, feature descriptions, and navigational menus.</p>
              </div>
            </div>

            {/* Typography Live Preview */}
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase text-indigo-400">Live Typography Scale Preview</span>
              <h2
                className="text-2xl md:text-3xl font-bold tracking-tight text-white"
                style={{ fontFamily: `"${designState.typography.headingFont}", sans-serif` }}
              >
                Transforming Visions into Cinematic Digital Experiences
              </h2>
              <p
                className="text-sm text-slate-300 leading-relaxed max-w-2xl"
                style={{ fontFamily: `"${designState.typography.bodyFont}", sans-serif` }}
              >
                Our bespoke web architecture blends artistic typography, performance optimization, and responsive design systems engineered for conversion.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: LAYOUT & MOTION */}
      {activeTab === "layout" && (
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layout className="h-4 w-4 text-amber-400" />
              <span>Layout & Motion Dynamics</span>
            </CardTitle>
            <CardDescription>
              Control container geometry, card border radii, and animation intensity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Layout Style */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Layout Structure
                </label>
                <select
                  value={designState.layout.layoutStyle}
                  onChange={(e) => handleLayoutChange("layoutStyle", e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="modern-contained">Modern Contained (Standard)</option>
                  <option value="full-width">Full-Width Edge-to-Edge</option>
                  <option value="asymmetric">Asymmetric Agency Grid</option>
                </select>
                <p className="text-[11px] text-slate-400">Container constraint and structural alignment.</p>
              </div>

              {/* Border Radius */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Border Radius
                </label>
                <select
                  value={designState.layout.borderRadius}
                  onChange={(e) => handleLayoutChange("borderRadius", e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="0px">Square (0px)</option>
                  <option value="0.25rem">Minimal Rounded (4px)</option>
                  <option value="0.5rem">Subtle Rounded (8px)</option>
                  <option value="0.75rem">Modern Curved (12px)</option>
                  <option value="1rem">Pill / Soft Curved (16px)</option>
                </select>
                <p className="text-[11px] text-slate-400">Corner roundness applied across cards, inputs, and buttons.</p>
              </div>

              {/* Animation Intensity */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Animation Intent
                </label>
                <select
                  value={designState.animation.animationIntensity}
                  onChange={(e) =>
                    handleAnimationChange(e.target.value as ProjectDesignState["animation"]["animationIntensity"])
                  }
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="none">None (Static / Instant)</option>
                  <option value="subtle">Subtle (Smooth fades)</option>
                  <option value="cinematic">Cinematic (Staggered reveals)</option>
                  <option value="energetic">Energetic (Dynamic springs)</option>
                </select>
                <p className="text-[11px] text-slate-400">Scroll trigger and interaction transition speed.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: SECTIONS BLUEPRINT */}
      {activeTab === "sections" && (
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Configured Sections for {categoryPack.title}</span>
                </CardTitle>
                <CardDescription>
                  Toggle sections on or off, reorder sequence, and customize titles for the website build.
                </CardDescription>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800/60">
                {designState.sections.filter((s) => s.enabled).length} of {designState.sections.length} Active
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {designState.sections.map((section, idx) => (
              <div
                key={section.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                  section.enabled
                    ? "bg-slate-900/80 border-slate-700"
                    : "bg-slate-950/50 border-slate-800/60 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[11px] font-mono text-slate-400 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {section.customTitle || section.name}
                      </span>
                      {section.customTitle && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          (Original: {section.name})
                        </span>
                      )}
                    </div>
                    {section.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Reorder Buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => handleMoveSection(idx, "up")}
                    className="h-8 w-8 p-0"
                    title="Move Up"
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={idx === designState.sections.length - 1}
                    onClick={() => handleMoveSection(idx, "down")}
                    className="h-8 w-8 p-0"
                    title="Move Down"
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>

                  {/* Toggle Button */}
                  <Button
                    variant={section.enabled ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleToggleSection(section.id)}
                    className="gap-1.5 text-xs h-8 px-3"
                  >
                    {section.enabled ? (
                      <>
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4 text-slate-500" />
                        <span>Disabled</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-800">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost">Return to Project Hub</Button>
        </Link>

        <div className="flex items-center gap-3">
          <Link href={`/projects/${project.id}/preview`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              <span>Launch Live Preview</span>
            </Button>
          </Link>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="gap-2 shadow-lg shadow-indigo-600/30 px-6"
          >
            <Save className="h-4 w-4" />
            <span>Save All Configurations</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

