import fs from "fs/promises";
import path from "path";
import { StorageAdapter, StoredFile } from "./adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = path.join(process.cwd(), "public", "uploads")) {
    this.baseDir = baseDir;
  }

  async upload(file: Buffer, relativePath: string, _mimeType: string): Promise<StoredFile> {
    // Normalize relative path to prevent directory traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
    const fullPath = path.join(this.baseDir, safePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);

    // Return web-accessible URL with forward slashes
    const webPath = safePath.split(path.sep).join("/");
    return {
      url: `/uploads/${webPath}`,
      filePath: fullPath,
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Default singleton instance
export const storage = new LocalStorageAdapter();
