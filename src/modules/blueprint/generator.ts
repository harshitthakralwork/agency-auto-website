import { getCategoryPack } from "../categories/registry";
import { DESIGN_PRESETS } from "../design/presets";
import {
  BusinessProfile,
  BrandDirection,
  WebsiteStrategy,
  SitemapItem,
  PageHierarchyItem,
  DesignSystemTokens,
  ExperienceRequirements,
  SeoAccessibilityRules,
  DesignDirection,
  ProvenanceMetadata,
  ExperienceLevel,
  WebsiteBlueprintData,
} from "./types";

interface GeneratorInput {
  title?: string;
  industry: string;
  experienceLevel?: ExperienceLevel;
  projectId?: string | null;
  researchSessionId?: string | null;
  observedFacts?: any;
  heuristicDetections?: any;
  selectedFindings?: Array<{
    id: string;
    title: string;
    category?: string;
    type?: string;
    detail?: string;
    confidence?: number;
    evidenceCitation?: string;
  }>;
}

export function generateEvidenceBackedBlueprint(
  input: GeneratorInput
): Omit<WebsiteBlueprintData, "id" | "createdAt" | "updatedAt"> {
  const industryKey = (input.industry || "healthcare").toLowerCase().replace(/_/g, "-");
  const pack = getCategoryPack(industryKey);
  const now = new Date().toISOString();
  const experienceLevel: ExperienceLevel = input.experienceLevel || "CINEMATIC";

  const provenanceMetadata: ProvenanceMetadata = {};

  // 1. Business Profile Synthesis
  let companyName = input.title;
  let hasObservedTitle = false;

  if (input.observedFacts?.documentTitle) {
    companyName = input.observedFacts.documentTitle;
    hasObservedTitle = true;
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "OBSERVED_FACT",
      sessionId: input.researchSessionId,
      citation: "Captured DOM Document Title",
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: false,
    };
  } else if (input.title) {
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "OPERATOR_INPUT",
      citation: "User-provided project/blueprint title",
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: true,
    };
  } else {
    companyName = pack.title + " Experience";
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "AI_SUGGESTION",
      citation: "Category default title",
      confidence: 0.7,
      timestamp: now,
      operatorConfirmed: false,
    };
  }

  // Check selected findings for curated operator insights
  const curatedNotes: string[] = [];
  if (Array.isArray(input.selectedFindings)) {
    input.selectedFindings.forEach((finding) => {
      curatedNotes.push(finding.title);
      provenanceMetadata[`curatedFinding.${finding.id}`] = {
        fieldPath: `curatedFinding.${finding.id}`,
        sourceType: "OPERATOR_INPUT",
        findingId: finding.id,
        citation: finding.evidenceCitation || finding.title,
        confidence: 1.0,
        timestamp: now,
        operatorConfirmed: true,
        notes: finding.detail,
      };
    });
  }

  let description = input.observedFacts?.metaDescription || pack.description;
  if (input.observedFacts?.metaDescription) {
    provenanceMetadata["businessProfile.description"] = {
      fieldPath: "businessProfile.description",
      sourceType: "OBSERVED_FACT",
      sessionId: input.researchSessionId,
      citation: "Captured Meta Description Tag",
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: false,
    };
  } else {
    provenanceMetadata["businessProfile.description"] = {
      fieldPath: "businessProfile.description",
      sourceType: "AI_SUGGESTION",
      citation: "Industry Category Pack Description",
      confidence: 0.85,
      timestamp: now,
      operatorConfirmed: false,
    };
  }

  const businessProfile: BusinessProfile = {
    companyName: companyName || pack.title,
    tagline: pack.tagline,
    description: description,
    industry: pack.id,
    targetAudience: `Discerning clients seeking high-standard ${pack.title} offerings.`,
    services: pack.keyFeatures.slice(0, 4),
    usps: [
      "Evidence-backed digital architecture",
      "Tailored client conversion pathway",
      "Cinematic brand storytelling",
    ],
  };

  provenanceMetadata["businessProfile.services"] = {
    fieldPath: "businessProfile.services",
    sourceType: "AI_SUGGESTION",
    citation: "Extracted from Category Pack Core Features",
    confidence: 0.85,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 2. Brand Direction
  const brandDirection: BrandDirection = {
    toneTraits: ["Authoritative", "Sophisticated", "Forward-thinking"],
    aestheticKeywords: ["Modern", "High-clarity", "Immersive"],
    stylePreset: pack.suggestedPreset,
    visualMoodDescription: `Tailored for ${pack.title} with high visual polish and crisp contrast.`,
  };

  provenanceMetadata["brandDirection.stylePreset"] = {
    fieldPath: "brandDirection.stylePreset",
    sourceType: "AI_SUGGESTION",
    citation: `Category Pack suggested preset: ${pack.suggestedPreset}`,
    confidence: 0.9,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 3. Website Strategy
  const websiteStrategy: WebsiteStrategy = {
    primaryConversionGoal: "Direct Inquiry & Booking Consultation",
    secondaryConversionGoals: [
      "View Portfolio / Treatment Showcase",
      "Download Informational Guide / Brochure",
      "Phone or Direct Messaging Contact",
    ],
    primaryCallToAction: "Schedule Consultation",
    targetCustomerJourneys: [
      {
        persona: "Primary Decision Maker",
        initialLanding: "Hero Section with Value Proposition",
        keyAction: "Reviews service offerings & cinematic proof",
        conversionOutcome: "Submits inquiry form or schedules appointment",
      },
      {
        persona: "Researching Prospect",
        initialLanding: "Service Comparison / Gallery",
        keyAction: "Inspects detailed case studies and credentials",
        conversionOutcome: "Calls direct phone line or downloads guide",
      },
    ],
    contentHierarchyPriorities: [
      "Hero Value Proposition",
      "Key Offerings & Differentiation",
      "Social Proof & Evidence Showcase",
      "Frictionless Booking & Contact",
    ],
  };

  provenanceMetadata["websiteStrategy.primaryConversionGoal"] = {
    fieldPath: "websiteStrategy.primaryConversionGoal",
    sourceType: "AI_SUGGESTION",
    citation: "Optimized agency conversion standard for industry",
    confidence: 0.88,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 4. Sitemap & Page Structure
  const sitemap: SitemapItem[] = pack.recommendedPages.map((page, idx) => ({
    id: page.id,
    title: page.name,
    slug: page.slug,
    routePriority: page.isPrimary ? "HIGH" : idx === 1 ? "MEDIUM" : "LOW",
    navigationPlacement: page.isPrimary
      ? "PRIMARY"
      : idx > 3
      ? "FOOTER"
      : "PRIMARY",
    description: page.description,
  }));

  provenanceMetadata["sitemap"] = {
    fieldPath: "sitemap",
    sourceType: "AI_SUGGESTION",
    citation: "Generated from Category Pack recommended pages",
    confidence: 0.92,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 5. Page Hierarchy & Sections
  const pageHierarchy: PageHierarchyItem[] = [
    {
      pageId: "home",
      title: "Home",
      slug: "/",
      sections: pack.recommendedSections.map((sec) => ({
        id: sec.id,
        name: sec.name,
        sectionType: sec.id,
        order: sec.order,
        defaultEnabled: sec.defaultEnabled,
        heading: sec.previewSnippet?.headline || sec.name,
        subheadline: sec.previewSnippet?.subheadline,
        contentOutline: sec.description,
        recommendedComponent: `${sec.id.replace(/-([a-z])/g, (_, c) =>
          c.toUpperCase()
        )}Section`,
        cinematicHook: sec.cinematicHook,
        threeDHook: sec.threeDHook,
        mediaSlots: [
          {
            slotName: `${sec.id}_hero_slot`,
            mediaType: sec.threeDHook ? "MODEL_3D" : "IMAGE",
            required: true,
            aspectRatio: "16:9",
          },
        ],
      })),
    },
  ];

  // 6. Design System Tokens (Defaulting from pack's suggested preset)
  const basePreset = DESIGN_PRESETS[pack.suggestedPreset] || DESIGN_PRESETS.cinematic;
  const designSystem: DesignSystemTokens = {
    colors: {
      primary: basePreset.colors.primary,
      secondary: basePreset.colors.secondary,
      accent: basePreset.colors.accent,
      background: basePreset.colors.background,
      surface: basePreset.colors.surface,
      text: basePreset.colors.text,
      mutedText: basePreset.colors.mutedText,
    },
    typography: {
      headingFont: basePreset.typography.headingFont,
      bodyFont: basePreset.typography.bodyFont,
      baseFontSize: basePreset.typography.baseFontSize,
    },
    layout: {
      layoutStyle: basePreset.layout.layoutStyle,
      borderRadius: basePreset.layout.borderRadius,
      containerWidth: basePreset.layout.containerWidth,
    },
    motion: {
      animationIntensity: basePreset.animation.animationIntensity,
      enableCanvasFx: basePreset.animation.enableCanvasFx,
    },
  };

  // 7. Experience Requirements
  const adaptation = pack.experienceAdaptations[experienceLevel];
  const experienceRequirements: ExperienceRequirements = {
    level: experienceLevel,
    standardFeatures: [
      "Responsive fluid grid layout",
      "Semantic HTML5 landmarks",
      "Accessible color contrast AA standard",
      "Instant loading core web vitals optimization",
    ],
    gsapScrollTriggerHooks: [
      "Hero heading staggered split-text reveal",
      "Section title parallax pinned scroll indicator",
      "Feature cards staggered y-translation fade-in",
      "Smooth scroll velocity inertia damping",
    ],
    threeDRequirements: {
      canvasEnabled: experienceLevel === "IMMERSIVE_3D",
      objectType:
        industryKey.includes("hotel")
          ? "environment"
          : industryKey.includes("health")
          ? "product-model"
          : "abstract-shape",
      scrollTransform: experienceLevel === "IMMERSIVE_3D",
      lightingEnvironment: "studio-warm",
      interactiveControls: experienceLevel === "IMMERSIVE_3D",
    },
  };

  // 8. SEO & Accessibility Rules
  const seoAccessibility: SeoAccessibilityRules = {
    targetWcagLevel: "AA",
    preferredColorScheme: "dark",
    prefersReducedMotionHandling: "disable-kinetic",
    headingHierarchyStandard: "Strict single-h1 followed by semantic h2-h3 tags",
    metaDescriptionTemplate: `${companyName} — Exceptional ${pack.title} solutions designed for uncompromising quality and trust.`,
    socialOpenGraphTemplate: {
      title: `${companyName} | ${pack.tagline}`,
      description: description.slice(0, 160),
      type: "website",
    },
  };

  // 9. Strategic Multiple Design Directions (Minimum 3 Distinct Directions)
  const minimalPreset = DESIGN_PRESETS.minimal;
  const cinematicPreset = DESIGN_PRESETS.cinematic;
  const luxuryPreset = DESIGN_PRESETS.luxury;

  const designDirections: DesignDirection[] = [
    {
      id: "minimal-conversion",
      name: "Minimal & High-Conversion",
      tag: "Conversion-Focused",
      rationale:
        "Stark typography, expansive whitespace, and uncompromising clarity designed to funnel visitors directly toward consultation inquiries with zero visual noise.",
      preset: "minimal",
      colors: {
        primary: "#09090b",
        secondary: "#52525b",
        accent: "#2563eb",
        background: "#ffffff",
        surface: "#f4f4f5",
        text: "#09090b",
        mutedText: "#71717a",
      },
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
      },
      heroStyle: "High-contrast editorial typography split with prominent booking CTA",
      motionIntensity: "subtle",
      keyDifferentiator: "Highest readability, zero cognitive friction, rapid page speed",
    },
    {
      id: "cinematic-narrative",
      name: "Cinematic Dark Narrative",
      tag: "Emotional Storytelling",
      rationale:
        "Deep obsidian canvas with luminous electric accents, dramatic GSAP scroll-triggered reveals, and cinematic video storytelling that positions the agency as an elite category leader.",
      preset: "cinematic",
      colors: {
        primary: "#6366f1",
        secondary: "#a855f7",
        accent: "#f59e0b",
        background: "#090d16",
        surface: "#111827",
        text: "#f8fafc",
        mutedText: "#94a3b8",
      },
      typography: {
        headingFont: "Syne",
        bodyFont: "Inter",
      },
      heroStyle: "Atmospheric full-viewport canvas with staggered headline reveal & video loop",
      motionIntensity: "cinematic",
      keyDifferentiator: "Immersive narrative presence, memorable brand impact",
    },
    {
      id: "immersive-spatial-3d",
      name: "Interactive Spatial 3D",
      tag: "Cutting-Edge Immersive",
      rationale:
        "WebGL Three.js canvas anchoring the user journey with scroll-linked camera movement, dynamic lighting, and tactile 3D product/spatial inspection.",
      preset: "creative",
      colors: {
        primary: "#06b6d4",
        secondary: "#3b82f6",
        accent: "#ec4899",
        background: "#030712",
        surface: "#0f172a",
        text: "#f9fafb",
        mutedText: "#94a3b8",
      },
      typography: {
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
      },
      heroStyle: "Interactive 3D model with orbital camera paths and scroll-tied rotation",
      motionIntensity: "energetic",
      keyDifferentiator: "Commanding technical prestige, interactive physical showcase",
    },
  ];

  const activeDirectionId =
    experienceLevel === "IMMERSIVE_3D"
      ? "immersive-spatial-3d"
      : pack.suggestedPreset === "minimal"
      ? "minimal-conversion"
      : "cinematic-narrative";

  const slug = (companyName || pack.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    projectId: input.projectId || null,
    researchSessionId: input.researchSessionId || null,
    title: `${companyName || pack.title} Blueprint`,
    slug: slug || "agency-blueprint",
    version: 1,
    parentBlueprintId: null,
    status: "DRAFT",
    industry: pack.id,
    experienceLevel,
    businessProfile,
    brandDirection,
    websiteStrategy,
    sitemap,
    pageHierarchy,
    designSystem,
    experienceRequirements,
    seoAccessibility,
    provenanceMetadata,
    designDirections,
    activeDirectionId,
    changeSummary: "Initial evidence-backed blueprint generated.",
    approvedAt: null,
    approvedBy: null,
  };
}

