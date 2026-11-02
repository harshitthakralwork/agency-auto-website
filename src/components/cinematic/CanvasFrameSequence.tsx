"use client";

import React, { useEffect, useRef, useState } from "react";
import { CanvasFrameRenderer } from "@/modules/cinematic/canvas/renderer";
import { FrameManifest } from "@/modules/cinematic/types";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/modules/cinematic/gsap/provider";

export interface CanvasFrameSequenceProps {
  manifestUrl?: string;
  manifest?: FrameManifest;
  fitMode?: "cover" | "contain";
  posterUrl?: string;
  className?: string;
  scrollDuration?: string | number; // e.g. "150%" or 1000
  pinned?: boolean;
}

export function CanvasFrameSequence({
  manifestUrl,
  manifest: initialManifest,
  fitMode = "cover",
  posterUrl,
  className = "",
  scrollDuration = "120%",
  pinned = true,
}: CanvasFrameSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasFrameRenderer | null>(null);
  const [manifest, setManifest] = useState<FrameManifest | null>(initialManifest || null);
  const [loading, setLoading] = useState<boolean>(!initialManifest && !!manifestUrl);
  const [error, setError] = useState<string | null>(null);

  // Load manifest if URL is provided
  useEffect(() => {
    if (initialManifest) {
      setManifest(initialManifest);
      return;
    }
    if (!manifestUrl) return;

    let isMounted = true;
    setLoading(true);

    fetch(manifestUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setManifest(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load frame manifest");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [manifestUrl, initialManifest]);

  // Initialize Canvas renderer and ScrollTrigger
  useEffect(() => {
    if (!canvasRef.current || !manifest || !manifest.frames || manifest.frames.length === 0) return;

    const canvas = canvasRef.current;
    const renderer = new CanvasFrameRenderer(canvas, manifest, {
      fitMode,
      maxDpr: 2,
      cacheCapacity: 40,
    });
    rendererRef.current = renderer;

    const handleResize = () => renderer.resize();
    window.addEventListener("resize", handleResize);

    // If reduced motion is requested, just render first frame or poster and exit
    if (prefersReducedMotion()) {
      renderer.renderIndex(0);
      return () => {
        window.removeEventListener("resize", handleResize);
        renderer.destroy();
      };
    }

    let st: ScrollTrigger | null = null;

    if (containerRef.current) {
      st = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: `+=${scrollDuration}`,
        pin: pinned,
        scrub: 0.3,
        onUpdate: (self) => {
          renderer.renderProgress(self.progress);
        },
      });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (st) st.kill();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [manifest, fitMode, scrollDuration, pinned]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-slate-900 text-slate-400 p-8 rounded-xl ${className}`}>
        <p className="text-sm">Unable to render frame sequence: {error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-black ${className}`}
      data-testid="canvas-frame-sequence-container"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
        data-testid="cinematic-canvas-renderer"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/80 font-medium">Buffering frames...</span>
          </div>
        </div>
      )}

      {/* Fallback poster for no-JS or accessibility */}
      <noscript>
        {posterUrl && (
          <img
            src={posterUrl}
            alt="Cinematic sequence preview"
            className="w-full h-full object-cover"
          />
        )}
      </noscript>
    </div>
  );
}
