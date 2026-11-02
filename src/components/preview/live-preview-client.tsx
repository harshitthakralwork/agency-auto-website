"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
  Palette,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  Box,
  Layers,
  RotateCw,
  Sun,
  Maximize2,
  Sliders,
  MoveHorizontal,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveDesignState, generateCssVariables } from "@/modules/design/resolver";
import { getCategoryPack } from "@/modules/categories/registry";
import { ExperienceBadge } from "@/components/layout/status-badge";
import {
  CanvasFrameSequence,
  ScrollReveal,
  PinnedStorySection,
  HorizontalScrollGallery,
  ScrollTextSequence,
} from "@/components/cinematic";

interface LivePreviewProps {
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
    designConfig: {
      experienceLevel?: string;
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
      threeDPreferences?: string;
      mediaPreferences?: string;
      sectionsConfigJson: string;
      responsiveSettings: string;
    } | null;
    assets?: Array<{
      id: string;
      name: string;
      fileName: string;
      fileUrl: string;
      assetType: string;
      assignedSlot: string | null;
      mimeType: string;
    }>;
  };
}

export function LivePreviewClient({ project }: LivePreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const categoryPack = getCategoryPack(project.category);
  const design = resolveDesignState(project.category, {
    ...project.designConfig,
    experienceLevel: project.experienceLevel,
  });
  const themeVars = generateCssVariables(design);

  // Before/After Slider state for Cinematic level
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 3D Canvas Mockup state for Immersive 3D level
  const [rotationX, setRotationX] = useState(15);
  const [rotationY, setRotationY] = useState(35);
  const [isWireframe, setIsWireframe] = useState(design.threeD.wireframeMode);
  const [activeLighting, setActiveLighting] = useState(design.threeD.lightingEnvironment);

  // Handle before/after drag
  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPosition(pos);
  };

  // Enabled sections sorted by order
  const activeSections = design.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  // Media asset assignments
  const beforeAsset = project.assets?.find((a) => a.assignedSlot === "BEFORE_SLOT");
  const afterAsset = project.assets?.find((a) => a.assignedSlot === "AFTER_SLOT");
  const heroVideo = project.assets?.find(
    (a) => a.assignedSlot === "HERO_BACKGROUND" && a.assetType === "VIDEO"
  );
  const heroImage = project.assets?.find(
    (a) => a.assignedSlot === "HERO_BACKGROUND" && a.assetType === "IMAGE"
  );
  const heroPoster = project.assets?.find((a) => a.assignedSlot === "POSTER_FALLBACK");
  const frameSequenceAsset = project.assets?.find(
    (a) =>
      (a.assignedSlot === "CANVAS_HERO_SEQUENCE" || a.assignedSlot === "HERO_BACKGROUND") &&
      (a.assetType === "FRAME_SEQUENCE" || a.fileName.endsWith(".json"))
  );

  // Pinned storytelling steps for Cinematic Level
  const cinematicStorySteps = categoryPack.keyFeatures.slice(0, 3).map((feat, i) => ({
    id: `story-step-${i}`,
    title: feat,
    description: `Engineered specifically for ${categoryPack.title} standards, delivering seamless digital elegance and verified customer confidence.`,
    badge: `Phase 0${i + 1} Architecture`,
    mediaUrl: heroImage?.fileUrl || beforeAsset?.fileUrl || undefined,
  }));

  // Horizontal gallery items
  const galleryAssets = project.assets?.filter((a) => a.assetType === "IMAGE") || [];
  const cinematicGalleryItems =
    galleryAssets.length > 0
      ? galleryAssets.slice(0, 5).map((a) => ({
          id: a.id,
          title: a.name,
          category: categoryPack.title,
          imageUrl: a.fileUrl,
          description: `High-resolution visual asset assigned to project library.`,
        }))
      : categoryPack.recommendedPages.slice(0, 4).map((p, i) => ({
          id: p.id,
          title: p.name,
          category: categoryPack.title,
          description: p.description,
        }));

  // Viewport container width constraints
  const viewportWidths = {
    desktop: "w-full max-w-full",
    tablet: "w-[768px] mx-auto shadow-2xl border-x border-slate-700",
    mobile: "w-[375px] mx-auto shadow-2xl border-x border-slate-700 rounded-3xl overflow-hidden my-4",
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Agency Control Bar */}
      <div className="sticky top-0 z-50 flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 bg-slate-950/95 px-6 py-2.5 backdrop-blur-md gap-3">
        {/* Left: Project title & Back link */}
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${project.id}/design`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Design Studio</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {project.name}
            </span>
            <ExperienceBadge level={design.experienceLevel} />
            <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800/60">
              {categoryPack.title}
            </span>
          </div>
        </div>

        {/* Center: Viewport Switcher */}
        <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-900 border border-slate-800 p-1 self-center">
          <button
            onClick={() => setViewport("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              viewport === "desktop"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setViewport("tablet")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              viewport === "tablet"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tablet (768px)</span>
          </button>

          <button
            onClick={() => setViewport("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              viewport === "mobile"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mobile (375px)</span>
          </button>
        </div>

        {/* Right: Actions & Disclaimer */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/projects/${project.id}/media`}
            className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white transition-colors font-medium border border-cyan-800/80 bg-cyan-950/60 px-2.5 py-1 rounded-lg"
          >
            <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
            <span>Media Studio</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-1 rounded-lg">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono">AGENCY PREVIEW</span>
          </div>
        </div>
      </div>

      {/* Main Preview Canvas Frame */}
      <div className="flex-1 bg-slate-900/40 p-0 overflow-y-auto">
        <div
          style={themeVars}
          className={`transition-all duration-300 min-h-screen ${viewportWidths[viewport]}`}
        >
          {/* RENDERED WEBSITE CONTAINER */}
          <div
            className="w-full min-h-screen flex flex-col"
            style={{
              backgroundColor: "var(--theme-bg)",
              color: "var(--theme-text)",
              fontFamily: "var(--theme-body-font)",
              fontSize: "var(--theme-base-font-size)",
            }}
          >
            {/* Top Navigation Bar of the Client Website */}
            <header
              className="sticky top-0 z-30 border-b transition-colors px-6 py-4 flex items-center justify-between backdrop-blur-md"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "rgba(148, 163, 184, 0.15)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-sm"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    borderRadius: "var(--theme-radius)",
                  }}
                >
                  {project.name.charAt(0)}
                </div>
                <span
                  className="font-bold tracking-tight text-lg"
                  style={{ fontFamily: "var(--theme-heading-font)" }}
                >
                  {project.name}
                </span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 text-sm">
                {categoryPack.recommendedPages.slice(0, 4).map((page) => (
                  <span
                    key={page.id}
                    className="cursor-pointer hover:opacity-80 transition-opacity font-medium"
                    style={{ color: "var(--theme-muted)" }}
                  >
                    {page.name}
                  </span>
                ))}
              </nav>

              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    borderRadius: "var(--theme-radius)",
                  }}
                >
                  Inquire / Book
                </button>
              </div>
            </header>

            {/* LEVEL 3: INTERACTIVE 3D EXPERIENCE SPOTLIGHT */}
            {design.experienceLevel === "IMMERSIVE_3D" && (
              <section
                className="py-12 px-6 md:px-12 border-b relative overflow-hidden"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  borderColor: "rgba(148, 163, 184, 0.2)",
                }}
              >
                <div
                  className="mx-auto flex flex-col lg:flex-row items-center gap-8 justify-between"
                  style={{ maxWidth: design.layout.containerWidth }}
                >
                  <div className="space-y-4 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-950/80 text-violet-300 border border-violet-800">
                      <Box className="h-3.5 w-3.5 text-violet-400" />
                      <span>LEVEL 3 SPATIAL 3D ENGINE HOOK [PHASE 3 ARCHITECTURE]</span>
                    </div>

                    <h2
                      className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight"
                      style={{ fontFamily: "var(--theme-heading-font)" }}
                    >
                      Interactive Spatial {categoryPack.title} Experience
                    </h2>

                    <p className="text-sm md:text-base leading-relaxed" style={{ color: "var(--theme-muted)" }}>
                      Interactive geometric viewport mockup. Registers 3D archetype ({design.threeD.objectType.replace(/_/g, " ")}) and lighting ({activeLighting}). Actual Three.js / React Three Fiber asset rendering and GSAP scroll camera orbits are scheduled for Phase 3.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => setIsWireframe(!isWireframe)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                          isWireframe
                            ? "bg-violet-600 text-white border-violet-500"
                            : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        Wireframe: {isWireframe ? "ON" : "OFF"}
                      </button>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        <Sun className="h-3.5 w-3.5 text-amber-400" />
                        <span className="capitalize">{activeLighting} Light</span>
                      </div>
                    </div>
                  </div>

                  {/* 3D Interactive Canvas Mockup */}
                  <div
                    onMouseMove={(e) => {
                      if (e.buttons === 1) {
                        setRotationY((prev) => prev + e.movementX * 0.8);
                        setRotationX((prev) => Math.max(-60, Math.min(60, prev - e.movementY * 0.8)));
                      }
                    }}
                    className="w-full max-w-md h-80 rounded-2xl border flex flex-col items-center justify-center p-6 relative cursor-grab active:cursor-grabbing select-none shadow-2xl"
                    style={{
                      backgroundColor: "var(--theme-bg)",
                      borderColor: "var(--theme-primary)",
                      borderRadius: "var(--theme-radius)",
                      perspective: "800px",
                    }}
                  >
                    {/* Simulated 3D Mesh Geometry */}
                    <div
                      className="transition-transform duration-75 relative flex items-center justify-center"
                      style={{
                        transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* 3D Polyhedron / Diamond prism representation */}
                      <div
                        className={`h-40 w-40 rounded-2xl flex flex-col items-center justify-center text-center p-4 border-2 shadow-2xl ${
                          isWireframe ? "bg-transparent border-dashed" : "backdrop-blur-md"
                        }`}
                        style={{
                          borderColor: "var(--theme-primary)",
                          backgroundColor: isWireframe
                            ? "transparent"
                            : "rgba(99, 102, 241, 0.15)",
                          boxShadow: `0 20px 50px rgba(0,0,0,0.5)`,
                        }}
                      >
                        <Box className="h-12 w-12 text-violet-400 animate-pulse mb-2" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          {design.threeD.objectType.replace("_", " ")}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-1">
                          GLTF/GLB WebGL Mesh
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Drag to Orbit: X: {Math.round(rotationX)}° | Y: {Math.round(rotationY)}°</span>
                      <span className="text-violet-400">R3F / Three.js Slot</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* LEVEL 2: CINEMATIC BEFORE/AFTER TRANSFORMATION SLIDER (Inspired by visual reference) */}
            {design.experienceLevel === "CINEMATIC" && design.media.beforeAfterComparisonEnabled && (
              <section
                className="py-16 md:py-20 px-6 md:px-12 border-b relative"
                style={{
                  backgroundColor: "var(--theme-bg)",
                  borderColor: "rgba(148, 163, 184, 0.15)",
                }}
              >
                <div className="mx-auto" style={{ maxWidth: design.layout.containerWidth }}>
                  <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      <span>LEVEL 2 CINEMATIC TRANSFORMATION SLIDER</span>
                    </div>
                    <h2
                      className="text-3xl md:text-4xl font-extrabold tracking-tight"
                      style={{ fontFamily: "var(--theme-heading-font)" }}
                    >
                      The Power of Complete Transformation
                    </h2>
                    <p className="text-xs md:text-sm" style={{ color: "var(--theme-muted)" }}>
                      Drag the center handle horizontally to inspect the dramatic before & after reveal.
                    </p>
                  </div>

                  {/* Interactive Before/After Split Frame */}
                  {beforeAsset && afterAsset ? (
                    <div
                      ref={sliderRef}
                      onMouseMove={(e) => {
                        if (e.buttons === 1) handleSliderMove(e);
                      }}
                      onClick={handleSliderMove}
                      onTouchMove={handleSliderMove}
                      className="relative w-full max-w-4xl mx-auto h-[380px] md:h-[460px] rounded-2xl overflow-hidden cursor-ew-resize select-none border shadow-2xl"
                      style={{
                        borderColor: "rgba(148, 163, 184, 0.25)",
                        borderRadius: "var(--theme-radius)",
                      }}
                    >
                      {/* AFTER Panel (Full base) */}
                      <img
                        src={afterAsset.fileUrl}
                        alt="After Transformation"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white pointer-events-none">
                        <div className="max-w-md space-y-2 relative z-10">
                          <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            After Transformation
                          </span>
                          <h3 className="text-2xl font-bold">
                            {afterAsset.name || categoryPack.recommendedSections.find((s) => s.id === activeSections[0]?.id)?.previewSnippet?.afterLabel || "Pristine Luxury Perfection"}
                          </h3>
                        </div>
                      </div>

                      {/* BEFORE Panel (Clipped by sliderPosition) */}
                      <div
                        className="absolute inset-0 overflow-hidden border-r-2 border-white pointer-events-none"
                        style={{
                          width: `${sliderPosition}%`,
                        }}
                      >
                        <img
                          src={beforeAsset.fileUrl}
                          alt="Before Transformation"
                          className="absolute inset-0 h-full max-w-none object-cover"
                          style={{
                            width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : "100%",
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                          <div className="max-w-md space-y-2 relative z-10">
                            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              Initial Raw State
                            </span>
                            <h3 className="text-2xl font-bold text-white">
                              {beforeAsset.name || categoryPack.recommendedSections.find((s) => s.id === activeSections[0]?.id)?.previewSnippet?.beforeLabel || "Raw Baseline Condition"}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Drag Handle Divider */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl flex items-center justify-center pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="h-10 w-10 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl -ml-0.5">
                          <MoveHorizontal className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center space-y-3">
                      <Sliders className="h-10 w-10 text-indigo-400 mx-auto" />
                      <h3 className="text-base font-bold text-white">Before/After Transformation Slot</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        No real before/after image pair is currently assigned to this project. Upload your transformation photography in the Media Studio.
                      </p>
                      <Link
                        href={`/projects/${project.id}/media`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg transition-colors"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Open Media Studio to Assign Photos</span>
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SECTIONS RENDER LOOP */}
            <main className="flex-1 flex flex-col">
              {activeSections.length === 0 ? (
                <div className="py-24 text-center p-6">
                  <h3 className="text-xl font-bold" style={{ fontFamily: "var(--theme-heading-font)" }}>
                    No Active Sections
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: "var(--theme-muted)" }}>
                    Please enable one or more sections in the Design Studio to render this website.
                  </p>
                </div>
              ) : (
                activeSections.map((section, idx) => {
                  const matchingRec = categoryPack.recommendedSections.find(
                    (s) => s.id === section.id
                  );
                  const headline =
                    matchingRec?.previewSnippet?.headline ||
                    section.customTitle ||
                    section.name;
                  const subheadline =
                    matchingRec?.previewSnippet?.subheadline ||
                    section.description ||
                    project.description ||
                    "";
                  const actionLabel = matchingRec?.previewSnippet?.actionLabel;

                  const isEven = idx % 2 === 0;
                  const isFullWidth = design.layout.layoutStyle === "full-width";
                  const isAsymmetric = design.layout.layoutStyle === "asymmetric";

                  const containerClass = isFullWidth
                    ? "w-full relative z-10"
                    : isAsymmetric
                    ? isEven
                      ? "max-w-[var(--theme-container)] mr-auto ml-0 md:ml-12 lg:ml-20 relative z-10"
                      : "max-w-[var(--theme-container)] ml-auto mr-0 md:mr-12 lg:mr-20 relative z-10"
                    : "mx-auto relative z-10";

                  return (
                    <section
                      key={section.id}
                      className="border-b relative overflow-hidden transition-colors"
                      style={{
                        backgroundColor: isEven ? "var(--theme-bg)" : "var(--theme-surface)",
                        borderColor: "rgba(148, 163, 184, 0.12)",
                        paddingTop: "var(--theme-section-padding-y)",
                        paddingBottom: "var(--theme-section-padding-y)",
                        paddingLeft: "var(--theme-section-padding-x)",
                        paddingRight: "var(--theme-section-padding-x)",
                      }}
                    >
                      {/* Authentic Hero Canvas Frame Sequence if assigned to CANVAS_HERO_SEQUENCE or HERO_BACKGROUND */}
                      {idx === 0 && frameSequenceAsset && (
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-50" data-testid="hero-canvas-frame-sequence">
                          <CanvasFrameSequence
                            manifestUrl={frameSequenceAsset.fileUrl}
                            posterUrl={heroPoster?.fileUrl}
                            fitMode="cover"
                            pinned={false}
                            className="w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        </div>
                      )}

                      {/* Authentic Hero Video Background if assigned to HERO_BACKGROUND slot */}
                      {idx === 0 && !frameSequenceAsset && heroVideo && (
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                          <video
                            src={heroVideo.fileUrl}
                            poster={heroPoster?.fileUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        </div>
                      )}

                      {/* Authentic Hero Image Background if assigned to HERO_BACKGROUND slot */}
                      {idx === 0 && !frameSequenceAsset && !heroVideo && heroImage && (
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
                          <img
                            src={heroImage.fileUrl}
                            alt="Hero Background"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                        </div>
                      )}

                      <div
                        className={containerClass}
                        style={{ maxWidth: isFullWidth ? "100%" : design.layout.containerWidth }}
                      >
                        <ScrollReveal
                          direction="up"
                          distance={design.animation.animationIntensity === "energetic" ? 45 : 30}
                          duration={design.animation.animationIntensity === "cinematic" ? 0.9 : 0.6}
                        >
                          {/* Section Tag */}
                          <div className="flex items-center gap-2 mb-3">
                          <span
                            className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest font-bold"
                            style={{
                              color: "var(--theme-primary)",
                              backgroundColor: "rgba(99, 102, 241, 0.1)",
                              borderRadius: "var(--theme-radius)",
                            }}
                          >
                            {section.name}
                          </span>
                        </div>

                        {/* Section Headline */}
                        <h2
                          className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-4xl leading-tight"
                          style={{ fontFamily: "var(--theme-heading-font)" }}
                        >
                          {headline}
                        </h2>

                        {/* Section Subheadline */}
                        {subheadline && (
                          <p
                            className="mt-4 text-base md:text-lg max-w-3xl leading-relaxed"
                            style={{ color: "var(--theme-muted)" }}
                          >
                            {subheadline}
                          </p>
                        )}

                        {/* CTA Buttons */}
                        {actionLabel && (
                          <div className="mt-8 flex flex-wrap gap-4">
                            <button
                              className="px-6 py-3 text-sm font-bold text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                              style={{
                                backgroundColor: "var(--theme-primary)",
                                borderRadius: "var(--theme-radius)",
                                transitionDuration: "var(--theme-transition-duration)",
                                transitionTimingFunction: "var(--theme-animation-timing)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `var(--theme-hover-scale) var(--theme-hover-y)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1) translateY(0)";
                              }}
                            >
                              <span>{actionLabel}</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <button
                              className="px-6 py-3 text-sm font-semibold border transition-all cursor-pointer"
                              style={{
                                borderColor: "var(--theme-muted)",
                                color: "var(--theme-text)",
                                borderRadius: "var(--theme-radius)",
                                transitionDuration: "var(--theme-transition-duration)",
                                transitionTimingFunction: "var(--theme-animation-timing)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `var(--theme-hover-scale) var(--theme-hover-y)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1) translateY(0)";
                              }}
                            >
                              Learn More
                            </button>
                          </div>
                        )}

                        {/* Services Grid */}
                        {idx === 1 && project.services && (
                          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {project.services.split(",").map((service, sIdx) => (
                              <div
                                key={sIdx}
                                className={`p-6 border transition-all ${
                                  isAsymmetric && sIdx % 2 !== 0 ? "md:translate-y-6" : ""
                                }`}
                                style={{
                                  backgroundColor: "var(--theme-surface)",
                                  borderColor: "rgba(148, 163, 184, 0.2)",
                                  borderRadius: "var(--theme-radius)",
                                  transitionDuration: "var(--theme-transition-duration)",
                                  transitionTimingFunction: "var(--theme-animation-timing)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = isAsymmetric && sIdx % 2 !== 0
                                    ? `var(--theme-hover-scale) translateY(1.2rem)`
                                    : `var(--theme-hover-scale) var(--theme-hover-y)`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = isAsymmetric && sIdx % 2 !== 0
                                    ? "scale(1) translateY(1.5rem)"
                                    : "scale(1) translateY(0)";
                                }}
                              >
                                <div
                                  className="h-9 w-9 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-sm"
                                  style={{
                                    backgroundColor: "var(--theme-secondary)",
                                    borderRadius: "var(--theme-radius)",
                                  }}
                                >
                                  {sIdx + 1}
                                </div>
                                <h3
                                  className="text-lg font-bold"
                                  style={{ fontFamily: "var(--theme-heading-font)" }}
                                >
                                  {service.trim()}
                                </h3>
                                <p
                                  className="mt-2 text-xs leading-relaxed"
                                  style={{ color: "var(--theme-muted)" }}
                                >
                                  Comprehensive professional solutions tailored to high performance and client satisfaction.
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                        </ScrollReveal>
                      </div>
                    </section>
                  );
                })
              )}

              {/* LEVEL 2: CINEMATIC PINNED STORYTELLING ENGINE */}
              {design.experienceLevel === "CINEMATIC" && cinematicStorySteps.length > 0 && (
                <PinnedStorySection
                  steps={cinematicStorySteps}
                  title={`${project.name} Signature Story`}
                  badge={`${categoryPack.title} Narrative`}
                />
              )}

              {/* LEVEL 2: CINEMATIC HORIZONTAL GALLERY TRAVEL */}
              {design.experienceLevel === "CINEMATIC" && cinematicGalleryItems.length > 0 && (
                <HorizontalScrollGallery
                  items={cinematicGalleryItems}
                  title={`${project.name} Visual Showcase`}
                  badge="Horizontal Flow"
                />
              )}
            </main>

            {/* Footer */}
            <footer
              className="py-12 px-6 md:px-12 border-t mt-auto"
              style={{
                backgroundColor: "var(--theme-surface)",
                borderColor: "rgba(148, 163, 184, 0.15)",
              }}
            >
              <div
                className="mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ maxWidth: design.layout.containerWidth }}
              >
                <div>
                  <h4
                    className="font-bold text-lg"
                    style={{ fontFamily: "var(--theme-heading-font)" }}
                  >
                    {project.name}
                  </h4>
                  {project.location && (
                    <p className="text-xs mt-1" style={{ color: "var(--theme-muted)" }}>
                      Located in {project.location}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    Experience Tier: {design.experienceLevel} • Agency Production Engine
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--theme-muted)" }}>
                  {categoryPack.recommendedPages.map((page) => (
                    <span key={page.id} className="hover:underline cursor-pointer">
                      {page.name}
                    </span>
                  ))}
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
