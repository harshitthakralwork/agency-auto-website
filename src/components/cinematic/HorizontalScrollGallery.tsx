"use client";

import React, { useRef } from "react";
import { useGSAP } from "./useGSAP";
import { CinematicScrollTriggers } from "@/modules/cinematic/scroll/triggers";

export interface GalleryItem {
  id: string;
  title: string;
  category?: string;
  imageUrl?: string;
  description?: string;
}

export interface HorizontalScrollGalleryProps {
  items: GalleryItem[];
  title?: string;
  badge?: string;
  className?: string;
}

export function HorizontalScrollGallery({
  items,
  title = "Signature Showcase",
  badge = "Cinematic Flow",
  className = "",
}: HorizontalScrollGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(containerRef, () => {
    if (!containerRef.current || !trackRef.current) return;
    if (window.innerWidth < 768) return; // Keep native touch-swipe on small mobile screens

    CinematicScrollTriggers.applyHorizontalScroll(containerRef.current, trackRef.current);
  }, [items]);

  return (
    <section
      ref={containerRef}
      className={`relative min-h-screen flex flex-col justify-center bg-slate-950 text-white overflow-hidden py-16 ${className}`}
      data-testid="horizontal-gallery-container"
    >
      <div className="px-8 md:px-16 mb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
          {badge}
        </span>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      </div>

      <div
        ref={trackRef}
        className="flex gap-6 px-8 md:px-16 will-change-transform overflow-x-auto md:overflow-x-visible no-scrollbar"
        data-testid="horizontal-gallery-track"
      >
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex-shrink-0 w-[300px] md:w-[420px] rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-xl group hover:border-indigo-500/50 transition-all duration-300"
            data-testid={`gallery-item-${idx}`}
          >
            <div className="h-56 md:h-64 bg-slate-800 overflow-hidden relative">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-sm">
                  Asset Slot {idx + 1}
                </div>
              )}
              {item.category && (
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                  {item.category}
                </span>
              )}
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
