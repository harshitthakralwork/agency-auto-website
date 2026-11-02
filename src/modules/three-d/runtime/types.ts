import { ThreeDSceneConfig } from "../scene/types";
import { ThreeDAnimationConfig } from "../animation/types";

export interface Production3DManifest {
  version: "1.0";
  projectId: string;
  projectName: string;
  sceneConfig: ThreeDSceneConfig;
  animationConfig: ThreeDAnimationConfig;
  assetMap: Record<string, string>; // Maps slot or ID to URL / relative path
  fallbackMode: "poster" | "procedural" | "none";
  posterUrl?: string;
  metadata?: {
    exportedAt?: string;
    engineVersion?: string;
  };
}

export interface ProductionRuntimeOptions {
  container: HTMLElement;
  manifest: Production3DManifest;
  interactiveControls?: boolean;
  onProgress?: (progress: number) => void;
  onLoaded?: () => void;
  onError?: (error: Error) => void;
}

export interface RuntimeMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryGeometries: number;
  memoryTextures: number;
}
