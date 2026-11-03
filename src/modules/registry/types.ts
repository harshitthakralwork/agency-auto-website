import { ExperienceLevel } from "../categories/types";
import { DesignPresetId, ColorTokens, TypographyTokens, LayoutTokens, AnimationTokens } from "../design/types";

export type { ExperienceLevel };

export type ComponentFamily =
  | "HERO"
  | "BUSINESS"
  | "CONVERSION"
  | "SOCIAL_PROOF"
  | "MEDIA"
  | "CONTENT"
  | "ADVANCED";

export interface ComponentVariant {
  id: string;
  name: string;
  description: string;
  previewThumbnail?: string;
  layoutClasses?: string;
  customSettings?: Record<string, unknown>;
}

export interface ComponentPropDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "image" | "color";
  label: string;
  description: string;
  required: boolean;
  defaultValue?: unknown;
  options?: string[]; // for enum / select
}

export interface ComponentDefinition {
  id: string;
  name: string;
  family: ComponentFamily;
  sectionType: string;
  description: string;
  supportedExperienceLevels: ExperienceLevel[];
  requiredProps: string[];
  propDefinitions: ComponentPropDefinition[];
  defaultProps: Record<string, unknown>;
  variants: ComponentVariant[];
  tags: string[];
  isFavorite?: boolean;
}

export interface AdaptationContext {
  category: string; // e.g. "healthcare", "hotels-banquets", "food-restaurants", "fitness-gyms", "salon-beauty", "schools-coaching"
  experienceLevel: ExperienceLevel;
  designPreset?: DesignPresetId;
  colors?: Partial<ColorTokens>;
  typography?: Partial<TypographyTokens>;
  layout?: Partial<LayoutTokens>;
  animation?: Partial<AnimationTokens>;
}

export interface AdaptedComponentData {
  componentId: string;
  variantId: string;
  props: Record<string, unknown>;
  tokenStyles: {
    fontHeading: string;
    fontBody: string;
    colorPrimary: string;
    colorSecondary: string;
    colorAccent: string;
    colorBackground: string;
    colorSurface: string;
    colorText: string;
    colorMutedText: string;
    borderRadius: string;
  };
  experienceLevel: ExperienceLevel;
  category: string;
  tags: string[];
}

export interface ProjectComponentBinding {
  id?: string;
  projectId: string;
  componentId: string;
  variantId?: string;
  customProps: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegistryFilterOptions {
  family?: ComponentFamily | "ALL";
  experienceLevel?: ExperienceLevel | "ALL";
  category?: string | "ALL";
  searchQuery?: string;
  favoritesOnly?: boolean;
}

