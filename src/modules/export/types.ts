import { Production3DManifest } from "../three-d/runtime/types";

export interface ExportOptions {
  projectId: string;
  outputDirectory: string;
  baseUrl?: string;
}

export interface ExportedAssetRef {
  originalUrl: string;
  localPath: string;
  fileName: string;
  assetType: string;
  fileSize: number;
}

export interface ExportResult {
  success: boolean;
  projectId: string;
  projectName: string;
  projectSlug: string;
  exportPath: string;
  indexHtmlPath: string;
  assetCount: number;
  assets: ExportedAssetRef[];
  manifest: Production3DManifest;
  exportedAt: string;
  warnings: string[];
}

