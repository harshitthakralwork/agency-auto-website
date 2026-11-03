import { ExperienceLevel } from "../categories/types";
import { DesignPresetId } from "../design/types";

export type { ExperienceLevel };

export type BlueprintStatus = "DRAFT" | "REVIEW" | "APPROVED" | "ARCHIVED";

export type ProvenanceSourceType =
  | "OBSERVED_FACT"
  | "OPERATOR_INPUT"
  | "AI_SUGGESTION"
  | "INFERENCE"
  | "UNKNOWN";

export interface ProvenanceRecord {
  fieldPath: string; // e.g. "businessProfile.companyName" or "designSystem.colors.primary"
  sourceType: ProvenanceSourceType;
  sessionId?: string | null;
  findingId?: string | null;
  citation?: string | null;
  confidence: number; // 0.0 to 1.0
  timestamp: string;
  operatorConfirmed: boolean;
  notes?: string;
}

export type ProvenanceMetadata = Record<string, ProvenanceRecord>;

export interface BusinessProfile {
  companyName: string;
  tagline: string;
  description: string;
  industry: string;
  location?: string;
  targetAudience: string;
  services: string[];
  usps: string[];
  contactChannels?: {
    phone?: string;
    email?: string;
    address?: string;
    bookingUrl?: string;
  };
}

export interface BrandDirection {
  toneTraits: string[]; // e.g. ["sophisticated", "approachable", "authoritative"]
  aestheticKeywords: string[]; // e.g. ["minimalist", "high-contrast", "kinetic"]
  stylePreset: DesignPresetId; // "cinematic" | "minimal" | "luxury" | "creative" | "corporate" | "custom"
  visualMoodDescription: string;
}

export interface CustomerJourneyStep {
  persona: string;
  initialLanding: string;
  keyAction: string;
  conversionOutcome: string;
}

export interface WebsiteStrategy {
  primaryConversionGoal: string;
  secondaryConversionGoals: string[];
  primaryCallToAction: string;
  targetCustomerJourneys: CustomerJourneyStep[];
  contentHierarchyPriorities: string[];
}

export interface SitemapItem {
  id: string;
  title: string;
  slug: string;
  routePriority: "HIGH" | "MEDIUM" | "LOW";
  navigationPlacement: "PRIMARY" | "FOOTER" | "UTILITY" | "HIDDEN";
  description: string;
}

export interface MediaSlotRequirement {
  slotName: string; // e.g. "HERO_BACKGROUND", "BEFORE_SLOT", "GALLERY"
  mediaType: "IMAGE" | "VIDEO" | "MODEL_3D" | "POSTER";
  required: boolean;
  aspectRatio?: string;
  notes?: string;
}

export interface SectionRequirement {
  id: string;
  name: string;
  sectionType: string; // e.g. "hero", "services", "comparison", "testimonials", "contact"
  order: number;
  defaultEnabled: boolean;
  heading: string;
  subheadline?: string;
  contentOutline: string;
  recommendedComponent: string;
  cinematicHook?: string;
  threeDHook?: string;
  mediaSlots: MediaSlotRequirement[];
}

export interface PageHierarchyItem {
  pageId: string;
  title: string;
  slug: string;
  sections: SectionRequirement[];
}

export interface DesignSystemTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
  };
  layout: {
    layoutStyle: string; // "modern-contained" | "full-width-minimal" | "editorial-split"
    borderRadius: string;
    containerWidth: string;
  };
  motion: {
    animationIntensity: string; // "subtle" | "cinematic" | "energetic"
    enableCanvasFx: boolean;
  };
}

export interface ExperienceRequirements {
  level: ExperienceLevel;
  standardFeatures: string[];
  gsapScrollTriggerHooks: string[];
  threeDRequirements: {
    canvasEnabled: boolean;
    objectType: string; // "abstract-shape" | "device-mockup" | "product-model" | "environment"
    scrollTransform: boolean;
    lightingEnvironment: string;
    interactiveControls: boolean;
  };
}

export interface SeoAccessibilityRules {
  targetWcagLevel: "AA" | "AAA";
  preferredColorScheme: "dark" | "light" | "system";
  prefersReducedMotionHandling: "disable-kinetic" | "reduce-scale" | "instant-fade";
  headingHierarchyStandard: string;
  metaDescriptionTemplate: string;
  socialOpenGraphTemplate: {
    title: string;
    description: string;
    type: string;
  };
}

export interface DesignDirection {
  id: string; // e.g. "minimal-conversion", "cinematic-luxury", "immersive-3d"
  name: string;
  tag: string;
  rationale: string;
  preset: DesignPresetId;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    mutedText: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  heroStyle: string;
  motionIntensity: string;
  keyDifferentiator: string;
}

export interface WebsiteBlueprintData {
  id: string;
  projectId?: string | null;
  researchSessionId?: string | null;
  title: string;
  slug: string;
  version: number;
  parentBlueprintId?: string | null;
  status: BlueprintStatus;
  industry: string;
  experienceLevel: ExperienceLevel;

  businessProfile: BusinessProfile;
  brandDirection: BrandDirection;
  websiteStrategy: WebsiteStrategy;
  sitemap: SitemapItem[];
  pageHierarchy: PageHierarchyItem[];
  designSystem: DesignSystemTokens;
  experienceRequirements: ExperienceRequirements;
  seoAccessibility: SeoAccessibilityRules;

  provenanceMetadata: ProvenanceMetadata;
  designDirections: DesignDirection[];
  activeDirectionId?: string | null;

  changeSummary?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;

  createdAt: string;
  updatedAt: string;
}

