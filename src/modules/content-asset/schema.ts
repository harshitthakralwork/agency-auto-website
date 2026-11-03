import { z } from "zod";

export const AssetSlotTypeSchema = z.enum([
  "HERO_BACKGROUND",
  "BEFORE_SLOT",
  "AFTER_SLOT",
  "GALLERY",
  "SECTION_BG",
  "POSTER_FALLBACK",
  "CANVAS_HERO_SEQUENCE",
  "THREE_D_HERO_MODEL",
  "THREE_D_SHOWCASE_MODEL",
  "THREE_D_ENVIRONMENT_MAP",
]);

export const AssetSlotRequirementSchema = z.object({
  slotName: AssetSlotTypeSchema,
  label: z.string().min(1),
  recommendedWidth: z.number().int().positive(),
  recommendedHeight: z.number().int().positive(),
  aspectRatio: z.string().min(1),
  allowedTypes: z.array(z.enum(["IMAGE", "VIDEO", "MODEL_3D", "FRAME_SEQUENCE"])),
  required: z.boolean(),
  notes: z.string().optional(),
});

export const MatchedSlotResultSchema = z.object({
  slotName: AssetSlotTypeSchema,
  required: z.boolean(),
  status: z.enum(["MATCHED", "FALLBACK_GENERATED", "UNFULFILLED"]),
  assetId: z.string().optional(),
  assetUrl: z.string().optional(),
  fallbackSvgDataUri: z.string().optional(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
});

export const PageAssetAuditReportSchema = z.object({
  pageId: z.string().min(1),
  pageTitle: z.string().min(1),
  slug: z.string().min(1),
  totalSlots: z.number().int().min(0),
  matchedSlots: z.number().int().min(0),
  missingSlots: z.number().int().min(0),
  slotDetails: z.array(MatchedSlotResultSchema),
});

export const ProjectAssetAuditSummarySchema = z.object({
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  overallFulfillmentPercent: z.number().min(0).max(100),
  totalRequiredSlots: z.number().int().min(0),
  totalMatchedSlots: z.number().int().min(0),
  pages: z.array(PageAssetAuditReportSchema),
});
