"use client";

import React, { useEffect, useRef, useState } from "react";
import { ThreeDSceneConfig } from "@/modules/three-d/scene/types";
import { ThreeDAnimationConfig } from "@/modules/three-d/animation/types";
import { ThreeDSceneEngine } from "@/modules/three-d/scene/engine";
import { ThreeDAnimationEngine } from "@/modules/three-d/animation/engine";
import { ThreeDScrollTriggerBridge } from "@/modules/three-d/animation/scroll-trigger";
import { ThreeDCapabilityDetector } from "@/modules/three-d/performance/capabilities";

export interface StoryChapter {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  align?: "left" | "right" | "center";
}

export interface Scroll3DStoryCanvasProps {
  sceneConfig: ThreeDSceneConfig;
  animationConfig: ThreeDAnimationConfig;
  chapters?: StoryChapter[];
  className?: string;
}

/**
 * Production-ready Scroll-Driven 3D Story Canvas component.
 * Integrates Three.js 3D rendering with GSAP ScrollTrigger for client website experiences.
 */
export function Scroll3DStoryCanvas({
  sceneConfig,
  animationConfig,
  chapters = [],
  className = "",
}: Scroll3DStoryCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);

  const activeTimeline =
    animationConfig.timelines.find((t) => t.id === animationConfig.activeTimelineId) ||
    animationConfig.timelines[0];

  useEffect(() => {
    const isSupported = ThreeDCapabilityDetector.detect().supported;
    setWebglSupported(isSupported);
    if (!isSupported) return;

    if (!canvasHostRef.current || !containerRef.current || !activeTimeline) return;

    const sceneEngine = new ThreeDSceneEngine(sceneConfig);
    const animationEngine = new ThreeDAnimationEngine(sceneEngine);
    animationEngine.setTimeline(activeTimeline);

    const bridge = new ThreeDScrollTriggerBridge(animationEngine);

    sceneEngine.init(canvasHostRef.current, {
      interactiveControls: false, // Scroll drives camera & objects
    });

    const cleanupBridge = bridge.init({
      triggerElement: containerRef.current,
      pinElement: canvasHostRef.current,
      config: activeTimeline.scrollTrigger,
      onProgress: (p) => setScrollProgress(p),
    });

    const handleResize = () => {
      if (canvasHostRef.current) {
        sceneEngine.resize(
          canvasHostRef.current.clientWidth,
          canvasHostRef.current.clientHeight
        );
        bridge.refresh();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cleanupBridge();
      sceneEngine.dispose();
    };
  }, [sceneConfig, animationConfig, activeTimeline]);

  if (!webglSupported) {
    return (
      <div className="flex h-96 w-full items-center justify-center bg-slate-900 text-slate-300 p-6 text-center rounded-xl border border-slate-800">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">3D Experience Unavailable</h3>
          <p className="text-sm text-slate-400">
            WebGL is not supported or is disabled in your browser. Please enable hardware acceleration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-3d-scroll-canvas
      className={`relative w-full bg-slate-950 ${className}`}
    >
      {/* Pinned 3D Viewport */}
      <div
        ref={canvasHostRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* Subtle Progress Bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/50 z-20">
          <div
            className="h-full bg-indigo-500 transition-all duration-75"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Foreground Storytelling Chapters overlayed along scroll track */}
      {chapters.length > 0 && (
        <div className="relative z-10 -mt-[100vh] pointer-events-none">
          {chapters.map((chapter, index) => {
            const alignmentClass =
              chapter.align === "left"
                ? "items-start text-left pl-12"
                : chapter.align === "right"
                ? "items-end text-right pr-12"
                : "items-center text-center";

            return (
              <section
                key={chapter.id || index}
                className={`flex h-screen w-full flex-col justify-center px-6 md:px-16 ${alignmentClass}`}
              >
                <div className="max-w-md rounded-2xl bg-slate-950/70 p-6 backdrop-blur-md border border-slate-800/80 shadow-2xl pointer-events-auto">
                  {chapter.subtitle && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1 block">
                      {chapter.subtitle}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                    {chapter.title}
                  </h2>
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
