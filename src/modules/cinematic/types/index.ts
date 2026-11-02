export type VideoJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface FrameManifestItem {
  index: number;
  url: string;
  filename: string;
}

export interface FrameManifest {
  version: "1.0";
  id: string;
  projectId: string;
  sourceVideoName: string;
  sourceVideoUrl?: string;
  fps: number;
  frameCount: number;
  duration: number;
  width: number;
  height: number;
  format: "webp" | "jpg" | "png";
  fitMode: "cover" | "contain";
  posterUrl?: string;
  frames: FrameManifestItem[];
  createdAt: string;
}

export interface VideoExtractionOptions {
  projectId: string;
  videoId: string;
  videoFilePath: string;
  videoFileName: string;
  videoUrl: string;
  targetFps?: number; // default 24
  maxFrames?: number; // default 60
  quality?: "low" | "medium" | "high"; // default high
  outputFormat?: "webp" | "jpg" | "png"; // default webp
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  format: string;
  sizeBytes: number;
  bitrate: number;
}

export interface VideoJobProgress {
  jobId: string;
  projectId: string;
  status: VideoJobStatus;
  progress: number;
  frameCount?: number;
  manifestUrl?: string;
  errorMessage?: string;
  updatedAt: string;
}

export type ScrollRevealDirection = "up" | "down" | "left" | "right" | "fade";

export interface ScrollRevealConfig {
  direction?: ScrollRevealDirection;
  distance?: number; // pixels, default 40
  duration?: number; // seconds, default 1.0
  stagger?: number; // seconds, default 0.15
  delay?: number;
  threshold?: number; // 0 to 1
  scrub?: boolean | number;
}

export interface PinnedStoryStep {
  id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  badge?: string;
}

export interface ParallaxLayerConfig {
  speed: number; // e.g. -0.5 to 0.5
  direction?: "vertical" | "horizontal";
}
