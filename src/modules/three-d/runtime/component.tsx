"use client";

import React, { useEffect, useRef, useState } from "react";
import { Production3DManifest } from "./types";
import { Production3DRuntime } from "./runtime";

export interface ProductionStoryChapter {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  align?: "left" | "right" | "center";
}

export interface Production3DCanvasProps {
  manifest: Production3DManifest;
  chapters?: ProductionStoryChapter[];
  className?: string;
  interactiveControls?: boolean;
}

/**
 * Reusable Production 3D Canvas Component for independently deployed client websites.
 */
export function Production3DCanvas({
  manifest,
  chapters = [],
  className = "",
  interactiveControls = false,
}: Production3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Production3DRuntime | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const manifestStr = JSON.stringify(manifest);

  useEffect(() => {
    if (!containerRef.current) return;
    let isCancelled = false;

    const parsedManifest = JSON.parse(manifestStr);
    const runtime = new Production3DRuntime({
      container: containerRef.current,
      manifest: parsedManifest,
      interactiveControls,
      onProgress: (p) => {
        if (!isCancelled) setScrollProgress(p);
      },
      onLoaded: () => {
        if (!isCancelled) setIsLoaded(true);
      },
      onError: (err) => console.warn("[Production3DCanvas] Runtime initialization warning:", err),
    });

    runtimeRef.current = runtime;
    runtime.init().then(() => {
      if (isCancelled) {
        runtime.dispose();
      }
    });

    return () => {
      isCancelled = true;
      runtime.dispose();
      runtimeRef.current = null;
    };
  }, [manifestStr, interactiveControls]);

  return (
    <div className={`relative w-full bg-slate-950 ${className}`} data-3d-production-root>
      {/* Pinned 3D Viewport */}
      <div
        ref={containerRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ minHeight: "500px" }}
      >
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/40 z-20 pointer-events-none">
          <div
            className="h-full bg-indigo-500 transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Foreground Storytelling Chapters */}
      {chapters.length > 0 && (
        <div className="relative z-10 -mt-[100vh] pointer-events-none">
          {chapters.map((chapter, index) => {
            const alignmentClass =
              chapter.align === "left"
                ? "items-start text-left pl-8 md:pl-16"
                : chapter.align === "right"
                ? "items-end text-right pr-8 md:pr-16"
                : "items-center text-center";

            return (
              <section
                key={chapter.id || index}
                className={`flex h-screen w-full flex-col justify-center px-6 ${alignmentClass}`}
              >
                <div className="max-w-md rounded-2xl bg-slate-950/75 p-6 backdrop-blur-md border border-slate-800/80 shadow-2xl pointer-events-auto">
                  {chapter.subtitle && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 block font-mono">
                      {chapter.subtitle}
                    </span>
                  )}
                  <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                    {chapter.title}
                  </h3>
                  {chapter.description && (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
