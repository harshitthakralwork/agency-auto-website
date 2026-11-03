export type AssetSlotType =
  | "HERO_BACKGROUND"
  | "BEFORE_SLOT"
  | "AFTER_SLOT"
  | "GALLERY"
  | "SECTION_BG"
  | "POSTER_FALLBACK"
  | "CANVAS_HERO_SEQUENCE"
  | "THREE_D_HERO_MODEL"
  | "THREE_D_SHOWCASE_MODEL"
  | "THREE_D_ENVIRONMENT_MAP";

export interface AssetSlotRequirement {
  slotName: AssetSlotType;
  label: string;
  recommendedWidth: number;
  recommendedHeight: number;
  aspectRatio: string;
  allowedTypes: Array<"IMAGE" | "VIDEO" | "MODEL_3D" | "FRAME_SEQUENCE">;
  required: boolean;
  notes?: string;
}

export interface MatchedSlotResult {
  slotName: AssetSlotType;
  required: boolean;
  status: "MATCHED" | "FALLBACK_GENERATED" | "UNFULFILLED";
  assetId?: string;
  assetUrl?: string;
  fallbackSvgDataUri?: string;
  fileName?: string;
  mimeType?: string;
}

export interface PageAssetAuditReport {
  pageId: string;
  pageTitle: string;
  slug: string;
  totalSlots: number;
  matchedSlots: number;
  missingSlots: number;
  slotDetails: MatchedSlotResult[];
}

export interface ProjectAssetAuditSummary {
  projectId: string;
  projectName: string;
  overallFulfillmentPercent: number;
  totalRequiredSlots: number;
  totalMatchedSlots: number;
  pages: PageAssetAuditReport[];
}

export interface ContentEnrichmentResult {
  pageId: string;
  sectionId: string;
  componentId: string;
  enrichedFields: string[];
  provenanceCitations: Array<{ field: string; source: string; citation?: string }>;
}

