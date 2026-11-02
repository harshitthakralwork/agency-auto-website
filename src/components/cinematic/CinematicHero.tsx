"use client";

import React from "react";
import { CanvasFrameSequence } from "./CanvasFrameSequence";
import { ScrollReveal } from "./ScrollReveal";
import { FrameManifest } from "@/modules/cinematic/types";

export interface CinematicHeroProps {
  title: string;
  tagline?: string;
  categoryBadge?: string;
  primaryCtaText?: string;
  primaryCtaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;

  // Background media options
  canvasEnabled?: boolean;
  frameManifestUrl?: string;
  frameManifest?: FrameManifest;
  videoUrl?: string;
  posterUrl?: string;

  className?: string;
}

export function CinematicHero({
  title,
  tagline,
  categoryBadge,
  primaryCtaText = "Discover Experience",
  primaryCtaHref = "#explore",
  secondaryCtaText = "Learn More",
  secondaryCtaHref = "#services",
  canvasEnabled = false,
  frameManifestUrl,
  frameManifest,
  videoUrl,
  posterUrl,
  className = "",
}: CinematicHeroProps) {
  const hasCanvas = canvasEnabled && (frameManifestUrl || frameManifest);

  return (
    <div
      className={`relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 text-white ${className}`}
      data-testid="cinematic-hero-section"
    >
      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0">
        {hasCanvas ? (
          <CanvasFrameSequence
            manifestUrl={frameManifestUrl}
            manifest={frameManifest}
            posterUrl={posterUrl}
            fitMode="cover"
            pinned={false}
            className="h-full w-full opacity-60"
          />
        ) : videoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterUrl}
            className="w-full h-full object-cover opacity-50"
            data-testid="hero-background-video"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover opacity-45 scale-105"
            data-testid="hero-background-poster"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950" />
        )}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-[circle_at_center,transparent_0%,rgba(2,6,23,0.85)_100%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
      </div>

      {/* 2. Foreground Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
        <ScrollReveal direction="up" distance={30} duration={0.9} stagger={0.15}>
          {categoryBadge && (
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                {categoryBadge}
              </span>
            </div>
          )}

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            {title}
          </h1>

          {tagline && (
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed mb-10">
              {tagline}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={primaryCtaHref}
              className="px-8 py-4 rounded-xl font-semibold bg-white text-slate-950 hover:bg-slate-100 shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
              data-testid="hero-primary-cta"
            >
              {primaryCtaText}
            </a>
            {secondaryCtaText && (
              <a
                href={secondaryCtaHref}
                className="px-8 py-4 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20 backdrop-blur-md hover:scale-105 active:scale-95 transition-all duration-200"
                data-testid="hero-secondary-cta"
              >
                {secondaryCtaText}
              </a>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* 3. Bottom Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-mono tracking-widest uppercase">Scroll Down</span>
        <div className="w-5 h-8 border-2 border-white/40 rounded-full flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-white rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

