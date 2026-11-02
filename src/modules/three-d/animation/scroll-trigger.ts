"use client";

import { gsap, ScrollTrigger, initGSAP, prefersReducedMotion } from "@/modules/cinematic/gsap/provider";
import { ThreeDAnimationEngine } from "./engine";
import { ScrollTriggerConfig } from "./types";

export interface ScrollTriggerBridgeOptions {
  triggerElement: HTMLElement;
  pinElement?: HTMLElement;
  config: ScrollTriggerConfig;
  onProgress?: (progress: number) => void;
}

/**
 * Bridges the Three.js 3D Animation Engine to GSAP ScrollTrigger.
 * Enables production-ready scroll-driven 3D interactive storytelling.
 */
export class ThreeDScrollTriggerBridge {
  private animationEngine: ThreeDAnimationEngine;
  private scrollTriggerInstance: ScrollTrigger | null = null;
  private ctx: gsap.Context | null = null;
  private isDisposed = false;

  constructor(animationEngine: ThreeDAnimationEngine) {
    this.animationEngine = animationEngine;
  }

  /**
   * Initializes GSAP ScrollTrigger binding to the DOM element and active timeline.
   */
  init(options: ScrollTriggerBridgeOptions): () => void {
    if (typeof window === "undefined") return () => {};
    initGSAP();

    this.dispose();
    this.isDisposed = false;

    const { triggerElement, pinElement, config, onProgress } = options;
    if (!triggerElement) return () => {};

    const reducedMotion = prefersReducedMotion();

    // GSAP Context ensures scoped garbage-collection and clean unmounting
    this.ctx = gsap.context(() => {
      const virtualTween = { progress: 0 };

      // Base scrub parameter
      const scrubParam = reducedMotion
        ? false
        : typeof config.scrub === "number" || typeof config.scrub === "boolean"
        ? config.scrub
        : 1;

      const triggerOptions: ScrollTrigger.Vars = {
        trigger: triggerElement,
        start: config.start || "top top",
        end: config.end || "+=2000",
        scrub: scrubParam,
        pin: config.pin ? (pinElement || triggerElement) : false,
        anticipatePin: config.anticipatePin ?? 1,
        markers: Boolean(config.markers),
        onUpdate: (self) => {
          if (this.isDisposed) return;
          const currentProgress = self.progress;
          this.animationEngine.evaluate(currentProgress);
          if (onProgress) {
            onProgress(currentProgress);
          }
        },
      };

      const tween = gsap.to(virtualTween, {
        progress: 1,
        ease: "none",
        scrollTrigger: triggerOptions,
      });

      this.scrollTriggerInstance = tween.scrollTrigger ?? null;
    }, triggerElement);

    // Initial evaluation at progress 0
    this.animationEngine.evaluate(0);

    return () => this.dispose();
  }

  /**
   * Recalculates scroll positions and pin offsets on container or window resize.
   */
  refresh(): void {
    if (typeof window !== "undefined" && !this.isDisposed) {
      ScrollTrigger.refresh();
    }
  }

  /**
   * Complete cleanup: kills ScrollTrigger, reverts GSAP context, and removes listeners.
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
      this.scrollTriggerInstance = null;
    }

    if (this.ctx) {
      this.ctx.revert();
      this.ctx = null;
    }
  }
}
