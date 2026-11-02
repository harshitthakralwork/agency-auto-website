"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Palette,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  Phone,
  Calendar,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveDesignState, generateCssVariables } from "@/modules/design/resolver";
import { getCategoryPack } from "@/modules/categories/registry";

interface LivePreviewProps {
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    location: string | null;
    description: string | null;
    services: string;
    targetAudience: string | null;
    status: string;
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

export function LivePreviewClient({ project }: LivePreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const categoryPack = getCategoryPack(project.category);
  const design = resolveDesignState(project.category, project.designConfig);
  const themeVars = generateCssVariables(design);

  // Enabled sections sorted by order
  const activeSections = design.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

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
            <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-indigo-800/60">
              {categoryPack.title}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              {design.preset}
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

        {/* Right: Disclaimer Badge */}
        <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-lg">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono">AGENCY PREVIEW — NON-PRODUCTION</span>
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
            }}
          >
            {/* Top Navigation Bar of the Client Website */}
            <header
              className="sticky top-0 z-30 border-b transition-colors px-6 py-4 flex items-center justify-between"
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

              {/* Navigation Links (from category pack recommended pages) */}
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

              <button
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105"
                style={{
                  backgroundColor: "var(--theme-primary)",
                  borderRadius: "var(--theme-radius)",
                }}
              >
                Inquire / Book
              </button>
            </header>

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

                  // Alternating section surface for visual contrast
                  const isEven = idx % 2 === 0;

                  return (
                    <section
                      key={section.id}
                      className="py-16 md:py-24 px-6 md:px-12 border-b"
                      style={{
                        backgroundColor: isEven ? "var(--theme-bg)" : "var(--theme-surface)",
                        borderColor: "rgba(148, 163, 184, 0.12)",
                      }}
                    >
                      <div
                        className="mx-auto"
                        style={{ maxWidth: design.layout.containerWidth }}
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

                        {/* CTA Button if present */}
                        {actionLabel && (
                          <div className="mt-8 flex flex-wrap gap-4">
                            <button
                              className="px-6 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                              style={{
                                backgroundColor: "var(--theme-primary)",
                                borderRadius: "var(--theme-radius)",
                              }}
                            >
                              <span>{actionLabel}</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>

                            <button
                              className="px-6 py-3 text-sm font-semibold border transition-opacity hover:opacity-80"
                              style={{
                                borderColor: "var(--theme-muted)",
                                color: "var(--theme-text)",
                                borderRadius: "var(--theme-radius)",
                              }}
                            >
                              Learn More
                            </button>
                          </div>
                        )}

                        {/* Feature Grid / Cards inside section */}
                        {idx === 1 && project.services && (
                          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {project.services.split(",").map((service, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-6 border transition-all"
                                style={{
                                  backgroundColor: "var(--theme-surface)",
                                  borderColor: "rgba(148, 163, 184, 0.2)",
                                  borderRadius: "var(--theme-radius)",
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
                      </div>
                    </section>
                  );
                })
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
                    Powered by Agency Website Engine • Draft Mode
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

