import { ProjectDesignState } from "../design/types";

export class CinematicIntegration {
  /**
   * Generates standalone cinematic.js runtime script using local GSAP & ScrollTrigger.
   */
  public static generateCinematicScript(design: ProjectDesignState): string {
    const intensity = design.animation.animationIntensity || "cinematic";

    return `/**
 * Agency Website Engine - Production Cinematic Runtime
 * Powered by local GSAP & ScrollTrigger (Zero CDN Dependencies)
 */
(function () {
  "use strict";

  // Check user preference for reduced motion
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    console.log("[Cinematic] Reduced motion preferred; cinematic scroll effects disabled.");
    return;
  }

  // Ensure GSAP is present
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
    console.warn("[Cinematic] GSAP or ScrollTrigger not loaded.");
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  function initScrollReveals() {
    // 1. Reveal cards and features with subtle stagger
    const cards = document.querySelectorAll(".card, .review-card, .pricing-card");
    if (cards.length > 0) {
      ScrollTrigger.batch(cards, {
        onEnter: function (batch) {
          gsap.fromTo(
            batch,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.1,
              ease: "power2.out",
              overwrite: "auto",
            }
          );
        },
        once: true,
      });
    }

    // 2. Section Headings Reveal
    const headers = document.querySelectorAll(".section-header");
    headers.forEach(function (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 85%",
            once: true,
          },
        }
      );
    });

    // 3. Stats Counter Animation
    const statValues = document.querySelectorAll(".stat-value");
    statValues.forEach(function (stat) {
      ScrollTrigger.create({
        trigger: stat,
        start: "top 90%",
        once: true,
        onEnter: function () {
          gsap.fromTo(
            stat,
            { scale: 0.85, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)" }
          );
        },
      });
    });

    // 4. Header Dynamic Glass Effect on Scroll
    const header = document.querySelector("[data-site-header]");
    if (header) {
      ScrollTrigger.create({
        start: "top -50",
        onUpdate: function (self) {
          if (self.progress > 0) {
            header.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)";
          } else {
            header.style.boxShadow = "none";
          }
        },
      });
    }

    // 5. Canvas Frame Sequence Scrubber (if present)
    const frameCanvases = document.querySelectorAll("[data-frame-sequence]");
    frameCanvases.forEach(function (canvasEl) {
      const container = canvasEl.closest(".canvas-interactive-container") || canvasEl.parentElement;
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      const totalFrames = parseInt(canvasEl.getAttribute("data-total-frames"), 10) || 60;
      const currentFrame = { index: 0 };

      // Bind ScrollTrigger to scrub frames
      ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "+=1200",
        pin: true,
        scrub: 0.5,
        onUpdate: function (self) {
          const frameIndex = Math.min(totalFrames - 1, Math.floor(self.progress * totalFrames));
          currentFrame.index = frameIndex;
          
          // Draw frame or gradient indicator
          ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
          const pct = frameIndex / totalFrames;
          const gradient = ctx.createLinearGradient(0, 0, canvasEl.width, canvasEl.height);
          gradient.addColorStop(0, "rgba(2, 132, 199, " + (0.3 + pct * 0.7) + ")");
          gradient.addColorStop(1, "rgba(56, 189, 248, " + (0.2 + (1 - pct) * 0.6) + ")");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
        },
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollReveals);
  } else {
    initScrollReveals();
  }
})();
`;
  }
}
