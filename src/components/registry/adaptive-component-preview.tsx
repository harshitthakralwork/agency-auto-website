"use client";

import React, { useState } from "react";
import { AdaptedComponentData } from "@/modules/registry/types";
import {
  Check,
  Star,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Shield,
  Award,
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  Sliders,
  ExternalLink,
} from "lucide-react";

interface AdaptiveComponentPreviewProps {
  data: AdaptedComponentData;
  interactive?: boolean;
}

export function AdaptiveComponentPreview({
  data,
  interactive = true,
}: AdaptiveComponentPreviewProps) {
  const { componentId, variantId, props, tokenStyles } = data;
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [activeHotspot, setActiveHotspot] = useState<number>(0);

  const containerStyle: React.CSSProperties = {
    backgroundColor: tokenStyles.colorBackground || "#ffffff",
    color: tokenStyles.colorText || "#0f172a",
    fontFamily: tokenStyles.fontBody || "Inter, sans-serif",
    borderRadius: tokenStyles.borderRadius || "0.5rem",
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: tokenStyles.fontHeading || "Inter, sans-serif",
    color: tokenStyles.colorPrimary || "#0f172a",
  };

  const primaryBtnStyle: React.CSSProperties = {
    backgroundColor: tokenStyles.colorSecondary || "#3b82f6",
    color: "#ffffff",
    borderRadius: tokenStyles.borderRadius || "0.5rem",
  };

  const surfaceStyle: React.CSSProperties = {
    backgroundColor: tokenStyles.colorSurface || "#f8fafc",
    borderColor: "rgba(100, 116, 139, 0.2)",
    borderRadius: tokenStyles.borderRadius || "0.5rem",
  };

  // --- 1. HERO FAMILY ---
  if (componentId.startsWith("hero-")) {
    if (componentId === "hero-split") {
      return (
        <div style={containerStyle} className="p-8 md:p-12 border transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {Boolean(props.badgeText) && (
                <span
                  style={{
                    backgroundColor: `${tokenStyles.colorSecondary}15`,
                    color: tokenStyles.colorSecondary,
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {String(props.badgeText)}
                </span>
              )}
              <h1 style={headingStyle} className="text-3xl md:text-5xl font-extrabold leading-tight">
                {String(props.headline)}
              </h1>
              <p style={{ color: tokenStyles.colorMutedText }} className="text-base md:text-lg leading-relaxed">
                {String(props.subheadline)}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button style={primaryBtnStyle} className="px-6 py-3 font-medium text-sm shadow-md hover:opacity-90 transition-opacity">
                  {String(props.primaryCtaText)}
                </button>
                {Boolean(props.secondaryCtaText) && (
                  <button
                    style={{ borderColor: tokenStyles.colorMutedText }}
                    className="px-6 py-3 border font-medium text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {String(props.secondaryCtaText)}
                  </button>
                )}
              </div>
            </div>

            <div className="relative">
              <div
                style={surfaceStyle}
                className="aspect-4/3 border overflow-hidden relative shadow-xl flex items-center justify-center p-6 bg-slate-900 text-white"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-90" />
                <div className="relative z-10 text-center p-6 space-y-3">
                  <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">Featured Media Showcase</span>
                  <div className="text-xl font-bold">{String(props.headline)}</div>
                  <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-xs backdrop-blur-sm">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span>{String(props.statsLabel || "Standard")}: <strong>{String(props.statsValue || "99.8%")}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (componentId === "hero-centered") {
      return (
        <div style={containerStyle} className="p-10 md:p-16 border text-center relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-6">
            {Boolean(props.badgeText) && (
              <span
                style={{
                  backgroundColor: `${tokenStyles.colorSecondary}15`,
                  color: tokenStyles.colorSecondary,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              >
                {String(props.badgeText)}
              </span>
            )}
            <h1 style={headingStyle} className="text-4xl md:text-5xl font-black leading-tight">
              {String(props.headline)}
            </h1>
            <p style={{ color: tokenStyles.colorMutedText }} className="text-lg max-w-2xl mx-auto leading-relaxed">
              {String(props.subheadline)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button style={primaryBtnStyle} className="px-7 py-3.5 font-semibold text-sm shadow-lg hover:opacity-90">
                {String(props.primaryCtaText)}
              </button>
              {Boolean(props.secondaryCtaText) && (
                <button className="px-7 py-3.5 border font-semibold text-sm rounded-lg hover:bg-slate-100 transition-colors">
                  {String(props.secondaryCtaText)}
                </button>
              )}
            </div>
            {Boolean(props.ratingText) && (
              <div className="flex items-center justify-center gap-2 pt-4 text-xs font-medium" style={{ color: tokenStyles.colorMutedText }}>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span>{String(props.ratingText)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (componentId === "hero-editorial") {
      return (
        <div style={containerStyle} className="p-8 md:p-14 border">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8 space-y-4">
              <span className="text-xs uppercase tracking-widest font-mono text-slate-500">
                {String(props.editionLabel || "Bespoke Edition")}
              </span>
              <h1 style={headingStyle} className="text-4xl md:text-6xl font-serif font-light leading-tight">
                {String(props.headline)}
              </h1>
              <p style={{ color: tokenStyles.colorMutedText }} className="text-base leading-relaxed pt-2">
                {String(props.subheadline)}
              </p>
              <div className="pt-4">
                <button style={primaryBtnStyle} className="px-6 py-3 text-sm font-medium tracking-wide uppercase">
                  {String(props.primaryCtaText)}
                </button>
              </div>
            </div>
            <div className="md:col-span-4 border-l pl-6 space-y-4 border-slate-300">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">Core Ethos</span>
              <blockquote className="font-serif italic text-lg leading-snug" style={{ color: tokenStyles.colorPrimary }}>
                {String(props.pullQuote)}
              </blockquote>
            </div>
          </div>
        </div>
      );
    }

    // Video / Cinematic / 3D fallback preview
    return (
      <div style={containerStyle} className="p-8 md:p-12 border bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {componentId === "hero-3d" ? "Three.js 3D WebGL Canvas" : "Cinematic Video / Canvas Scrub"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">{String(props.headline)}</h1>
          <p className="text-slate-300 text-base md:text-lg">{String(props.subheadline)}</p>
          <div className="flex justify-center gap-4 pt-4">
            <button style={primaryBtnStyle} className="px-6 py-3 font-semibold text-sm">
              {String(props.primaryCtaText)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. BUSINESS FAMILY ---
  if (componentId.startsWith("business-")) {
    if (componentId === "business-about") {
      const paragraphs = Array.isArray(props.storyParagraphs) ? props.storyParagraphs : [];
      return (
        <div style={containerStyle} className="p-8 md:p-12 border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span style={{ color: tokenStyles.colorSecondary }} className="text-xs font-bold uppercase tracking-widest">
                {String(props.eyebrow)}
              </span>
              <h2 style={headingStyle} className="text-2xl md:text-4xl font-bold">
                {String(props.title)}
              </h2>
              {paragraphs.map((p, idx) => (
                <p key={idx} style={{ color: tokenStyles.colorMutedText }} className="text-sm leading-relaxed">
                  {String(p)}
                </p>
              ))}
            </div>
            <div style={surfaceStyle} className="p-8 border space-y-4 text-center">
              <div className="text-4xl md:text-5xl font-extrabold" style={{ color: tokenStyles.colorSecondary }}>
                {String(props.highlightValue)}
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                {String(props.highlightLabel)}
              </div>
              {Boolean(props.quoteText) && (
                <p className="italic text-xs pt-4 border-t border-slate-200" style={{ color: tokenStyles.colorMutedText }}>
                  {String(props.quoteText)}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (componentId === "business-services") {
      const services = Array.isArray(props.servicesList) ? props.servicesList : [];
      return (
        <div style={containerStyle} className="p-8 md:p-12 border space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span style={{ color: tokenStyles.colorSecondary }} className="text-xs font-bold uppercase tracking-widest">
              {String(props.eyebrow || "Services")}
            </span>
            <h2 style={headingStyle} className="text-3xl font-bold">{String(props.title)}</h2>
            <p style={{ color: tokenStyles.colorMutedText }} className="text-sm">{String(props.description)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s: any, idx: number) => (
              <div key={idx} style={surfaceStyle} className="p-6 border flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {s.tag || "Core"}
                    </span>
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                  </div>
                  <h3 style={headingStyle} className="text-lg font-bold">{s.title}</h3>
                  <p style={{ color: tokenStyles.colorMutedText }} className="text-xs leading-relaxed">{s.description}</p>
                </div>
                <button style={{ color: tokenStyles.colorSecondary }} className="text-xs font-bold inline-flex items-center gap-1 hover:underline">
                  <span>{s.cta || "Learn More"}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (componentId === "business-stats") {
      const stats = Array.isArray(props.stats) ? props.stats : [];
      return (
        <div style={containerStyle} className="p-8 border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((st: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="text-3xl md:text-4xl font-extrabold" style={{ color: tokenStyles.colorSecondary }}>
                  {st.number}
                </div>
                <div className="text-xs font-medium" style={{ color: tokenStyles.colorMutedText }}>
                  {st.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default business fallback
    return (
      <div style={containerStyle} className="p-8 border space-y-4">
        <h2 style={headingStyle} className="text-2xl font-bold">{String(props.title || "Business Highlight")}</h2>
        <p style={{ color: tokenStyles.colorMutedText }} className="text-sm">Structured section adapted to domain specifications.</p>
      </div>
    );
  }

  // --- 3. CONVERSION FAMILY ---
  if (componentId.startsWith("conversion-")) {
    return (
      <div style={containerStyle} className="p-8 md:p-12 border">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 style={headingStyle} className="text-2xl md:text-3xl font-bold">{String(props.title || props.headline)}</h2>
            <p style={{ color: tokenStyles.colorMutedText }} className="text-xs md:text-sm">{String(props.subtitle || props.subheadline)}</p>
          </div>
          <div style={surfaceStyle} className="p-6 border space-y-4">
            <div className="space-y-3">
              <input type="text" placeholder="Your Full Name" className="w-full px-3 py-2 text-xs border rounded bg-white" />
              <input type="email" placeholder="Email Address" className="w-full px-3 py-2 text-xs border rounded bg-white" />
              <textarea placeholder="Specific requirements or goals..." rows={3} className="w-full px-3 py-2 text-xs border rounded bg-white" />
            </div>
            <button style={primaryBtnStyle} className="w-full py-2.5 font-bold text-xs uppercase tracking-wider">
              {String(props.submitButtonText || props.buttonText || props.actionLabel || "Submit Request")}
            </button>
            <p className="text-[10px] text-center text-slate-500">
              {String(props.privacyNotice || props.guaranteeText || "Encrypted & 100% Confidential")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- 4. SOCIAL PROOF FAMILY ---
  if (componentId.startsWith("social-proof-")) {
    const testimonials = Array.isArray(props.testimonials) ? props.testimonials : [];
    return (
      <div style={containerStyle} className="p-8 md:p-12 border space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 style={headingStyle} className="text-2xl md:text-3xl font-bold">{String(props.title)}</h2>
          {Boolean(props.subtitle) && <p style={{ color: tokenStyles.colorMutedText }} className="text-xs">{String(props.subtitle)}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t: any, idx: number) => (
            <div key={idx} style={surfaceStyle} className="p-6 border flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex text-amber-400">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs italic leading-relaxed" style={{ color: tokenStyles.colorText }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs">
                  {t.author.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: tokenStyles.colorPrimary }}>{t.author}</div>
                  <div className="text-[10px] text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- 5. MEDIA FAMILY ---
  if (componentId.startsWith("media-")) {
    if (componentId === "media-before-after-slider") {
      return (
        <div style={containerStyle} className="p-8 md:p-12 border space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 style={headingStyle} className="text-2xl md:text-3xl font-bold">{String(props.title)}</h2>
            <p style={{ color: tokenStyles.colorMutedText }} className="text-xs">{String(props.subtitle)}</p>
          </div>
          <div className="max-w-2xl mx-auto relative rounded-xl overflow-hidden border shadow-lg bg-slate-900 aspect-16/9">
            <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-xs font-bold">
              <div className="w-1/2 h-full bg-slate-800 flex items-center justify-center border-r border-indigo-400">
                <span className="bg-black/60 px-3 py-1 rounded text-white">{String(props.beforeLabel)}</span>
              </div>
              <div className="w-1/2 h-full bg-slate-900 flex items-center justify-center">
                <span className="bg-indigo-600/80 px-3 py-1 rounded text-white">{String(props.afterLabel)}</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center px-4">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-48 accent-indigo-500 cursor-pointer"
              />
              <div className="text-[10px] text-slate-400 mt-1">Interactive Before/After Split: {sliderPos}%</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle} className="p-8 border space-y-4">
        <h2 style={headingStyle} className="text-2xl font-bold">{String(props.title || "Media Showcase")}</h2>
        <div style={surfaceStyle} className="aspect-16/9 border flex items-center justify-center text-slate-400 text-sm">
          High-Definition Interactive Media Container
        </div>
      </div>
    );
  }

  // --- 6. CONTENT FAMILY ---
  if (componentId.startsWith("content-")) {
    if (componentId === "content-faq-accordion") {
      const faqs = Array.isArray(props.faqs) ? props.faqs : [];
      return (
        <div style={containerStyle} className="p-8 md:p-12 border space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 style={headingStyle} className="text-2xl md:text-3xl font-bold">{String(props.title)}</h2>
            {Boolean(props.subtitle) && <p style={{ color: tokenStyles.colorMutedText }} className="text-xs">{String(props.subtitle)}</p>}
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((f: any, idx: number) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} style={surfaceStyle} className="border overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-bold text-xs md:text-sm"
                    style={{ color: tokenStyles.colorPrimary }}
                  >
                    <span>{f.question}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs leading-relaxed border-t border-slate-200/60 pt-2" style={{ color: tokenStyles.colorMutedText }}>
                      {f.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div style={containerStyle} className="p-8 border space-y-4">
        <h2 style={headingStyle} className="text-2xl font-bold">{String(props.title || "Content Section")}</h2>
        <div style={{ ...surfaceStyle, color: tokenStyles.colorMutedText }} className="p-6 border text-xs leading-relaxed">
          Structured tabular or textual content configured for this section.
        </div>
      </div>
    );
  }

  // --- 7. ADVANCED FAMILY ---
  return (
    <div style={containerStyle} className="p-8 md:p-12 border bg-slate-950 text-white space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          Advanced Experience Component
        </span>
        <h2 className="text-2xl md:text-4xl font-extrabold text-white">{String(props.title || "Advanced Module")}</h2>
        <p className="text-slate-400 text-xs md:text-sm">{String(props.subtitle || "High-performance scroll-scrubbed or WebGL component.")}</p>
      </div>
      <div className="border border-slate-800 rounded-lg p-6 bg-slate-900/50 flex flex-col items-center justify-center space-y-3 min-h-[220px]">
        <RotateCcw className="h-8 w-8 text-indigo-400 animate-spin" />
        <span className="text-xs font-mono text-slate-300">Active Tier: {data.experienceLevel}</span>
        <span className="text-[11px] text-slate-500">Component ID: {componentId} ({variantId})</span>
      </div>
    </div>
  );
}

