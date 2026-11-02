"use client";

import React, { useRef } from "react";
import { useGSAP } from "./useGSAP";
import { CinematicScrollTriggers } from "@/modules/cinematic/scroll/triggers";

export interface ScrollTextSequenceProps {
  heading: string;
  subtext?: string;
  className?: string;
}

export function ScrollTextSequence({
  heading,
  subtext,
  className = "",
}: ScrollTextSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const words = heading.split(" ");

  useGSAP(containerRef, () => {
    if (!containerRef.current) return;
    const validWords = wordsRef.current.filter(Boolean) as HTMLElement[];
    if (validWords.length === 0) return;

    CinematicScrollTriggers.applyTextStorytelling(validWords, containerRef.current);
  }, [heading]);

  return (
    <div
      ref={containerRef}
      className={`py-16 text-center max-w-4xl mx-auto px-6 ${className}`}
      data-testid="scroll-text-sequence"
    >
      <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight leading-tight flex flex-wrap justify-center gap-x-3 gap-y-1 mb-6">
        {words.map((word, idx) => (
          <span
            key={idx}
            ref={(el) => {
              wordsRef.current[idx] = el;
            }}
            className="inline-block will-change-transform"
            data-testid={`text-word-${idx}`}
          >
            {word}
          </span>
        ))}
      </h2>
      {subtext && (
        <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}

