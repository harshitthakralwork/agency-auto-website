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

/**
 * Returns industry-specific adaptive palettes
 */
function getAdaptivePalettes(industryKey: string) {
  switch (industryKey) {
    case "healthcare":
      return {
        minimal: {
          primary: "#0f172a",
          secondary: "#334155",
          accent: "#0284c7", // clinical sky blue
          background: "#ffffff",
          surface: "#f8fafc",
          text: "#0f172a",
          mutedText: "#64748b",
        },
        cinematic: {
          primary: "#38bdf8",
          secondary: "#818cf8",
          accent: "#34d399",
          background: "#0b1329",
          surface: "#111c38",
          text: "#f0f9ff",
          mutedText: "#94a3b8",
        },
        immersive: {
          primary: "#06b6d4",
          secondary: "#3b82f6",
          accent: "#10b981",
          background: "#030d1a",
          surface: "#0c192c",
          text: "#f8fafc",
          mutedText: "#94a3b8",
        },
      };
    case "hotels-banquets":
      return {
        minimal: {
          primary: "#1c1917",
          secondary: "#44403c",
          accent: "#b45309", // warm amber
          background: "#fafaf9",
          surface: "#f5f5f4",
          text: "#1c1917",
          mutedText: "#78716c",
        },
        cinematic: {
          primary: "#d4af37", // champagne gold
          secondary: "#e2e8f0",
          accent: "#f59e0b",
          background: "#0a0a0c",
          surface: "#141419",
          text: "#fefefe",
          mutedText: "#a1a1aa",
        },
        immersive: {
          primary: "#eab308",
          secondary: "#9333ea",
          accent: "#f97316",
          background: "#08060e",
          surface: "#151022",
          text: "#fafafa",
          mutedText: "#a8a29e",
        },
      };
    case "food-restaurants":
      return {
        minimal: {
          primary: "#18181b",
          secondary: "#3f3f46",
          accent: "#e11d48", // artisan rose
          background: "#ffffff",
          surface: "#fafafa",
          text: "#18181b",
          mutedText: "#71717a",
        },
        cinematic: {
          primary: "#f43f5e",
          secondary: "#fb923c",
          accent: "#eab308",
          background: "#0c0a09",
          surface: "#1c1917",
          text: "#fafaf9",
          mutedText: "#a8a29e",
        },
        immersive: {
          primary: "#f97316",
          secondary: "#ef4444",
          accent: "#eab308",
          background: "#0a0604",
          surface: "#18100b",
          text: "#fef2f2",
          mutedText: "#a8a29e",
        },
      };
    case "fitness-sports":
      return {
        minimal: {
          primary: "#09090b",
          secondary: "#27272a",
          accent: "#2563eb",
          background: "#ffffff",
          surface: "#f4f4f5",
          text: "#09090b",
          mutedText: "#71717a",
        },
        cinematic: {
          primary: "#84cc16", // energetic lime
          secondary: "#3b82f6",
          accent: "#eab308",
          background: "#05070a",
          surface: "#0e131f",
          text: "#f8fafc",
          mutedText: "#94a3b8",
        },
        immersive: {
          primary: "#06b6d4",
          secondary: "#84cc16",
          accent: "#f43f5e",
          background: "#040810",
          surface: "#0a1324",
          text: "#ffffff",
          mutedText: "#94a3b8",
        },
      };
    case "salon-beauty":
      return {
        minimal: {
          primary: "#18181b",
          secondary: "#52525b",
          accent: "#db2777",
          background: "#fdf4ff",
          surface: "#ffffff",
          text: "#18181b",
          mutedText: "#71717a",
        },
        cinematic: {
          primary: "#ec4899", // couture pink
          secondary: "#a855f7",
          accent: "#f472b6",
          background: "#0b0612",
          surface: "#180d26",
          text: "#fdf4ff",
          mutedText: "#c084fc",
        },
        immersive: {
          primary: "#d946ef",
          secondary: "#06b6d4",
          accent: "#fb7185",
          background: "#08040d",
          surface: "#140c21",
          text: "#faf5ff",
          mutedText: "#c084fc",
        },
      };
    default: // schools-coaching or general
      return {
        minimal: {
          primary: "#0f172a",
          secondary: "#334155",
          accent: "#2563eb",
          background: "#ffffff",
          surface: "#f8fafc",
          text: "#0f172a",
          mutedText: "#64748b",
        },
        cinematic: {
          primary: "#3b82f6",
          secondary: "#6366f1",
          accent: "#f59e0b",
          background: "#070b14",
          surface: "#0f172a",
          text: "#f8fafc",
          mutedText: "#94a3b8",
        },
        immersive: {
          primary: "#6366f1",
          secondary: "#06b6d4",
          accent: "#ec4899",
          background: "#040711",
          surface: "#0d1527",
          text: "#f8fafc",
          mutedText: "#94a3b8",
        },
      };
  }
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

  if (input.observedFacts?.documentTitle) {
    companyName = input.observedFacts.documentTitle;
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "OBSERVED_FACT",
      sessionId: input.researchSessionId,
      findingId: "observed.documentTitle",
      citation: `Captured DOM Title: "${input.observedFacts.documentTitle}"`,
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: false,
    };
  } else if (input.title) {
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "OPERATOR_INPUT",
      citation: "User-provided project or blueprint title",
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: true,
    };
  } else {
    companyName = `${pack.title} Architecture`;
    provenanceMetadata["businessProfile.companyName"] = {
      fieldPath: "businessProfile.companyName",
      sourceType: "AI_SUGGESTION",
      citation: `Category default title for ${pack.title}`,
      confidence: 0.75,
      timestamp: now,
      operatorConfirmed: false,
    };
  }

  // Handle curated selected findings strictly according to their origin
  if (Array.isArray(input.selectedFindings)) {
    input.selectedFindings.forEach((finding) => {
      const isFact = finding.type === "OBSERVED_FACT" || finding.category === "DOM" || finding.category === "MEDIA";
      const isHeuristic = finding.type === "HEURISTIC" || finding.category === "HEURISTIC" || finding.category === "PALETTE";

      provenanceMetadata[`stagedFinding.${finding.id}`] = {
        fieldPath: `stagedFinding.${finding.id}`,
        sourceType: isFact ? "OBSERVED_FACT" : isHeuristic ? "INFERENCE" : "AI_SUGGESTION",
        sessionId: input.researchSessionId,
        findingId: finding.id,
        citation: finding.evidenceCitation || finding.title,
        confidence: typeof finding.confidence === "number" ? finding.confidence : isFact ? 1.0 : 0.85,
        timestamp: now,
        operatorConfirmed: true, // Operator curated it into blueprint staging
        notes: finding.detail || finding.title,
      };
    });
  }

  let description = input.observedFacts?.metaDescription || pack.description;
  if (input.observedFacts?.metaDescription) {
    provenanceMetadata["businessProfile.description"] = {
      fieldPath: "businessProfile.description",
      sourceType: "OBSERVED_FACT",
      sessionId: input.researchSessionId,
      findingId: "observed.metaDescription",
      citation: `Captured Meta Description Tag (${input.observedFacts.metaDescription.slice(0, 40)}...)`,
      confidence: 1.0,
      timestamp: now,
      operatorConfirmed: false,
    };
  } else {
    provenanceMetadata["businessProfile.description"] = {
      fieldPath: "businessProfile.description",
      sourceType: "AI_SUGGESTION",
      citation: `Industry Category Pack default description for ${pack.title}`,
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
    targetAudience: `Discerning clients seeking high-standard ${pack.title} solutions.`,
    services: pack.keyFeatures.slice(0, 4),
    usps: [
      `Evidence-backed ${pack.title} digital experience`,
      "Tailored conversion and inquiry pathways",
      "High-clarity aesthetic and responsive performance",
    ],
  };

  provenanceMetadata["businessProfile.services"] = {
    fieldPath: "businessProfile.services",
    sourceType: "AI_SUGGESTION",
    citation: `Derived from Category Pack Core Features: ${pack.keyFeatures.slice(0, 2).join(", ")}`,
    confidence: 0.85,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 2. Brand Direction
  const brandDirection: BrandDirection = {
    toneTraits: ["Authoritative", "Refined", "Client-First"],
    aestheticKeywords: ["Modern", "High-Contrast", "Purposeful"],
    stylePreset: pack.suggestedPreset,
    visualMoodDescription: `Tailored for ${pack.title} with high visual polish, accessible contrast, and distinct brand identity.`,
  };

  provenanceMetadata["brandDirection.stylePreset"] = {
    fieldPath: "brandDirection.stylePreset",
    sourceType: "AI_SUGGESTION",
    citation: `Category Pack recommended preset: ${pack.suggestedPreset}`,
    confidence: 0.9,
    timestamp: now,
    operatorConfirmed: false,
  };

  // 3. Website Strategy
  const websiteStrategy: WebsiteStrategy = {
    primaryConversionGoal:
      industryKey === "healthcare"
        ? "Book Clinical Consultation or Diagnostic Appointment"
        : industryKey === "hotels-banquets"
        ? "Reserve Suite or Book Banquet Event"
        : industryKey === "food-restaurants"
        ? "Reserve Table or Order Tasting Menu"
        : industryKey === "fitness-sports"
        ? "Claim Trial Membership or Book Assessment"
        : industryKey === "salon-beauty"
        ? "Schedule Atelier Treatment Session"
        : "Direct Client Inquiry & Consultation",
    secondaryConversionGoals: [
      "View Portfolio / Treatment Showcase",
      "Download Informational Brochure or Menu",
      "Direct Telephone / Instant Messaging Contact",
    ],
    primaryCallToAction:
      industryKey === "healthcare"
        ? "Book Appointment"
        : industryKey === "hotels-banquets"
        ? "Reserve Suite"
        : industryKey === "food-restaurants"
        ? "Book Table"
        : industryKey === "fitness-sports"
        ? "Start Trial"
        : industryKey === "salon-beauty"
        ? "Book Treatment"
        : "Schedule Consultation",
    targetCustomerJourneys: [
      {
        persona: "Primary Decision Maker",
        initialLanding: "Hero Value Proposition with Social Proof",
        keyAction: "Inspects service offerings and credentials",
        conversionOutcome: "Submits inquiry or schedules booking",
      },
      {
        persona: "Researching Prospect",
        initialLanding: "Service Comparison / Treatment Gallery",
        keyAction: "Reviews transparent case studies and FAQs",
        conversionOutcome: "Contacts via phone or direct messenger",
      },
    ],
    contentHierarchyPriorities: [
      "Hero Value Proposition",
      "Key Offerings & Core Differentiation",
      "Social Proof & Evidence Showcase",
      "Frictionless Booking & Contact",
    ],
  };

  provenanceMetadata["websiteStrategy.primaryConversionGoal"] = {
    fieldPath: "websiteStrategy.primaryConversionGoal",
    sourceType: "AI_SUGGESTION",
    citation: `Industry-specific conversion funnel for ${pack.title}`,
    confidence: 0.9,
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
    citation: `Generated from Category Pack recommended pages for ${pack.title}`,
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

  // 6. Adaptive Palettes & Presets
  const palettes = getAdaptivePalettes(industryKey);
  const basePreset = DESIGN_PRESETS[pack.suggestedPreset] || DESIGN_PRESETS.cinematic;
  const initialColors =
    experienceLevel === "STANDARD"
      ? palettes.minimal
      : experienceLevel === "IMMERSIVE_3D"
      ? palettes.immersive
      : palettes.cinematic;

  const designSystem: DesignSystemTokens = {
    colors: initialColors,
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
      animationIntensity:
        experienceLevel === "STANDARD"
          ? "subtle"
          : experienceLevel === "IMMERSIVE_3D"
          ? "energetic"
          : "cinematic",
      enableCanvasFx: experienceLevel === "CINEMATIC",
    },
  };

  // 7. Experience Requirements
  const experienceRequirements: ExperienceRequirements = {
    level: experienceLevel,
    standardFeatures: [
      "Fluid responsive layout across mobile, tablet, and desktop viewports",
      "Accessible semantic HTML5 landmarks and keyboard navigation",
      "High-contrast color compliance meeting WCAG 2.2 AA standard",
      "Instant loading core web vitals optimization with zero layout shift",
    ],
    gsapScrollTriggerHooks:
      experienceLevel === "STANDARD"
        ? ["Subtle section entry opacity reveal"]
        : [
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
      lightingEnvironment:
        industryKey === "healthcare"
          ? "clinical_bright"
          : industryKey === "hotels-banquets"
          ? "luxury_warm"
          : "studio",
      interactiveControls: experienceLevel === "IMMERSIVE_3D",
    },
  };

  // 8. SEO & Accessibility Rules
  const seoAccessibility: SeoAccessibilityRules = {
    targetWcagLevel: "AA",
    preferredColorScheme: experienceLevel === "STANDARD" ? "light" : "dark",
    prefersReducedMotionHandling: "disable-kinetic",
    headingHierarchyStandard: "Strict single-h1 followed by semantic h2-h3 tags",
    metaDescriptionTemplate: `${companyName} — Exceptional ${pack.title} solutions designed for uncompromising quality and trust.`,
    socialOpenGraphTemplate: {
      title: `${companyName} | ${pack.tagline}`,
      description: description.slice(0, 160),
      type: "website",
    },
  };

  // 9. Genuinely Adaptive Multiple Strategic Design Directions (3 Distinct Options)
  const designDirections: DesignDirection[] = [
    {
      id: "minimal-conversion",
      name: `${pack.title} Minimal & Direct Conversion`,
      tag: "Conversion-Focused",
      rationale: `Prioritizes maximum clarity and frictionless ${pack.title.toLowerCase()} inquiries. Stark contrast, crisp neo-grotesque typography, and zero visual clutter.`,
      preset: "minimal",
      colors: palettes.minimal,
      typography: {
        headingFont: "Inter",
        bodyFont: "Inter",
      },
      heroStyle: `High-clarity value proposition with instant "${websiteStrategy.primaryCallToAction}" action`,
      motionIntensity: "subtle",
      keyDifferentiator: "Highest readability, zero cognitive friction, rapid page speed",
    },
    {
      id: "cinematic-narrative",
      name: `${pack.title} Cinematic Brand Story`,
      tag: "Emotional Storytelling",
      rationale: `Immersive deep-tone canvas with luminous accents, GSAP scroll-triggered pacing, and evocative media designed to establish premium authority in ${pack.title.toLowerCase()}.`,
      preset: "cinematic",
      colors: palettes.cinematic,
      typography: {
        headingFont: "Syne",
        bodyFont: "Inter",
      },
      heroStyle: "Atmospheric full-viewport canvas with staggered headline reveal & video sequence",
      motionIntensity: "cinematic",
      keyDifferentiator: "Visceral narrative presence, memorable brand elevation",
    },
    {
      id: "immersive-spatial-3d",
      name: `${pack.title} Interactive Spatial Showcase`,
      tag: "Cutting-Edge Immersive",
      rationale:
        experienceLevel === "STANDARD"
          ? `Optional upgrade direction: Integrates real-time Three.js WebGL spatial preview, giving ${pack.title.toLowerCase()} clients an interactive physical showcase.`
          : `WebGL Three.js canvas anchoring the user journey with scroll-linked camera movement, dynamic lighting, and tactile 3D product/spatial inspection.`,
      preset: "creative",
      colors: palettes.immersive,
      typography: {
        headingFont: "Plus Jakarta Sans",
        bodyFont: "Inter",
      },
      heroStyle: "Interactive 3D model with orbital camera paths and scroll-tied rotation",
      motionIntensity: "energetic",
      keyDifferentiator: "Commanding technical prestige, interactive physical showcase",
    },
  ];

  // Active direction selection strictly respects project experience tier
  let activeDirectionId = "cinematic-narrative";
  if (experienceLevel === "STANDARD") {
    activeDirectionId = "minimal-conversion";
  } else if (experienceLevel === "IMMERSIVE_3D") {
    activeDirectionId = "immersive-spatial-3d";
  } else if (pack.suggestedPreset === "minimal") {
    activeDirectionId = "minimal-conversion";
  }

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
