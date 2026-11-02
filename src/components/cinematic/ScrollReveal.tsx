"use client";

import React, { useRef } from "react";
import { useGSAP } from "./useGSAP";
import { CinematicScrollTriggers } from "@/modules/cinematic/scroll/triggers";
import { ScrollRevealDirection } from "@/modules/cinematic/types";

export interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: ScrollRevealDirection;
  distance?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  className?: string;
}

export function ScrollReveal({
  children,
  direction = "up",
  distance = 35,
  duration = 0.8,
  stagger = 0.1,
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(containerRef, () => {
    if (!containerRef.current) return;
    const elements = containerRef.current.children;
    if (!elements || elements.length === 0) return;

    CinematicScrollTriggers.applyScrollReveal(Array.from(elements), containerRef.current, {
      direction,
      distance,
      duration,
      stagger,
      delay,
    });
  });

  return (
    <div ref={containerRef} className={className} data-testid="scroll-reveal-container">
      {children}
    </div>
  );
}

