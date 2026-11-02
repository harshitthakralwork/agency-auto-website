import * as THREE from "three";
import { ThreeDPerformanceBudget } from "../types";

export interface ThreeDRendererOptions {
  canvas?: HTMLCanvasElement;
  alpha?: boolean;
  antialias?: boolean;
  powerPreference?: "high-performance" | "default" | "low-power";
  enableShadows?: boolean;
  maxDpr?: number;
}

export class ThreeDRenderer {
  static readonly DEFAULT_BUDGET: ThreeDPerformanceBudget = {
    maxDpr: 2.0,
    antialias: true,
    powerPreference: "high-performance",
    enableShadows: true,
    maxTextureSize: 2048,
  };

  /**
   * Creates a configured WebGLRenderer with memory and high-DPI safeguards.
   */
  static create(options: ThreeDRendererOptions = {}): THREE.WebGLRenderer {
    const canvas = options.canvas;
    const antialias = options.antialias ?? this.DEFAULT_BUDGET.antialias;
    const powerPreference = options.powerPreference ?? this.DEFAULT_BUDGET.powerPreference;
    const alpha = options.alpha ?? true;
    const maxDpr = options.maxDpr ?? this.DEFAULT_BUDGET.maxDpr;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
      alpha,
      powerPreference,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    });

    // Color management and tone mapping for photorealistic PBR
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // High-DPI clamping to protect GPU memory
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const clampedDpr = Math.min(Math.max(dpr, 1), maxDpr);
    renderer.setPixelRatio(clampedDpr);

    // Shadow maps
    if (options.enableShadows ?? this.DEFAULT_BUDGET.enableShadows) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    return renderer;
  }

  /**
   * Resizes the WebGL viewport and updates pixel ratio.
   */
  static resize(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    maxDpr: number = 2.0
  ): void {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const clampedDpr = Math.min(Math.max(dpr, 1), maxDpr);
    renderer.setPixelRatio(clampedDpr);
    renderer.setSize(width, height, false);
  }
}

