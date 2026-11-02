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
  previewSnippet?: {
    headline: string;
    subheadline: string;
    actionLabel?: string;
  };
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
  recommendedPages: CategoryPageRecommendation[];
  recommendedSections: CategorySectionRecommendation[];
}
