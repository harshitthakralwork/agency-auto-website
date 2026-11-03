import { z } from "zod";

export const RoutePrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const NavigationPlacementSchema = z.enum(["PRIMARY", "FOOTER", "UTILITY", "HIDDEN"]);

export const ResponsiveSettingsSchema = z.object({
  hideOnMobile: z.boolean().optional(),
  hideOnTablet: z.boolean().optional(),
  hideOnDesktop: z.boolean().optional(),
  paddingY: z.enum(["none", "small", "medium", "large"]).optional(),
  customCssClass: z.string().optional(),
});

export const PageSectionCompositionSchema = z.object({
  id: z.string().min(1),
  pageCompositionId: z.string().min(1),
  componentId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  order: z.number().int().min(0),
  enabled: z.boolean(),
  customName: z.string().nullable().optional(),
  propsOverride: z.record(z.string(), z.unknown()),
  responsiveSettings: ResponsiveSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PageCompositionSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  blueprintId: z.string().nullable().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  routePriority: RoutePrioritySchema,
  navigationPlacement: NavigationPlacementSchema,
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  sections: z.array(PageSectionCompositionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreatePageInputSchema = z.object({
  projectId: z.string().min(1),
  blueprintId: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  routePriority: RoutePrioritySchema.default("MEDIUM"),
  navigationPlacement: NavigationPlacementSchema.default("PRIMARY"),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const UpdatePageInputSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  routePriority: RoutePrioritySchema.optional(),
  navigationPlacement: NavigationPlacementSchema.optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const AddSectionInputSchema = z.object({
  componentId: z.string().min(1),
  variantId: z.string().optional(),
  customName: z.string().optional(),
  order: z.number().int().min(0).optional(),
  propsOverride: z.record(z.string(), z.unknown()).default({}),
  responsiveSettings: ResponsiveSettingsSchema.default({}),
});

export const UpdateSectionInputSchema = z.object({
  variantId: z.string().optional(),
  customName: z.string().optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  propsOverride: z.record(z.string(), z.unknown()).optional(),
  responsiveSettings: ResponsiveSettingsSchema.optional(),
});

export const ReorderSectionsInputSchema = z.object({
  orderedSectionIds: z.array(z.string().min(1)).min(1),
});

