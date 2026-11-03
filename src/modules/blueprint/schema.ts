import { z } from "zod";

export const ProvenanceSourceTypeSchema = z.enum([
  "OBSERVED_FACT",
  "OPERATOR_INPUT",
  "AI_SUGGESTION",
  "INFERENCE",
  "UNKNOWN",
]);

export const ProvenanceRecordSchema = z
  .object({
    fieldPath: z.string().min(1),
    sourceType: ProvenanceSourceTypeSchema,
    sessionId: z.string().nullable().optional(),
    findingId: z.string().nullable().optional(),
    citation: z.string().nullable().optional(),
    confidence: z.number().min(0).max(1),
    timestamp: z.string(),
    operatorConfirmed: z.boolean(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Zero fabrication check: OBSERVED_FACT must cite a session, finding, or explicit evidence source
      if (data.sourceType === "OBSERVED_FACT") {
        return Boolean(data.sessionId || data.findingId || data.citation);
      }
      return true;
    },
    {
      message:
        "Zero Fabrication Guard: Observed facts must include a valid sessionId, findingId, or citation referencing verified evidence.",
      path: ["citation"],
    }
  );

export const ProvenanceMetadataSchema = z.record(
  z.string(),
  ProvenanceRecordSchema
);

export const BusinessProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  tagline: z.string().default(""),
  description: z.string().min(1, "Description is required"),
  industry: z.string().min(1, "Industry is required"),
  location: z.string().optional(),
  targetAudience: z.string().default("General Audience"),
  services: z.array(z.string()).default([]),
  usps: z.array(z.string()).default([]),
  contactChannels: z
    .object({
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      bookingUrl: z.string().optional(),
    })
    .optional(),
});

export const BrandDirectionSchema = z.object({
  toneTraits: z.array(z.string()).min(1, "At least one tone trait required"),
  aestheticKeywords: z.array(z.string()).min(1, "At least one aesthetic keyword required"),
  stylePreset: z.enum([
    "cinematic",
    "minimal",
    "luxury",
    "creative",
    "corporate",
    "custom",
  ]),
  visualMoodDescription: z.string().default(""),
});

export const CustomerJourneyStepSchema = z.object({
  persona: z.string().min(1),
  initialLanding: z.string().min(1),
  keyAction: z.string().min(1),
  conversionOutcome: z.string().min(1),
});

export const WebsiteStrategySchema = z.object({
  primaryConversionGoal: z.string().min(1, "Primary conversion goal is required"),
  secondaryConversionGoals: z.array(z.string()).default([]),
  primaryCallToAction: z.string().min(1, "Primary CTA is required"),
  targetCustomerJourneys: z.array(CustomerJourneyStepSchema).default([]),
  contentHierarchyPriorities: z.array(z.string()).default([]),
});

export const SitemapItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  routePriority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  navigationPlacement: z.enum(["PRIMARY", "FOOTER", "UTILITY", "HIDDEN"]),
  description: z.string().default(""),
});

export const MediaSlotRequirementSchema = z.object({
  slotName: z.string().min(1),
  mediaType: z.enum(["IMAGE", "VIDEO", "MODEL_3D", "POSTER"]),
  required: z.boolean().default(true),
  aspectRatio: z.string().optional(),
  notes: z.string().optional(),
});

export const SectionRequirementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sectionType: z.string().min(1),
  order: z.number().int().nonnegative(),
  defaultEnabled: z.boolean().default(true),
  heading: z.string().min(1),
  subheadline: z.string().optional(),
  contentOutline: z.string().default(""),
  recommendedComponent: z.string().min(1),
  cinematicHook: z.string().optional(),
  threeDHook: z.string().optional(),
  mediaSlots: z.array(MediaSlotRequirementSchema).default([]),
});

export const PageHierarchyItemSchema = z.object({
  pageId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  sections: z.array(SectionRequirementSchema).min(1, "Page must have at least one section"),
});

export const DesignSystemTokensSchema = z.object({
  colors: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
    accent: z.string().min(1),
    background: z.string().min(1),
    surface: z.string().min(1),
    text: z.string().min(1),
    mutedText: z.string().min(1),
  }),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    baseFontSize: z.string().default("16px"),
  }),
  layout: z.object({
    layoutStyle: z.string().default("modern-contained"),
    borderRadius: z.string().default("0.5rem"),
    containerWidth: z.string().default("1280px"),
  }),
  motion: z.object({
    animationIntensity: z.string().default("cinematic"),
    enableCanvasFx: z.boolean().default(false),
  }),
});

export const ExperienceRequirementsSchema = z.object({
  level: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]),
  standardFeatures: z.array(z.string()).default([]),
  gsapScrollTriggerHooks: z.array(z.string()).default([]),
  threeDRequirements: z.object({
    canvasEnabled: z.boolean().default(false),
    objectType: z.string().default("abstract-shape"),
    scrollTransform: z.boolean().default(false),
    lightingEnvironment: z.string().default("studio"),
    interactiveControls: z.boolean().default(false),
  }),
});

export const SeoAccessibilityRulesSchema = z.object({
  targetWcagLevel: z.enum(["AA", "AAA"]),
  preferredColorScheme: z.enum(["dark", "light", "system"]),
  prefersReducedMotionHandling: z.enum([
    "disable-kinetic",
    "reduce-scale",
    "instant-fade",
  ]),
  headingHierarchyStandard: z.string().default("strict-h1-h2-h3"),
  metaDescriptionTemplate: z.string().default(""),
  socialOpenGraphTemplate: z.object({
    title: z.string().default(""),
    description: z.string().default(""),
    type: z.string().default("website"),
  }),
});

export const DesignDirectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tag: z.string().min(1),
  rationale: z.string().min(1),
  preset: z.enum([
    "cinematic",
    "minimal",
    "luxury",
    "creative",
    "corporate",
    "custom",
  ]),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    surface: z.string(),
    text: z.string(),
    mutedText: z.string(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
  }),
  heroStyle: z.string(),
  motionIntensity: z.string(),
  keyDifferentiator: z.string(),
});

export const CreateBlueprintInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().optional(),
  projectId: z.string().optional(),
  researchSessionId: z.string().optional(),
  industry: z.string().min(1, "Industry is required"),
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).default("CINEMATIC"),
});

export const UpdateBlueprintInputSchema = z.object({
  title: z.string().min(2).optional(),
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional(),
  businessProfile: BusinessProfileSchema.partial().optional(),
  brandDirection: BrandDirectionSchema.partial().optional(),
  websiteStrategy: WebsiteStrategySchema.partial().optional(),
  sitemap: z.array(SitemapItemSchema).optional(),
  pageHierarchy: z.array(PageHierarchyItemSchema).optional(),
  designSystem: DesignSystemTokensSchema.partial().optional(),
  experienceRequirements: ExperienceRequirementsSchema.partial().optional(),
  seoAccessibility: SeoAccessibilityRulesSchema.partial().optional(),
  provenanceMetadata: ProvenanceMetadataSchema.optional(),
  designDirections: z.array(DesignDirectionSchema).optional(),
  activeDirectionId: z.string().nullable().optional(),
  changeSummary: z.string().optional(),
});

export const TransitionStatusInputSchema = z.object({
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "ARCHIVED"]),
  approvedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const BranchVersionInputSchema = z.object({
  changeSummary: z.string().min(3, "Change summary is required for version branching"),
});

