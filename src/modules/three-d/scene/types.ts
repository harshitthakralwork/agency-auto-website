import { ThreeDLightingPreset } from "../types";

export type CameraPreset =
  | "front"
  | "hero_angle"
  | "top_down"
  | "isometric"
  | "cinematic_low"
  | "custom";

export interface CameraConfig {
  fov: number; // 15 to 120
  position: [number, number, number];
  target: [number, number, number];
  near: number;
  far: number;
  orbitLimits: {
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
  };
  preset: CameraPreset;
}

export interface FogConfig {
  enabled: boolean;
  color: string;
  near: number;
  far: number;
}

export interface GroundPlaneConfig {
  enabled: boolean;
  color: string;
  roughness: number;
  metalness: number;
  receiveShadow: boolean;
  size: number;
}

export interface GridHelperConfig {
  enabled: boolean;
  size: number;
  divisions: number;
  colorCenter: string;
  colorGrid: string;
}

export interface EnvironmentConfig {
  backgroundMode: "color" | "transparent" | "environment";
  backgroundColor: string;
  preset: ThreeDLightingPreset | "none";
  intensity: number;
  fog: FogConfig;
  groundPlane: GroundPlaneConfig;
  gridHelper: GridHelperConfig;
}

export interface LightItemConfig {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow?: boolean;
}

export interface DirectionalLightConfig extends LightItemConfig {
  shadowMapSize?: number;
  shadowBias?: number;
}

export interface PointLightConfig extends LightItemConfig {
  distance?: number;
  decay?: number;
}

export interface SpotLightConfig extends LightItemConfig {
  target?: [number, number, number];
  angle?: number;
  penumbra?: number;
}

export interface LightingConfig {
  preset: ThreeDLightingPreset | "custom";
  ambient: {
    color: string;
    intensity: number;
  };
  hemisphere: {
    enabled: boolean;
    skyColor: string;
    groundColor: string;
    intensity: number;
  };
  mainDirectional: DirectionalLightConfig;
  fillLight: LightItemConfig;
  rimLight: LightItemConfig;
  pointLights: PointLightConfig[];
  spotLights: SpotLightConfig[];
}

export interface MaterialOverrideConfig {
  enabled: boolean;
  targetMeshName?: string; // empty or "all" applies to all meshes
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  wireframe?: boolean;
  doubleSided?: boolean;
}

export interface SceneObjectConfig {
  id: string;
  name: string;
  sourceType: "asset" | "procedural";
  assetId?: string;
  assetUrl?: string;
  proceduralType?:
    | "product_model"
    | "spatial_environment"
    | "hero_floating_object"
    | "interactive_particles";
  position: [number, number, number];
  rotation: [number, number, number]; // in degrees [x, y, z]
  scale: [number, number, number];
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
  materialOverride?: MaterialOverrideConfig;
}

export interface RenderQualityConfig {
  antialias: boolean;
  dprLimit: number;
  shadowQuality: "off" | "low" | "medium" | "high";
  toneMapping: "aces_filmic" | "cineon" | "reinhard" | "linear";
  toneMappingExposure: number;
}

export interface ThreeDSceneConfig {
  version: "1.0";
  environment: EnvironmentConfig;
  camera: CameraConfig;
  lighting: LightingConfig;
  objects: SceneObjectConfig[];
  renderQuality: RenderQualityConfig;
}
