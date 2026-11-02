import fs from "fs/promises";
import path from "path";
import { FrameManifest } from "../types";

export class FrameManifestManager {
  static validate(manifest: any): { valid: boolean; error?: string } {
    if (!manifest || typeof manifest !== "object") {
      return { valid: false, error: "Manifest is not an object" };
    }
    if (manifest.version !== "1.0") {
      return { valid: false, error: "Unsupported manifest version" };
    }
    if (!manifest.id || typeof manifest.id !== "string") {
      return { valid: false, error: "Missing or invalid manifest id" };
    }
    if (!manifest.projectId || typeof manifest.projectId !== "string") {
      return { valid: false, error: "Missing or invalid projectId" };
    }
    if (!Array.isArray(manifest.frames) || manifest.frames.length === 0) {
      return { valid: false, error: "Manifest frames must be a non-empty array" };
    }
    if (typeof manifest.frameCount !== "number" || manifest.frameCount !== manifest.frames.length) {
      return { valid: false, error: "frameCount does not match frames array length" };
    }

    // Verify ordering
    for (let i = 0; i < manifest.frames.length; i++) {
      const f = manifest.frames[i];
      if (typeof f.index !== "number" || f.index !== i) {
        return { valid: false, error: `Frame at position ${i} has incorrect index ${f.index}` };
      }
      if (!f.url || typeof f.url !== "string") {
        return { valid: false, error: `Frame at position ${i} has missing or invalid url` };
      }
    }

    return { valid: true };
  }

  static async saveManifest(
    projectFramesDir: string,
    manifest: FrameManifest
  ): Promise<{ manifestPath: string; manifestUrl: string }> {
    const validation = this.validate(manifest);
    if (!validation.valid) {
      throw new Error(`Cannot save invalid manifest: ${validation.error}`);
    }

    await fs.mkdir(projectFramesDir, { recursive: true });
    const manifestPath = path.join(projectFramesDir, "manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    // Relative web URL
    const relativePart = path.relative(path.join(process.cwd(), "public"), manifestPath);
    const manifestUrl = "/" + relativePart.split(path.sep).join("/");

    return { manifestPath, manifestUrl };
  }

  static async loadManifest(manifestPath: string): Promise<FrameManifest> {
    const raw = await fs.readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = this.validate(parsed);
    if (!validation.valid) {
      throw new Error(`Corrupted manifest: ${validation.error}`);
    }
    return parsed as FrameManifest;
  }
}

