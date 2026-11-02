import { z } from "zod";

export const easingTypeSchema = z.enum([
  "linear",
  "power1.in",
  "power1.out",
  "power1.inOut",
  "power2.in",
  "power2.out",
  "power2.inOut",
  "power3.out",
  "sine.inOut",
  "expo.out",
]);

export const animationTargetTypeSchema = z.enum([
  "object",
  "camera",
  "light",
  "material",
]);

export const animationPropertyTypeSchema = z.enum([
  "position",
  "rotation",
  "scale",
  "opacity",
  "visible",
  "camera_position",
  "camera_target",
  "camera_fov",
  "light_intensity",
  "light_color",
  "material_color",
  "material_roughness",
  "material_metalness",
  "material_opacity",
  "material_emissive",
]);

export const keyframeValueSchema = z.union([
  z.number(),
  z.tuple([z.number(), z.number(), z.number()]),
  z.string(),
  z.boolean(),
]);

export const keyframeConfigSchema = z.object({
  id: z.string().min(1),
  time: z.number().min(0).max(1),
  value: keyframeValueSchema,
  ease: easingTypeSchema.optional().default("linear"),
});

export const animationTrackConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  targetType: animationTargetTypeSchema,
  targetId: z.string().min(1),
  property: animationPropertyTypeSchema,
  keyframes: z.array(keyframeConfigSchema),
  enabled: z.boolean().default(true),
});

export const scrollTriggerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  triggerSelector: z.string().optional(),
  start: z.string().default("top top"),
  end: z.string().default("+=2000"),
  scrub: z.union([z.boolean(), z.number()]).default(1),
  pin: z.boolean().default(true),
  anticipatePin: z.number().optional().default(1),
  markers: z.boolean().optional().default(false),
});

export const threeDTimelineConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  duration: z.number().positive().default(4.0),
  scrollTrigger: scrollTriggerConfigSchema,
  tracks: z.array(animationTrackConfigSchema),
});

export const threeDAnimationConfigSchema = z.object({
  version: z.literal("1.0").default("1.0"),
  activeTimelineId: z.string().min(1),
  timelines: z.array(threeDTimelineConfigSchema).min(1),
});

export type ThreeDAnimationConfigInput = z.infer<typeof threeDAnimationConfigSchema>;
