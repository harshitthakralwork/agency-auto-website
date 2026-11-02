import {
  CameraConfig,
  CameraPreset,
  EnvironmentConfig,
  LightingConfig,
  RenderQualityConfig,
  ThreeDSceneConfig,
} from "./types";
import { ThreeDLightingPreset } from "../types";

export interface LightingPresetDefinition {
  ambient: { color: string; intensity: number };
  key: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number; position: [number, number, number] };
  rim: { color: string; intensity: number; position: [number, number, number] };
}

export const LIGHTING_PRESETS_DATA: Record<ThreeDLightingPreset, LightingPresetDefinition> = {
  studio: {
    ambient: { color: "#ffffff", intensity: 0.7 },
    key: { color: "#ffffff", intensity: 1.8, position: [3, 4, 3] },
    fill: { color: "#94a3b8", intensity: 0.9, position: [-3, 2, 2] },
    rim: { color: "#e2e8f0", intensity: 0.8, position: [0, 3, -3] },
  },
  sunset: {
    ambient: { color: "#312e81", intensity: 0.4 },
    key: { color: "#f59e0b", intensity: 2.2, position: [4, 2, 3] },
    fill: { color: "#818cf8", intensity: 0.8, position: [-4, 1, -2] },
    rim: { color: "#fde047", intensity: 1.4, position: [0, 5, -4] },
  },
  dramatic_neon: {
    ambient: { color: "#030712", intensity: 0.2 },
    key: { color: "#06b6d4", intensity: 2.5, position: [3, 2, 2] },
    fill: { color: "#ec4899", intensity: 2.0, position: [-3, -1, 1] },
    rim: { color: "#a855f7", intensity: 1.8, position: [0, 4, -3] },
  },
  clinical_bright: {
    ambient: { color: "#ffffff", intensity: 1.2 },
    key: { color: "#f8fafc", intensity: 1.8, position: [2, 5, 3] },
    fill: { color: "#e2e8f0", intensity: 1.2, position: [-3, 3, 2] },
    rim: { color: "#cbd5e1", intensity: 0.6, position: [0, 2, -4] },
  },
  luxury_warm: {
    ambient: { color: "#1c1917", intensity: 0.4 },
    key: { color: "#d97706", intensity: 2.0, position: [3, 4, 2] },
    fill: { color: "#fef3c7", intensity: 0.7, position: [-3, 2, 2] },
    rim: { color: "#fbbf24", intensity: 1.6, position: [0, 3, -3] },
  },
};

export const CAMERA_PRESETS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number]; fov: number }
> = {
  hero_angle: {
    position: [0, 2.5, 6],
    target: [0, 0, 0],
    fov: 45,
  },
  front: {
    position: [0, 1.2, 5.5],
    target: [0, 0.8, 0],
    fov: 40,
  },
  top_down: {
    position: [0, 8, 2],
    target: [0, 0, 0],
    fov: 45,
  },
  isometric: {
    position: [5, 5, 5],
    target: [0, 0, 0],
    fov: 38,
  },
  cinematic_low: {
    position: [0, 0.4, 4.5],
    target: [0, 1.2, 0],
    fov: 50,
  },
  custom: {
    position: [0, 2.5, 6],
    target: [0, 0, 0],
    fov: 45,
  },
};

export function createDefaultCameraConfig(preset: CameraPreset = "hero_angle"): CameraConfig {
  const p = CAMERA_PRESETS[preset] || CAMERA_PRESETS.hero_angle;
  return {
    fov: p.fov,
    position: [...p.position],
    target: [...p.target],
    near: 0.1,
    far: 1000,
    orbitLimits: {
      minDistance: 1.2,
      maxDistance: 25.0,
      minPolarAngle: 0.05,
      maxPolarAngle: Math.PI / 2 + 0.05,
      enableDamping: true,
      dampingFactor: 0.05,
    },
    preset,
  };
}

export function createDefaultEnvironmentConfig(): EnvironmentConfig {
  return {
    backgroundMode: "color",
    backgroundColor: "#070b14",
    preset: "studio",
    intensity: 1.0,
    fog: {
      enabled: false,
      color: "#070b14",
      near: 10,
      far: 40,
    },
    groundPlane: {
      enabled: true,
      color: "#0c1322",
      roughness: 0.85,
      metalness: 0.15,
      receiveShadow: true,
      size: 40,
    },
    gridHelper: {
      enabled: true,
      size: 20,
      divisions: 20,
      colorCenter: "#06b6d4",
      colorGrid: "#1e293b",
    },
  };
}

export function createLightingConfigFromPreset(
  presetKey: ThreeDLightingPreset = "studio"
): LightingConfig {
  const base = LIGHTING_PRESETS_DATA[presetKey] || LIGHTING_PRESETS_DATA.studio;

  return {
    preset: presetKey,
    ambient: {
      color: base.ambient.color,
      intensity: base.ambient.intensity,
    },
    hemisphere: {
      enabled: false,
      skyColor: "#ffffff",
      groundColor: "#1e293b",
      intensity: 0.5,
    },
    mainDirectional: {
      id: "main-key-light",
      name: "Main Key Light",
      enabled: true,
      color: base.key.color,
      intensity: base.key.intensity,
      position: [...base.key.position],
      castShadow: true,
      shadowMapSize: 1024,
      shadowBias: -0.0001,
    },
    fillLight: {
      id: "fill-light",
      name: "Fill Light",
      enabled: true,
      color: base.fill.color,
      intensity: base.fill.intensity,
      position: [...base.fill.position],
      castShadow: false,
    },
    rimLight: {
      id: "rim-light",
      name: "Rim / Back Light",
      enabled: true,
      color: base.rim.color,
      intensity: base.rim.intensity,
      position: [...base.rim.position],
      castShadow: false,
    },
    pointLights: [],
    spotLights: [],
  };
}

export function createDefaultRenderQualityConfig(): RenderQualityConfig {
  return {
    antialias: true,
    dprLimit: 2.0,
    shadowQuality: "medium",
    toneMapping: "aces_filmic",
    toneMappingExposure: 1.0,
  };
}

export function createDefaultThreeDSceneConfig(): ThreeDSceneConfig {
  return {
    version: "1.0",
    environment: createDefaultEnvironmentConfig(),
    camera: createDefaultCameraConfig("hero_angle"),
    lighting: createLightingConfigFromPreset("studio"),
    objects: [
      {
        id: "default-hero-obj",
        name: "Primary Showcase Archetype",
        sourceType: "procedural",
        proceduralType: "product_model",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        castShadow: true,
        receiveShadow: true,
      },
    ],
    renderQuality: createDefaultRenderQualityConfig(),
  };
}
