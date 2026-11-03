import { AssetSlotRequirement } from "./types";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; accent: string; text: string }> = {
  healthcare: { bg: "#0f172a", border: "#0284c7", accent: "#38bdf8", text: "#f0f9ff" },
  "hotels-banquets": { bg: "#18181b", border: "#d97706", accent: "#fbbf24", text: "#fffbeb" },
  "food-restaurants": { bg: "#1c1917", border: "#ea580c", accent: "#fb923c", text: "#fff7ed" },
  "fitness-gyms": { bg: "#09090b", border: "#dc2626", accent: "#ef4444", text: "#fef2f2" },
  "salon-beauty": { bg: "#171717", border: "#db2777", accent: "#f472b6", text: "#fdf2f8" },
  "schools-coaching": { bg: "#0f172a", border: "#4f46e5", accent: "#818cf8", text: "#eef2ff" },
};

export class AssetFallbackGenerator {
  /**
   * Generates a deterministic SVG placeholder data URI for an unfulfilled media slot.
   */
  public static generateFallbackDataUri(
    requirement: AssetSlotRequirement,
    category = "healthcare",
    projectName = "Agency Site"
  ): string {
    const cat = category.toLowerCase().replace(/_/g, "-");
    const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.healthcare;

    const width = requirement.recommendedWidth || 1200;
    const height = requirement.recommendedHeight || 675;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bg}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${colors.border}" stroke-width="1" stroke-opacity="0.15" />
    </pattern>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGrad)" />
  <rect width="100%" height="100%" fill="url(#grid)" />
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="${colors.border}" stroke-width="2" stroke-dasharray="8 8" rx="12" stroke-opacity="0.6" />

  <g transform="translate(${width / 2}, ${height / 2})">
    <!-- Center Badge -->
    <rect x="-140" y="-70" width="280" height="36" rx="18" fill="${colors.border}" fill-opacity="0.2" stroke="${colors.border}" stroke-width="1.5" />
    <text x="0" y="-47" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="700" fill="${colors.accent}" text-anchor="middle" letter-spacing="1.5">
      SLOT: ${requirement.slotName}
    </text>

    <!-- Dimension Label -->
    <text x="0" y="-5" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="900" fill="${colors.text}" text-anchor="middle">
      ${requirement.aspectRatio} (${width} × ${height})
    </text>

    <!-- Subtitle / Guidance -->
    <text x="0" y="30" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500" fill="${colors.text}" fill-opacity="0.7" text-anchor="middle">
      ${requirement.label} • Allowed: ${requirement.allowedTypes.join(", ")}
    </text>
    <text x="0" y="55" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="400" fill="${colors.text}" fill-opacity="0.4" text-anchor="middle">
      Project: ${projectName} • Awaiting Client / Agency Media Upload
    </text>
  </g>
</svg>
    `.trim();

    const base64 = Buffer.from(svg).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
}
