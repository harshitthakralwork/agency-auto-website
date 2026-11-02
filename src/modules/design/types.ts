export type DesignPresetId =
  | "cinematic"
  | "minimal"
  | "luxury"
  | "creative"
  | "corporate"
  | "custom";

export interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  baseFontSize: string; // e.g. "16px"
}

export interface LayoutTokens {
  layoutStyle: "modern-contained" | "full-width" | "asymmetric";
  borderRadius: string; // e.g. "0.5rem"
  containerWidth: string; // e.g. "1280px"
}

export interface AnimationTokens {
  animationIntensity: "none" | "subtle" | "cinematic" | "energetic";
  enableCanvasFx: boolean;
}

export interface SectionConfigItem {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
  customTitle?: string;
  description?: string;
}

export interface DesignPreset {
  id: DesignPresetId;
  name: string;
  tagline: string;
  description: string;
  colors: ColorTokens;
  typography: TypographyTokens;
  layout: LayoutTokens;
  animation: AnimationTokens;
}

export interface ProjectDesignState {
  preset: DesignPresetId;
  colors: ColorTokens;
  typography: TypographyTokens;
  layout: LayoutTokens;
  animation: AnimationTokens;
  sections: SectionConfigItem[];
  responsiveSettings: Record<string, unknown>;
}
