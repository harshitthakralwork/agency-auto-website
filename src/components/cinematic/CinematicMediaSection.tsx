"use client";

import React from "react";
import { CanvasFrameSequence } from "./CanvasFrameSequence";
import { ScrollReveal } from "./ScrollReveal";
import { FrameManifest } from "@/modules/cinematic/types";

export interface CinematicMediaSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  manifestUrl?: string;
  manifest?: FrameManifest;
  posterUrl?: string;
  videoUrl?: string;
  badge?: string;
  reverse?: boolean;
  className?: string;
}

export function CinematicMediaSection({
  title,
  subtitle,
  description,
  manifestUrl,
  manifest,
  posterUrl,
  videoUrl,
  badge,
  reverse = false,
  className = "",
}: CinematicMediaSectionProps) {
  const hasCanvas = !!manifestUrl || !!manifest;

  return (
    <section
      className={`py-24 px-6 md:px-12 bg-slate-950 text-white overflow-hidden ${className}`}
      data-testid="cinematic-media-section"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Content Column */}
        <div className={`w-full md:w-1/2 ${reverse ? "md:order-2" : "md:order-1"}`}>
          <ScrollReveal direction={reverse ? "right" : "left"} distance={40}>
            {badge && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3">
                {badge}
              </span>
            )}
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{title}</h2>
            {subtitle && (
              <p className="text-lg md:text-xl text-indigo-300 font-medium mb-4">{subtitle}</p>
            )}
            {description && (
              <p className="text-slate-400 text-base leading-relaxed mb-6">{description}</p>
            )}
          </ScrollReveal>
        </div>

        {/* Media Column */}
        <div className={`w-full md:w-1/2 ${reverse ? "md:order-1" : "md:order-2"}`}>
          <div className="relative w-full h-80 md:h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900">
            {hasCanvas ? (
              <CanvasFrameSequence
                manifestUrl={manifestUrl}
                manifest={manifest}
                posterUrl={posterUrl}
                fitMode="cover"
                pinned={false}
                className="w-full h-full"
              />
            ) : videoUrl ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                poster={posterUrl}
                className="w-full h-full object-cover"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            ) : posterUrl ? (
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-sm">
                Cinematic Media Preview
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

