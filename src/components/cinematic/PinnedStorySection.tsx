"use client";

import React, { useRef } from "react";
import { useGSAP } from "./useGSAP";
import { CinematicScrollTriggers } from "@/modules/cinematic/scroll/triggers";
import { PinnedStoryStep } from "@/modules/cinematic/types";

export interface PinnedStorySectionProps {
  steps: PinnedStoryStep[];
  className?: string;
  badge?: string;
  title?: string;
}

export function PinnedStorySection({
  steps,
  className = "",
  badge = "Cinematic Storytelling",
  title = "The Evolution Experience",
}: PinnedStorySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(containerRef, () => {
    if (!containerRef.current) return;
    const validSteps = stepsRef.current.filter(Boolean) as HTMLElement[];
    if (validSteps.length <= 1) return;

    CinematicScrollTriggers.applyPinnedStory(containerRef.current, validSteps);
  }, [steps]);

  return (
    <section
      ref={containerRef}
      className={`relative min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 py-24 overflow-hidden ${className}`}
      data-testid="pinned-story-container"
    >
      <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center z-10">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3">
          {badge}
        </span>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      </div>

      <div className="relative w-full max-w-4xl h-[450px] flex items-center justify-center">
        {steps.map((step, idx) => (
          <div
            key={step.id || idx}
            ref={(el) => {
              stepsRef.current[idx] = el;
            }}
            className="absolute inset-0 flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-2xl"
            data-testid={`story-step-${idx}`}
          >
            {step.mediaUrl && (
              <div className="w-full md:w-1/2 h-48 md:h-full rounded-xl overflow-hidden bg-slate-800">
                <img
                  src={step.mediaUrl}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={`flex flex-col justify-center ${step.mediaUrl ? "w-full md:w-1/2" : "w-full"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-xs font-bold text-white">
                  0{idx + 1}
                </span>
                {step.badge && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    {step.badge}
                  </span>
                )}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

