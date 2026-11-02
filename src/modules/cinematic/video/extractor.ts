import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { VideoInspector } from "./inspector";
import { FrameManifestManager } from "../frames/manifest";
import { FrameManifest, FrameManifestItem, VideoExtractionOptions } from "../types";

export interface ExtractionResult {
  jobId: string;
  projectId: string;
  frameCount: number;
  duration: number;
  width: number;
  height: number;
  fps: number;
  manifestPath: string;
  manifestUrl: string;
  posterUrl?: string;
}

export class VideoFrameExtractor {
  private static activeCommands: Map<string, ffmpeg.FfmpegCommand> = new Map();
  private static abortedJobs: Set<string> = new Set();

  static abort(jobId: string): boolean {
    this.abortedJobs.add(jobId);
    const cmd = this.activeCommands.get(jobId);
    if (cmd) {
      try {
        const pid = (cmd as any).ffmpegProc?.pid;
        if (pid) {
          if (process.platform === "win32") {
            try {
              const { execSync } = require("child_process");
              execSync(`taskkill /F /T /PID ${pid} 2>nul`);
            } catch {}
          } else {
            try {
              process.kill(-pid, "SIGKILL");
            } catch {
              try {
                process.kill(pid, "SIGKILL");
              } catch {}
            }
          }
        }
        cmd.kill("SIGKILL");
      } catch {}
      this.activeCommands.delete(jobId);
      return true;
    }
    return false;
  }

  static isAborted(jobId: string): boolean {
    return this.abortedJobs.has(jobId);
  }

  static clearAbort(jobId: string): void {
    this.abortedJobs.delete(jobId);
  }

  static async extract(
    jobId: string,
    options: VideoExtractionOptions,
    onProgress?: (progress: number) => void
  ): Promise<ExtractionResult> {
    const { projectId, videoFilePath, videoFileName, videoUrl } = options;

    // Strict boundary validation
    const uploadsBase = path.resolve(process.cwd(), "public", "uploads");

    if (
      !projectId ||
      !jobId ||
      projectId.includes("..") ||
      projectId.includes("/") ||
      projectId.includes("\\") ||
      jobId.includes("..") ||
      jobId.includes("/") ||
      jobId.includes("\\")
    ) {
      throw new Error("Invalid project ID or job ID: Directory traversal characters rejected");
    }

    const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");

    const outputDir = path.resolve(uploadsBase, "projects", safeProjectId, "frames", safeJobId);
    if (!outputDir.startsWith(uploadsBase + path.sep)) {
      throw new Error("Security violation: Target directory outside uploads boundary");
    }

    const tempDir = path.resolve(outputDir, "temp_raw");

    // Clean / create directories
    await fs.rm(outputDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });

    VideoFrameExtractor.clearAbort(jobId);

    try {
      if (VideoFrameExtractor.isAborted(jobId)) {
        throw new Error("Job cancelled before start");
      }

      // 1. Inspect metadata
      const metadata = await VideoInspector.inspect(videoFilePath);
      if (VideoFrameExtractor.isAborted(jobId)) {
        throw new Error("Job cancelled during metadata inspection");
      }
      if (onProgress) onProgress(10);

      const targetFps = Math.min(Math.max(options.targetFps || 24, 1), 30);
      const maxFrames = Math.min(Math.max(options.maxFrames || 60, 10), 240);
      const qualitySetting = options.quality || "high";
      const qualityValue = qualitySetting === "high" ? 85 : qualitySetting === "medium" ? 75 : 60;

      // Calculate extraction rate
      const naturalFrames = Math.floor(metadata.duration * targetFps);
      const effectiveFps = naturalFrames > maxFrames ? maxFrames / metadata.duration : targetFps;

      // 2. FFmpeg frame extraction to temporary PNGs
      const rawPattern = path.join(tempDir, "raw_%05d.png");

      await new Promise<void>((resolve, reject) => {
        const cmd = ffmpeg(videoFilePath)
          .outputOptions([
            "-vf", `fps=${effectiveFps}`,
            "-vframes", String(maxFrames),
          ])
          .output(rawPattern)
          .on("progress", (p) => {
            let percent = p.percent;
            if (!percent && p.timemark && metadata.duration > 0) {
              const parts = p.timemark.split(":");
              if (parts.length === 3) {
                const secs = Number(parts[0]) * 3600 + Number(parts[1]) * 60 + parseFloat(parts[2]);
                percent = Math.min(100, (secs / metadata.duration) * 100);
              }
            }
            if (percent && onProgress) {
              // 10% to 50% for extraction
              const scaled = 10 + (percent * 0.4);
              onProgress(Math.min(Math.round(scaled), 50));
            }
          })
          .on("end", () => {
            VideoFrameExtractor.activeCommands.delete(jobId);
            resolve();
          })
          .on("error", (err) => {
            VideoFrameExtractor.activeCommands.delete(jobId);
            reject(new Error(`FFmpeg extraction failed: ${err.message}`));
          });

        VideoFrameExtractor.activeCommands.set(jobId, cmd);
        cmd.run();
      });

      if (onProgress) onProgress(55);

      // 3. Scan extracted raw frames
      const rawFiles = (await fs.readdir(tempDir))
        .filter((f) => f.endsWith(".png"))
        .sort();

      if (rawFiles.length === 0) {
        throw new Error("FFmpeg completed without generating any frames");
      }

      // 4. Optimize frames using Sharp into WebP
      const frames: FrameManifestItem[] = [];
      const total = rawFiles.length;

      for (let i = 0; i < total; i++) {
        if (VideoFrameExtractor.isAborted(jobId)) {
          throw new Error("Job cancelled during image optimization");
        }
        const rawFile = rawFiles[i];
        const rawPath = path.join(tempDir, rawFile);
        const webpFilename = `frame_${String(i).padStart(4, "0")}.webp`;
        const webpPath = path.join(outputDir, webpFilename);

        await sharp(rawPath)
          .webp({ quality: qualityValue, effort: 4 })
          .toFile(webpPath);

        const relativePart = path.relative(path.join(process.cwd(), "public"), webpPath);
        const webUrl = "/" + relativePart.split(path.sep).join("/");

        frames.push({
          index: i,
          url: webUrl,
          filename: webpFilename,
        });

        if (onProgress) {
          // 55% to 90% for optimization
          const optProgress = 55 + Math.round(((i + 1) / total) * 35);
          onProgress(optProgress);
        }
      }

      // 5. Generate poster from the first frame
      const posterFilename = "poster.webp";
      const posterPath = path.join(outputDir, posterFilename);
      await sharp(path.join(tempDir, rawFiles[0]))
        .webp({ quality: 85 })
        .toFile(posterPath);

      const posterRelative = path.relative(path.join(process.cwd(), "public"), posterPath);
      const posterUrl = "/" + posterRelative.split(path.sep).join("/");

      // 6. Clean up temporary uncompressed files
      await fs.rm(tempDir, { recursive: true, force: true });

      // 7. Write Manifest JSON
      const manifest: FrameManifest = {
        version: "1.0",
        id: jobId,
        projectId,
        sourceVideoName: videoFileName,
        sourceVideoUrl: videoUrl,
        fps: Math.round(effectiveFps),
        frameCount: frames.length,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        format: "webp",
        fitMode: "cover",
        posterUrl,
        frames,
        createdAt: new Date().toISOString(),
      };

      const { manifestPath, manifestUrl } = await FrameManifestManager.saveManifest(
        outputDir,
        manifest
      );

      if (onProgress) onProgress(100);

      return {
        jobId,
        projectId,
        frameCount: frames.length,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        fps: Math.round(effectiveFps),
        manifestPath,
        manifestUrl,
        posterUrl,
      };
    } catch (err) {
      // Clean up temporary and partial files on failure
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
      } catch {}
      throw err;
    } finally {
      VideoFrameExtractor.activeCommands.delete(jobId);
      VideoFrameExtractor.clearAbort(jobId);
    }
  }
}
