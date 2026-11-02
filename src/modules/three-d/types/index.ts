import * as THREE from "three";

export type ThreeDObjectType =
  | "none"
  | "product_model"
  | "spatial_environment"
  | "hero_floating_object"
  | "interactive_particles";

export type ThreeDScrollInteraction =
  | "none"
  | "rotate_on_scroll"
  | "camera_zoom_pan"
  | "exploded_view";

export type ThreeDLightingPreset =
  | "studio"
  | "sunset"
  | "dramatic_neon"
  | "clinical_bright"
  | "luxury_warm";

export interface ThreeDPerformanceBudget {
  maxDpr: number;
  antialias: boolean;
  powerPreference: "high-performance" | "default" | "low-power";
  enableShadows: boolean;
  maxTextureSize: number;
}

export interface ThreeDCameraConfig {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  target?: [number, number, number];
}

export interface ThreeDSceneConfig {
  backgroundColor?: string | null;
  transparent?: boolean;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
}

export interface ThreeDLightingRig {
  ambientLight: THREE.AmbientLight;
  keyLight: THREE.DirectionalLight;
  fillLight?: THREE.DirectionalLight;
  rimLight?: THREE.DirectionalLight;
  pointLight?: THREE.PointLight;
  lightsGroup: THREE.Group;
}

export interface ThreeDLoopCallback {
  (delta: number, elapsed: number): void;
}

export interface ThreeDCapabilities {
  webgl2: boolean;
  webgl1: boolean;
  supported: boolean;
  rendererVendor?: string;
  rendererModel?: string;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  isLowEndDevice: boolean;
}

export interface ThreeDDisposalStats {
  geometriesDisposed: number;
  materialsDisposed: number;
  texturesDisposed: number;
}
