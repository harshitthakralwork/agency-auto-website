import { ProjectDesignState } from "../design/types";
import { CategoryPack } from "../categories/types";
import { PageCompositionData, PageSectionCompositionData } from "../composition/types";

export interface GenerationOptions {
  projectId: string;
  outputDirectory?: string;
  experienceTierOverride?: "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D";
  minify?: boolean;
  includeAssets?: boolean;
  cleanOutput?: boolean;
  zip?: boolean;
  baseUrl?: string;
}

export interface GeneratedAssetRef {
  slot: string;
  fileName: string;
  localPath: string;
  originalUrl?: string;
  assetType: string;
  isFallback: boolean;
  fileSize: number;
}

export interface GeneratedPageMeta {
  slug: string;
  title: string;
  fileName: string;
  filePath: string;
  sectionCount: number;
  components: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface BuildManifest {
  buildId: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  category: string;
  designPreset: string;
  experienceTier: "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D";
  pages: GeneratedPageMeta[];
  assetManifest: {
    totalAssets: number;
    copiedAssets: number;
    fallbackAssets: number;
    assets: GeneratedAssetRef[];
  };
  styles: string[];
  scripts: string[];
  generatedAt: string;
  zeroCdnVerified: boolean;
  status: "SUCCESS" | "FAILED" | "WARNING";
  warnings: string[];
}

export interface GenerationResult {
  success: boolean;
  buildId: string;
  outputDirectory: string;
  manifest: BuildManifest;
  zipPath?: string;
  pageCount: number;
  assetCount: number;
  durationMs: number;
  warnings: string[];
}
