export interface CinematicPatternDefinition {
  id: string;
  name: string;
  category: "reveal" | "pinned" | "parallax" | "text" | "horizontal" | "canvas";
  description: string;
  supportedProperties: string[];
}

export const CINEMATIC_PATTERNS: CinematicPatternDefinition[] = [
  {
    id: "scroll-reveal",
    name: "Scroll Reveal",
    category: "reveal",
    description: "Fade and translate elements as they enter the viewport",
    supportedProperties: ["direction", "distance", "duration", "stagger"],
  },
  {
    id: "pinned-story",
    name: "Pinned Storytelling",
    category: "pinned",
    description: "Pin viewport while scrubbing multi-step content progression",
    supportedProperties: ["pinDuration", "steps", "scrubIntensity"],
  },
  {
    id: "parallax-layer",
    name: "Multi-layer Parallax",
    category: "parallax",
    description: "Relative speed offsets for depth perception across foreground and background",
    supportedProperties: ["speed", "direction"],
  },
  {
    id: "text-storytelling",
    name: "Text Storytelling",
    category: "text",
    description: "Staggered word and headline reveal synced with scroll",
    supportedProperties: ["stagger", "ease"],
  },
  {
    id: "horizontal-gallery",
    name: "Horizontal Scroll Showcase",
    category: "horizontal",
    description: "Convert vertical scroll into horizontal gallery travel with mobile fallback",
    supportedProperties: ["scrub", "pin"],
  },
  {
    id: "canvas-frame-sequence",
    name: "Canvas Frame-Sequence",
    category: "canvas",
    description: "High-performance scroll-driven frame animation rendered directly on HTML5 Canvas",
    supportedProperties: ["fitMode", "fps", "frameCount", "posterFallback"],
  },
];
