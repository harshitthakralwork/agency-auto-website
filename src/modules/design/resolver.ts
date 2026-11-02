import { DESIGN_PRESETS } from "./presets";
import {
  DesignPresetId,
  ProjectDesignState,
  SectionConfigItem,
} from "./types";
import { getDefaultSectionsForCategory } from "../categories/registry";

export function resolveDesignState(
  categoryId: string,
  rawConfig?: {
    preset?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    backgroundColor?: string | null;
    surfaceColor?: string | null;
    textColor?: string | null;
    mutedTextColor?: string | null;
    headingFont?: string | null;
    bodyFont?: string | null;
    baseFontSize?: string | null;
    layoutStyle?: string | null;
    borderRadius?: string | null;
    containerWidth?: string | null;
    animationIntensity?: string | null;
    enableCanvasFx?: boolean | null;
    sectionsConfigJson?: string | null;
    responsiveSettings?: string | null;
  } | null
): ProjectDesignState {
  const presetKey = (rawConfig?.preset as DesignPresetId) || "cinematic";
  const basePreset =
    presetKey in DESIGN_PRESETS
      ? DESIGN_PRESETS[presetKey as Exclude<DesignPresetId, "custom">]
      : DESIGN_PRESETS.cinematic;

  // Parse sections config safely
  let sections: SectionConfigItem[] = [];
  if (rawConfig?.sectionsConfigJson) {
    try {
      const parsed = JSON.parse(rawConfig.sectionsConfigJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sections = parsed;
      }
    } catch {
      // Fallback
      sections = [];
    }
  }

  if (sections.length === 0) {
    sections = getDefaultSectionsForCategory(categoryId);
  }

  let responsiveSettings: Record<string, unknown> = {};
  if (rawConfig?.responsiveSettings) {
    try {
      responsiveSettings = JSON.parse(rawConfig.responsiveSettings);
    } catch {
      responsiveSettings = {};
    }
  }

  return {
    preset: presetKey,
    colors: {
      primary: rawConfig?.primaryColor || basePreset.colors.primary,
      secondary: rawConfig?.secondaryColor || basePreset.colors.secondary,
      accent: rawConfig?.accentColor || basePreset.colors.accent,
      background: rawConfig?.backgroundColor || basePreset.colors.background,
      surface: rawConfig?.surfaceColor || basePreset.colors.surface,
      text: rawConfig?.textColor || basePreset.colors.text,
      mutedText: rawConfig?.mutedTextColor || basePreset.colors.mutedText,
    },
    typography: {
      headingFont: rawConfig?.headingFont || basePreset.typography.headingFont,
      bodyFont: rawConfig?.bodyFont || basePreset.typography.bodyFont,
      baseFontSize: rawConfig?.baseFontSize || basePreset.typography.baseFontSize,
    },
    layout: {
      layoutStyle:
        (rawConfig?.layoutStyle as "modern-contained" | "full-width" | "asymmetric") ||
        basePreset.layout.layoutStyle,
      borderRadius: rawConfig?.borderRadius || basePreset.layout.borderRadius,
      containerWidth: rawConfig?.containerWidth || basePreset.layout.containerWidth,
    },
    animation: {
      animationIntensity:
        (rawConfig?.animationIntensity as "none" | "subtle" | "cinematic" | "energetic") ||
        basePreset.animation.animationIntensity,
      enableCanvasFx: rawConfig?.enableCanvasFx ?? basePreset.animation.enableCanvasFx,
    },
    sections,
    responsiveSettings,
  };
}

export function generateCssVariables(design: ProjectDesignState): React.CSSProperties {
  return {
    ["--theme-primary" as string]: design.colors.primary,
    ["--theme-secondary" as string]: design.colors.secondary,
    ["--theme-accent" as string]: design.colors.accent,
    ["--theme-bg" as string]: design.colors.background,
    ["--theme-surface" as string]: design.colors.surface,
    ["--theme-text" as string]: design.colors.text,
    ["--theme-muted" as string]: design.colors.mutedText,
    ["--theme-heading-font" as string]: `"${design.typography.headingFont}", sans-serif`,
    ["--theme-body-font" as string]: `"${design.typography.bodyFont}", sans-serif`,
    ["--theme-radius" as string]: design.layout.borderRadius,
    ["--theme-container" as string]: design.layout.containerWidth,
  } as React.CSSProperties;
}
