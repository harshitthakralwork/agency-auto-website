"use client";

import React, { useRef } from "react";
import { useGSAP } from "./useGSAP";
import { CinematicScrollTriggers } from "@/modules/cinematic/scroll/triggers";

export interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number; // e.g. 0.2, 0.4
  className?: string;
}

export function ParallaxSection({
  children,
  speed = 0.25,
  className = "",
}: ParallaxSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useGSAP(containerRef, () => {
    if (!targetRef.current || !containerRef.current) return;
    CinematicScrollTriggers.applyParallax(targetRef.current, containerRef.current, speed);
  }, [speed]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      data-testid="parallax-section-container"
    >
      <div ref={targetRef} className="w-full h-full will-change-transform">
        {children}
      </div>
    </div>
  );
}

