"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let isRegistered = false;

export function initGSAP() {
  if (typeof window === "undefined") return;
  if (!isRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    isRegistered = true;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function createGSAPContext(scopeRef: React.RefObject<HTMLElement | null>, func: (context: gsap.Context) => void) {
  if (typeof window === "undefined" || !scopeRef.current) return () => {};

  initGSAP();

  const ctx = gsap.context(func, scopeRef);
  return () => {
    ctx.revert(); // Reverts all animations and kills ScrollTriggers created in this context
  };
}

export { gsap, ScrollTrigger };

