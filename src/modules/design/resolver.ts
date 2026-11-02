import { DESIGN_PRESETS } from "./presets";
import {
  DesignPresetId,
  ExperienceLevel,
  ProjectDesignState,
  SectionConfigItem,
  ThreeDPreferences,
  MediaPreferences,
} from "./types";
import { getDefaultSectionsForCategory, getCategoryPack } from "../categories/registry";

export function resolveDesignState(
  categoryId: string,
  rawConfig?: {
    experienceLevel?: string | null;
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
    mediaPreferences?: string | null;
    threeDPreferences?: string | null;
    sectionsConfigJson?: string | null;
    responsiveSettings?: string | null;
  } | null
): ProjectDesignState {
  const pack = getCategoryPack(categoryId);
  const experienceLevel =
    (rawConfig?.experienceLevel as ExperienceLevel) || "CINEMATIC";
  const presetKey = (rawConfig?.preset as DesignPresetId) || pack.suggestedPreset || "cinematic";
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
      sections = [];
    }
  }

  if (sections.length === 0) {
    sections = getDefaultSectionsForCategory(categoryId);
  }

  // Parse 3D Preferences
  let threeD: ThreeDPreferences = {
    objectType: experienceLevel === "IMMERSIVE_3D" ? "product_model" : "none",
    scrollInteraction: experienceLevel === "IMMERSIVE_3D" ? "rotate_on_scroll" : "none",
    lightingEnvironment: "studio",
    wireframeMode: false,
    autoRotate: true,
  };
  if (rawConfig?.threeDPreferences) {
    try {
      const parsed = JSON.parse(rawConfig.threeDPreferences);
      threeD = { ...threeD, ...parsed };
    } catch {
      // Keep default
    }
  }

  // Parse Media Preferences
  let media: MediaPreferences = {
    canvasFrameSequenceEnabled: experienceLevel === "CINEMATIC",
    beforeAfterComparisonEnabled: true,
  };
  if (rawConfig?.mediaPreferences) {
    try {
      const parsed = JSON.parse(rawConfig.mediaPreferences);
      media = { ...media, ...parsed };
    } catch {
      // Keep default
    }
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
    experienceLevel,
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
    threeD,
    media,
    sections,
    responsiveSettings,
  };
}

export function generateCssVariables(design: ProjectDesignState): React.CSSProperties {
  // Animation dynamics mapping
  const animationMap = {
    none: {
      duration: "0ms",
      timing: "linear",
      hoverScale: "scale(1)",
      hoverY: "translateY(0)",
    },
    subtle: {
      duration: "200ms",
      timing: "cubic-bezier(0.4, 0, 0.2, 1)",
      hoverScale: "scale(1.02)",
      hoverY: "translateY(-2px)",
    },
    cinematic: {
      duration: "500ms",
      timing: "cubic-bezier(0.16, 1, 0.3, 1)",
      hoverScale: "scale(1.04)",
      hoverY: "translateY(-4px)",
    },
    energetic: {
      duration: "150ms",
      timing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      hoverScale: "scale(1.06)",
      hoverY: "translateY(-6px)",
    },
  };

  const anim = animationMap[design.animation.animationIntensity] || animationMap.cinematic;

  // Layout spacing mapping
  const layoutSpacingMap = {
    "modern-contained": {
      paddingY: "4.5rem",
      paddingX: "2rem",
    },
    "full-width": {
      paddingY: "5.5rem",
      paddingX: "3.5rem",
    },
    asymmetric: {
      paddingY: "6rem",
      paddingX: "4rem",
    },
  };

  const spacing = layoutSpacingMap[design.layout.layoutStyle] || layoutSpacingMap["modern-contained"];

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
    ["--theme-base-font-size" as string]: design.typography.baseFontSize || "16px",
    ["--theme-radius" as string]: design.layout.borderRadius,
    ["--theme-container" as string]: design.layout.containerWidth,
    ["--theme-layout-style" as string]: design.layout.layoutStyle,
    ["--theme-section-padding-y" as string]: spacing.paddingY,
    ["--theme-section-padding-x" as string]: spacing.paddingX,
    ["--theme-transition-duration" as string]: anim.duration,
    ["--theme-animation-timing" as string]: anim.timing,
    ["--theme-hover-scale" as string]: anim.hoverScale,
    ["--theme-hover-y" as string]: anim.hoverY,
  } as React.CSSProperties;
}
