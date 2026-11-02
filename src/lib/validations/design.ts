import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const designUpdateSchema = z.object({
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional().default("CINEMATIC"),
  preset: z.string().min(1),
  primaryColor: z.string().regex(hexColorRegex, "Must be a valid hex color code (e.g. #3b82f6)"),
  secondaryColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  accentColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  backgroundColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  surfaceColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  textColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  mutedTextColor: z.string().regex(hexColorRegex, "Must be a valid hex color code"),
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
  baseFontSize: z.string().default("16px"),
  layoutStyle: z.enum(["modern-contained", "full-width", "asymmetric"]).default("modern-contained"),
  borderRadius: z.string().default("0.5rem"),
  containerWidth: z.string().default("1280px"),
  animationIntensity: z.enum(["none", "subtle", "cinematic", "energetic"]).default("cinematic"),
  enableCanvasFx: z.boolean().default(false),
  threeD: z.object({
    objectType: z.enum([
      "none",
      "product_model",
      "spatial_environment",
      "hero_floating_object",
      "interactive_particles",
    ]).default("none"),
    scrollInteraction: z.enum([
      "none",
      "rotate_on_scroll",
      "camera_zoom_pan",
      "exploded_view",
    ]).default("none"),
    lightingEnvironment: z.enum([
      "studio",
      "sunset",
      "dramatic_neon",
      "clinical_bright",
      "luxury_warm",
    ]).default("studio"),
    wireframeMode: z.boolean().default(false),
    autoRotate: z.boolean().default(true),
    fallbackImageUrl: z.string().optional(),
  }).optional(),
  media: z.object({
    heroVideoUrl: z.string().optional(),
    heroPosterUrl: z.string().optional(),
    canvasFrameSequenceEnabled: z.boolean().default(false),
    beforeAfterComparisonEnabled: z.boolean().default(true),
  }).optional(),
  sections: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      enabled: z.boolean(),
      order: z.number(),
      customTitle: z.string().optional(),
      description: z.string().optional(),
    })
  ).default([]),
});

export type DesignUpdateInput = z.infer<typeof designUpdateSchema>;
