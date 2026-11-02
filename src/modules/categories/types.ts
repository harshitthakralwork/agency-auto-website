export type ExperienceLevel = "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D";

export interface CategoryPageRecommendation {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPrimary: boolean;
}

export interface CategorySectionRecommendation {
  id: string;
  name: string;
  description: string;
  defaultEnabled: boolean;
  order: number;
  cinematicHook?: string;
  threeDHook?: string;
  previewSnippet?: {
    headline: string;
    subheadline: string;
    actionLabel?: string;
    beforeLabel?: string;
    afterLabel?: string;
  };
}

export interface ExperienceLevelAdaptation {
  level: ExperienceLevel;
  title: string;
  tagline: string;
  characteristics: string[];
  recommendedComponents: string[];
}

export interface VisualAssetRequirements {
  imageStandard: string;
  videoFormat: string;
  frameSequenceSpecs?: string;
  threeDModelSpecs?: string;
}

export interface CategoryPack {
  id: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  badgeColor: string;
  suggestedPreset: "cinematic" | "minimal" | "luxury" | "creative" | "corporate";
  keyFeatures: string[];
  experienceAdaptations: Record<ExperienceLevel, ExperienceLevelAdaptation>;
  visualAssetRequirements: VisualAssetRequirements;
  animationRecommendations: string[];
  seoAndAccessibility: string[];
  recommendedPages: CategoryPageRecommendation[];
  recommendedSections: CategorySectionRecommendation[];
}
