import fs from "fs/promises";
import path from "path";
import { StorageAdapter, StoredFile } from "./adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private baseDir: string;

  constructor(baseDir: string = path.join(process.cwd(), "public", "uploads")) {
    this.baseDir = baseDir;
  }

  async upload(file: Buffer, relativePath: string, _mimeType: string): Promise<StoredFile> {
    // Resolve relative path and enforce strict storage boundary
    const resolvedBase = path.resolve(this.baseDir);
    const fullPath = path.resolve(resolvedBase, relativePath);

    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      throw new Error("Invalid storage path: Directory traversal attempt detected");
    }

    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file);

    // Return web-accessible URL with forward slashes
    const relativeToUploads = path.relative(resolvedBase, fullPath);
    const webPath = relativeToUploads.split(path.sep).join("/");
    return {
      url: `/uploads/${webPath}`,
      filePath: fullPath,
    };
  }

  async delete(filePath: string): Promise<void> {
    const resolvedBase = path.resolve(this.baseDir);
    const fullPath = path.resolve(filePath);

    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      throw new Error("Invalid deletion path: Path is outside upload storage boundary");
    }

    try {
      await fs.unlink(fullPath);
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

  async deleteProjectDirectory(projectId: string): Promise<void> {
    // Sanitize projectId strictly to ensure no path manipulation
    const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (!safeProjectId) {
      throw new Error("Invalid project ID for directory deletion");
    }

    const resolvedBase = path.resolve(this.baseDir);
    const projectsBase = path.resolve(resolvedBase, "projects");
    const targetDir = path.resolve(projectsBase, safeProjectId);

    // Strictly ensure targetDir resides within baseDir/projects/
    if (!targetDir.startsWith(projectsBase + path.sep)) {
      throw new Error("Security violation: Target directory is outside projects boundary");
    }

    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }
}

// Default singleton instance
export const storage = new LocalStorageAdapter();

