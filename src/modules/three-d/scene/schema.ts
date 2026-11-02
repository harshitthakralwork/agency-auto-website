import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const cameraConfigSchema = z.object({
  fov: z.number().min(15).max(120).default(45),
  position: vec3Schema.default([0, 2.5, 6]),
  target: vec3Schema.default([0, 0, 0]),
  near: z.number().min(0.01).max(10).default(0.1),
  far: z.number().min(50).max(10000).default(1000),
  orbitLimits: z
    .object({
      minDistance: z.number().min(0.1).default(1.2),
      maxDistance: z.number().max(500).default(25),
      minPolarAngle: z.number().min(0).max(Math.PI).default(0.05),
      maxPolarAngle: z.number().min(0).max(Math.PI).default(Math.PI / 2 + 0.05),
      enableDamping: z.boolean().default(true),
      dampingFactor: z.number().min(0.01).max(0.5).default(0.05),
    })
    .default({
      minDistance: 1.2,
      maxDistance: 25,
      minPolarAngle: 0.05,
      maxPolarAngle: Math.PI / 2 + 0.05,
      enableDamping: true,
      dampingFactor: 0.05,
    }),
  preset: z
    .enum(["front", "hero_angle", "top_down", "isometric", "cinematic_low", "custom"])
    .default("hero_angle"),
});

export const fogConfigSchema = z.object({
  enabled: z.boolean().default(false),
  color: z.string().regex(hexColorRegex).default("#070b14"),
  near: z.number().min(0).default(10),
  far: z.number().min(1).default(40),
});

export const groundPlaneConfigSchema = z.object({
  enabled: z.boolean().default(true),
  color: z.string().regex(hexColorRegex).default("#0c1322"),
  roughness: z.number().min(0).max(1).default(0.85),
  metalness: z.number().min(0).max(1).default(0.15),
  receiveShadow: z.boolean().default(true),
  size: z.number().min(1).max(500).default(40),
});

export const gridHelperConfigSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.number().min(1).max(200).default(20),
  divisions: z.number().min(2).max(100).default(20),
  colorCenter: z.string().regex(hexColorRegex).default("#06b6d4"),
  colorGrid: z.string().regex(hexColorRegex).default("#1e293b"),
});

export const environmentConfigSchema = z.object({
  backgroundMode: z.enum(["color", "transparent", "environment"]).default("color"),
  backgroundColor: z.string().regex(hexColorRegex).default("#070b14"),
  preset: z
    .enum(["studio", "sunset", "dramatic_neon", "clinical_bright", "luxury_warm", "none"])
    .default("studio"),
  intensity: z.number().min(0).max(10).default(1.0),
  fog: fogConfigSchema.default({
    enabled: false,
    color: "#070b14",
    near: 10,
    far: 40,
  }),
  groundPlane: groundPlaneConfigSchema.default({
    enabled: true,
    color: "#0c1322",
    roughness: 0.85,
    metalness: 0.15,
    receiveShadow: true,
    size: 40,
  }),
  gridHelper: gridHelperConfigSchema.default({
    enabled: true,
    size: 20,
    divisions: 20,
    colorCenter: "#06b6d4",
    colorGrid: "#1e293b",
  }),
});

export const lightItemConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean().default(true),
  color: z.string().regex(hexColorRegex),
  intensity: z.number().min(0).max(50),
  position: vec3Schema,
  castShadow: z.boolean().optional(),
});

export const directionalLightConfigSchema = lightItemConfigSchema.extend({
  shadowMapSize: z.number().min(256).max(4096).optional(),
  shadowBias: z.number().optional(),
});

export const pointLightConfigSchema = lightItemConfigSchema.extend({
  distance: z.number().min(0).optional(),
  decay: z.number().min(0).max(5).optional(),
});

export const spotLightConfigSchema = lightItemConfigSchema.extend({
  target: vec3Schema.optional(),
  angle: z.number().min(0).max(Math.PI / 2).optional(),
  penumbra: z.number().min(0).max(1).optional(),
});

export const lightingConfigSchema = z.object({
  preset: z
    .enum(["studio", "sunset", "dramatic_neon", "clinical_bright", "luxury_warm", "custom"])
    .default("studio"),
  ambient: z.object({
    color: z.string().regex(hexColorRegex).default("#ffffff"),
    intensity: z.number().min(0).max(10).default(0.4),
  }),
  hemisphere: z.object({
    enabled: z.boolean().default(false),
    skyColor: z.string().regex(hexColorRegex).default("#ffffff"),
    groundColor: z.string().regex(hexColorRegex).default("#1e293b"),
    intensity: z.number().min(0).max(10).default(0.5),
  }),
  mainDirectional: directionalLightConfigSchema,
  fillLight: lightItemConfigSchema,
  rimLight: lightItemConfigSchema,
  pointLights: z.array(pointLightConfigSchema).default([]),
  spotLights: z.array(spotLightConfigSchema).default([]),
});

export const materialOverrideConfigSchema = z.object({
  enabled: z.boolean().default(false),
  targetMeshName: z.string().optional(),
  color: z.string().regex(hexColorRegex).optional(),
  roughness: z.number().min(0).max(1).optional(),
  metalness: z.number().min(0).max(1).optional(),
  opacity: z.number().min(0).max(1).optional(),
  transparent: z.boolean().optional(),
  emissive: z.string().regex(hexColorRegex).optional(),
  emissiveIntensity: z.number().min(0).max(10).optional(),
  wireframe: z.boolean().optional(),
  doubleSided: z.boolean().optional(),
});

export const sceneObjectConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceType: z.enum(["asset", "procedural"]).default("procedural"),
  assetId: z.string().optional(),
  assetUrl: z.string().optional(),
  proceduralType: z
    .enum([
      "product_model",
      "spatial_environment",
      "hero_floating_object",
      "interactive_particles",
    ])
    .optional(),
  position: vec3Schema.default([0, 0, 0]),
  rotation: vec3Schema.default([0, 0, 0]),
  scale: vec3Schema.default([1, 1, 1]),
  visible: z.boolean().default(true),
  castShadow: z.boolean().default(true),
  receiveShadow: z.boolean().default(true),
  materialOverride: materialOverrideConfigSchema.optional(),
});

export const renderQualityConfigSchema = z.object({
  antialias: z.boolean().default(true),
  dprLimit: z.number().min(1).max(3).default(2.0),
  shadowQuality: z.enum(["off", "low", "medium", "high"]).default("medium"),
  toneMapping: z.enum(["aces_filmic", "cineon", "reinhard", "linear"]).default("aces_filmic"),
  toneMappingExposure: z.number().min(0.1).max(5.0).default(1.0),
});

export const threeDSceneConfigSchema = z.object({
  version: z.literal("1.0").default("1.0"),
  environment: environmentConfigSchema,
  camera: cameraConfigSchema,
  lighting: lightingConfigSchema,
  objects: z.array(sceneObjectConfigSchema).default([]),
  renderQuality: renderQualityConfigSchema.default({
    antialias: true,
    dprLimit: 2.0,
    shadowQuality: "medium",
    toneMapping: "aces_filmic",
    toneMappingExposure: 1.0,
  }),
});

export type ThreeDSceneConfigInput = z.infer<typeof threeDSceneConfigSchema>;
