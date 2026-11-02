import { DesignPreset, DesignPresetId } from "./types";

export const DESIGN_PRESETS: Record<Exclude<DesignPresetId, "custom">, DesignPreset> = {
  cinematic: {
    id: "cinematic",
    name: "Cinematic Dark",
    tagline: "Dramatic high-contrast immersive aesthetic",
    description: "Deep obsidian surfaces, luminous accent sparks, expansive typography, and atmospheric presence.",
    colors: {
      primary: "#6366f1", // indigo spark
      secondary: "#a855f7", // purple electric
      accent: "#f59e0b", // warm gold
      background: "#090d16", // obsidian
      surface: "#111827", // deep slate
      text: "#f8fafc", // bright off-white
      mutedText: "#94a3b8", // muted slate
    },
    typography: {
      headingFont: "Syne",
      bodyFont: "Inter",
      baseFontSize: "16px",
    },
    layout: {
      layoutStyle: "modern-contained",
      borderRadius: "0.75rem",
      containerWidth: "1280px",
    },
    animation: {
      animationIntensity: "cinematic",
      enableCanvasFx: false,
    },
  },

  minimal: {
    id: "minimal",
    name: "Pure Minimal",
    tagline: "Clean Swiss-inspired typographic discipline",
    description: "Expansive whitespace, stark black & white contrast, crisp hairline dividers, and total clarity.",
    colors: {
      primary: "#000000",
      secondary: "#525252",
      accent: "#2563eb",
      background: "#ffffff",
      surface: "#f9fafb",
      text: "#111827",
      mutedText: "#6b7280",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      baseFontSize: "16px",
    },
    layout: {
      layoutStyle: "modern-contained",
      borderRadius: "0.25rem",
      containerWidth: "1200px",
    },
    animation: {
      animationIntensity: "subtle",
      enableCanvasFx: false,
    },
  },

  luxury: {
    id: "luxury",
    name: "Editorial Luxury",
    tagline: "Opulent, prestigious, and timeless elegance",
    description: "Refined champagne-gold highlights, warm rich ivory surfaces, and classic editorial serif typography.",
    colors: {
      primary: "#b45309", // refined bronze / gold
      secondary: "#78350f",
      accent: "#d97706",
      background: "#faf8f5", // warm cream / ivory
      surface: "#f3ede4",
      text: "#1c1917", // rich charcoal
      mutedText: "#78716c",
    },
    typography: {
      headingFont: "Cinzel",
      bodyFont: "Cormorant Garamond",
      baseFontSize: "17px",
    },
    layout: {
      layoutStyle: "modern-contained",
      borderRadius: "0.125rem",
      containerWidth: "1280px",
    },
    animation: {
      animationIntensity: "subtle",
      enableCanvasFx: false,
    },
  },

  creative: {
    id: "creative",
    name: "Vibrant Creative",
    tagline: "Bold contemporary agency personality",
    description: "Electric magenta and violet gradients, neo-grotesque type scales, and energetic interactive presence.",
    colors: {
      primary: "#ec4899", // bright pink
      secondary: "#8b5cf6", // violet
      accent: "#06b6d4", // cyan
      background: "#0a0a0f",
      surface: "#181824",
      text: "#ffffff",
      mutedText: "#a1a1aa",
    },
    typography: {
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      baseFontSize: "16px",
    },
    layout: {
      layoutStyle: "asymmetric",
      borderRadius: "1rem",
      containerWidth: "1320px",
    },
    animation: {
      animationIntensity: "energetic",
      enableCanvasFx: false,
    },
  },

  corporate: {
    id: "corporate",
    name: "Executive Corporate",
    tagline: "Solid institutional trust and structured authority",
    description: "Deep executive sapphire blues, dependable balanced contrast, and structured readability.",
    colors: {
      primary: "#1d4ed8", // royal blue
      secondary: "#0284c7", // sky
      accent: "#059669", // emerald
      background: "#ffffff",
      surface: "#f8fafc",
      text: "#0f172a", // deep slate
      mutedText: "#64748b",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      baseFontSize: "16px",
    },
    layout: {
      layoutStyle: "modern-contained",
      borderRadius: "0.5rem",
      containerWidth: "1280px",
    },
    animation: {
      animationIntensity: "subtle",
      enableCanvasFx: false,
    },
  },
};

export const AVAILABLE_FONTS = [
  { name: "Inter", label: "Inter (Modern Sans)" },
  { name: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Contemporary)" },
  { name: "Syne", label: "Syne (Cinematic Display)" },
  { name: "Cinzel", label: "Cinzel (Classic Roman Serif)" },
  { name: "Cormorant Garamond", label: "Cormorant Garamond (Editorial Luxury)" },
  { name: "Playfair Display", label: "Playfair Display (High Fashion)" },
  { name: "Outfit", label: "Outfit (Geometric Tech)" },
  { name: "Space Grotesk", label: "Space Grotesk (Neo-Brutalist)" },
];
