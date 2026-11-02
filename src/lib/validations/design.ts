import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const designUpdateSchema = z.object({
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
  animationIntensity: z.enum(["none", "subtle", "cinematic", "energetic"]).default("subtle"),
  enableCanvasFx: z.boolean().default(false),
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
