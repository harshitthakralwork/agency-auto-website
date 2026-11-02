import { z } from "zod";

export const ASSET_TYPES = [
  "IMAGE",
  "VIDEO",
  "POSTER",
  "BEFORE_IMAGE",
  "AFTER_IMAGE",
  "MODEL_3D",
  "FRAME_SEQUENCE",
] as const;

export const ASSIGNED_SLOTS = [
  "HERO_BACKGROUND",
  "BEFORE_SLOT",
  "AFTER_SLOT",
  "GALLERY",
  "SECTION_BG",
  "POSTER_FALLBACK",
  "CANVAS_HERO_SEQUENCE",
  "THREE_D_HERO_MODEL",
  "THREE_D_SHOWCASE_MODEL",
  "THREE_D_ENVIRONMENT_MAP",
] as const;

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"],
  VIDEO: ["video/mp4", "video/webm"],
  POSTER: ["image/jpeg", "image/png", "image/webp"],
  BEFORE_IMAGE: ["image/jpeg", "image/png", "image/webp"],
  AFTER_IMAGE: ["image/jpeg", "image/png", "image/webp"],
  MODEL_3D: ["model/gltf-binary", "model/gltf+json", "application/octet-stream"],
  FRAME_SEQUENCE: ["application/json"],
};

export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  IMAGE: ["jpg", "jpeg", "png", "webp", "svg", "gif"],
  VIDEO: ["mp4", "webm"],
  POSTER: ["jpg", "jpeg", "png", "webp"],
  BEFORE_IMAGE: ["jpg", "jpeg", "png", "webp"],
  AFTER_IMAGE: ["jpg", "jpeg", "png", "webp"],
  MODEL_3D: ["glb", "gltf"],
  FRAME_SEQUENCE: ["json"],
};

export const MAX_FILE_SIZES: Record<string, number> = {
  IMAGE: 15 * 1024 * 1024, // 15MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  POSTER: 15 * 1024 * 1024, // 15MB
  BEFORE_IMAGE: 15 * 1024 * 1024, // 15MB
  AFTER_IMAGE: 15 * 1024 * 1024, // 15MB
  MODEL_3D: 50 * 1024 * 1024, // 50MB
  FRAME_SEQUENCE: 10 * 1024 * 1024, // 10MB
};

export const assetUpdateSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").max(100).optional(),
  assignedSlot: z.enum(ASSIGNED_SLOTS).nullable().optional(),
  assetType: z.enum(ASSET_TYPES).optional(),
  metadataJson: z.string().optional(),
});

export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;

