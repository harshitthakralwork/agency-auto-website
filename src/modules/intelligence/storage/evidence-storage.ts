import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { LocalStorageAdapter } from "@/lib/storage/local-adapter";

export interface StoredEvidenceRecord {
  evidenceId: string;
  storagePath: string;
  sha256: string;
  fileSizeBytes: number;
}

export interface EvidenceStorageOptions {
  baseDir?: string;
  maxSizeBytes?: number;
}

export class EvidenceStorageService {
  private baseDir: string;
  private maxSizeBytes: number;
  private adapter: LocalStorageAdapter;

  constructor(options: EvidenceStorageOptions = {}) {
    // Default storage directory is outside public/ uploads: <cwd>/storage/evidence
    this.baseDir = options.baseDir || path.resolve(process.cwd(), "storage", "evidence");
    this.maxSizeBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB limit
    this.adapter = new LocalStorageAdapter(this.baseDir);
  }

  /**
   * Generates a collision-resistant unique evidence identifier.
   */
  static generateEvidenceId(): string {
    return `ev_${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Computes SHA-256 hash of a buffer or string.
   */
  static computeSha256(content: Buffer | string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Atomically saves sanitized evidence JSON outside the public directory.
   */
  async saveEvidence(
    evidenceId: string,
    evidenceJsonString: string
  ): Promise<StoredEvidenceRecord> {
    if (!evidenceId || !/^[a-zA-Z0-9_-]+$/.test(evidenceId)) {
      throw new Error(`Invalid evidenceId format: "${evidenceId}"`);
    }

    const buffer = Buffer.from(evidenceJsonString, "utf-8");

    // Enforce size limit
    if (buffer.length > this.maxSizeBytes) {
      throw new Error(
        `Oversized evidence payload: ${buffer.length} bytes exceeds maximum allowed ${this.maxSizeBytes} bytes.`
      );
    }

    const sha256 = EvidenceStorageService.computeSha256(buffer);
    const fileName = `${evidenceId}.json`;
    const targetDir = path.resolve(this.baseDir);
    const finalPath = path.resolve(targetDir, fileName);

    // Verify storage boundary
    if (!finalPath.startsWith(targetDir + path.sep)) {
      throw new Error("Security violation: Target evidence path escapes storage boundary.");
    }

    await fs.mkdir(targetDir, { recursive: true });

    // Atomic write via temp file + rename
    const tempFileName = `${evidenceId}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    const tempPath = path.resolve(targetDir, tempFileName);

    try {
      await fs.writeFile(tempPath, buffer, { mode: 0o600 });
      await fs.rename(tempPath, finalPath);
    } catch (err: any) {
      // Clean up temp file on failure
      try {
        await fs.unlink(tempPath);
      } catch {}
      throw new Error(`Failed to atomically write evidence to disk: ${err.message}`);
    }

    // Verify that the written file exists and matches the computed hash
    const writtenBytes = await fs.readFile(finalPath);
    const verifySha = EvidenceStorageService.computeSha256(writtenBytes);
    if (verifySha !== sha256) {
      // Hash mismatch on disk: purge immediately
      try {
        await fs.unlink(finalPath);
      } catch {}
      throw new Error(
        `Storage integrity failure: SHA-256 hash mismatch after writing evidence to disk.`
      );
    }

    return {
      evidenceId,
      storagePath: finalPath,
      sha256,
      fileSizeBytes: buffer.length,
    };
  }

  /**
   * Safely reads evidence from disk, returning parsed JSON without evaluating any HTML or JS.
   */
  async readEvidence(storagePath: string): Promise<{ data: any; rawString: string }> {
    const targetDir = path.resolve(this.baseDir);
    const resolvedPath = path.resolve(storagePath);

    if (!resolvedPath.startsWith(targetDir + path.sep)) {
      throw new Error("Security violation: Attempted to read file outside evidence storage directory.");
    }

    const content = await fs.readFile(resolvedPath, "utf-8");
    const data = JSON.parse(content);
    return { data, rawString: content };
  }

  /**
   * Deletes evidence file from disk.
   */
  async deleteEvidence(storagePath: string): Promise<void> {
    const targetDir = path.resolve(this.baseDir);
    const resolvedPath = path.resolve(storagePath);

    if (!resolvedPath.startsWith(targetDir + path.sep)) {
      throw new Error("Security violation: Attempted to delete file outside evidence storage directory.");
    }

    try {
      await fs.unlink(resolvedPath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }
  }

  /**
   * Rollback helper for transaction failures.
   */
  async rollbackEvidence(storagePath: string | null | undefined): Promise<void> {
    if (!storagePath) return;
    try {
      await this.deleteEvidence(storagePath);
    } catch {}
  }
}

// Default singleton instance
export const evidenceStorage = new EvidenceStorageService();
