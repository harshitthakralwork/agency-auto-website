"use client";

import { useEffect, RefObject } from "react";
import { initGSAP, gsap } from "@/modules/cinematic/gsap/provider";

export function useGSAP(
  scopeRef: RefObject<HTMLElement | null>,
  callback: (ctx: gsap.Context) => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (typeof window === "undefined" || !scopeRef.current) return;

    initGSAP();

    const ctx = gsap.context(callback, scopeRef);

    return () => {
      ctx.revert();
    };
  }, dependencies);
}

