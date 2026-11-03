import { z } from "zod";

export const ExperienceLevelSchema = z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]);

export const ComponentFamilySchema = z.enum([
  "HERO",
  "BUSINESS",
  "CONVERSION",
  "SOCIAL_PROOF",
  "MEDIA",
  "CONTENT",
  "ADVANCED",
]);

export const ComponentVariantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  previewThumbnail: z.string().optional(),
  layoutClasses: z.string().optional(),
  customSettings: z.record(z.string(), z.unknown()).optional(),
});

export const ComponentPropDefinitionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "array", "object", "image", "color"]),
  label: z.string().min(1),
  description: z.string(),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  options: z.array(z.string()).optional(),
});

export const ComponentDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  family: ComponentFamilySchema,
  sectionType: z.string().min(1),
  description: z.string().min(1),
  supportedExperienceLevels: z.array(ExperienceLevelSchema).min(1),
  requiredProps: z.array(z.string()),
  propDefinitions: z.array(ComponentPropDefinitionSchema),
  defaultProps: z.record(z.string(), z.unknown()),
  variants: z.array(ComponentVariantSchema).min(1),
  tags: z.array(z.string()),
  isFavorite: z.boolean().optional(),
});

export const AdaptationContextSchema = z.object({
  category: z.string().min(1),
  experienceLevel: ExperienceLevelSchema,
  designPreset: z
    .enum(["cinematic", "minimal", "luxury", "creative", "corporate", "custom"])
    .optional(),
  colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      surface: z.string().optional(),
      text: z.string().optional(),
      mutedText: z.string().optional(),
    })
    .optional(),
  typography: z
    .object({
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
      baseFontSize: z.string().optional(),
    })
    .optional(),
  layout: z
    .object({
      layoutStyle: z.enum(["modern-contained", "full-width", "asymmetric"]).optional(),
      borderRadius: z.string().optional(),
      containerWidth: z.string().optional(),
    })
    .optional(),
  animation: z
    .object({
      animationIntensity: z.enum(["none", "subtle", "cinematic", "energetic"]).optional(),
      enableCanvasFx: z.boolean().optional(),
    })
    .optional(),
});

export const ProjectComponentBindingSchema = z.object({
  projectId: z.string().min(1),
  componentId: z.string().min(1),
  variantId: z.string().optional(),
  customProps: z.record(z.string(), z.unknown()).default({}),
});

