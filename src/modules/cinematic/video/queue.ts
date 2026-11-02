import path from "path";
import fs from "fs/promises";
import { db as prisma } from "@/lib/db";
import { VideoFrameExtractor } from "./extractor";
import { VideoExtractionOptions, VideoJobProgress } from "../types";

export class VideoProcessingQueue {
  private static activeJobs: Map<string, boolean> = new Map();

  static async createJob(
    projectId: string,
    videoAssetId: string,
    options: {
      targetFps?: number;
      maxFrames?: number;
      quality?: "low" | "medium" | "high";
      outputFormat?: "webp" | "jpg" | "png";
    } = {}
  ): Promise<string> {
    const videoAsset = await prisma.projectAsset.findFirst({
      where: { id: videoAssetId, projectId },
    });

    if (!videoAsset) {
      throw new Error("Video asset not found for this project");
    }

    if (videoAsset.assetType !== "VIDEO") {
      throw new Error(`Asset is not a video (type: ${videoAsset.assetType})`);
    }

    const job = await prisma.videoProcessingJob.create({
      data: {
        projectId,
        videoAssetId,
        status: "QUEUED",
        progress: 0.0,
        targetFps: options.targetFps || 24,
        maxFrames: options.maxFrames || 60,
        quality: options.quality || "high",
        outputFormat: options.outputFormat || "webp",
      },
    });

    // Start processing in background (non-blocking)
    setImmediate(() => {
      this.executeJob(job.id, {
        projectId,
        videoId: videoAsset.id,
        videoFilePath: videoAsset.filePath,
        videoFileName: videoAsset.fileName,
        videoUrl: videoAsset.fileUrl,
        targetFps: job.targetFps,
        maxFrames: job.maxFrames,
        quality: job.quality as any,
        outputFormat: job.outputFormat as any,
      }).catch((err) => {
        console.error(`Background job ${job.id} failed:`, err);
      });
    });

    return job.id;
  }

  static async executeJob(jobId: string, options: VideoExtractionOptions): Promise<void> {
    this.activeJobs.set(jobId, true);

    try {
      await prisma.videoProcessingJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", progress: 5.0 },
      });

      const result = await VideoFrameExtractor.extract(jobId, options, async (progress) => {
        // Only update if not cancelled
        const isActive = this.activeJobs.get(jobId);
        if (!isActive) return;

        await prisma.videoProcessingJob.update({
          where: { id: jobId },
          data: { progress },
        });
      });

      // Check if job was cancelled during processing
      const checkCurrent = await prisma.videoProcessingJob.findUnique({
        where: { id: jobId },
      });

      if (checkCurrent?.status === "CANCELLED") {
        return;
      }

      // Mark completed in database
      await prisma.videoProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100.0,
          manifestUrl: result.manifestUrl,
          manifestPath: result.manifestPath,
          frameCount: result.frameCount,
          duration: result.duration,
          width: result.width,
          height: result.height,
        },
      });

      // Also create or update a ProjectAsset for the generated Frame Sequence Manifest
      await prisma.projectAsset.create({
        data: {
          projectId: options.projectId,
          name: `${options.videoFileName} Frame Sequence`,
          fileName: `manifest_${jobId}.json`,
          fileUrl: result.manifestUrl,
          filePath: result.manifestPath,
          mimeType: "application/json",
          fileSize: 1024,
          width: result.width,
          height: result.height,
          assetType: "FRAME_SEQUENCE",
          assignedSlot: "CANVAS_HERO_SEQUENCE",
          metadataJson: JSON.stringify({
            jobId,
            videoAssetId: options.videoId,
            frameCount: result.frameCount,
            fps: result.fps,
            posterUrl: result.posterUrl,
          }),
        },
      });
    } catch (err: any) {
      console.error(`Job ${jobId} execution error:`, err);
      await prisma.videoProcessingJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Unknown video processing error",
        },
      });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  static async getJob(jobId: string, projectId: string): Promise<VideoJobProgress | null> {
    const job = await prisma.videoProcessingJob.findFirst({
      where: { id: jobId, projectId },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      projectId: job.projectId,
      status: job.status as any,
      progress: job.progress,
      frameCount: job.frameCount || undefined,
      manifestUrl: job.manifestUrl || undefined,
      errorMessage: job.errorMessage || undefined,
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  static async listProjectJobs(projectId: string) {
    return prisma.videoProcessingJob.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  static async cancelJob(jobId: string, projectId: string): Promise<void> {
    this.activeJobs.delete(jobId);

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

    await prisma.videoProcessingJob.updateMany({
      where: { id: jobId, projectId },
      data: { status: "CANCELLED" },
    });

    // Clean up partial frames directory
    try {
      const safeProjectId = projectId.replace(/[^a-zA-Z0-9_-]/g, "");
      const safeJobId = jobId.replace(/[^a-zA-Z0-9_-]/g, "");
      const outputDir = path.resolve(
        process.cwd(),
        "public",
        "uploads",
        "projects",
        safeProjectId,
        "frames",
        safeJobId
      );
      await fs.rm(outputDir, { recursive: true, force: true });
    } catch {}
  }

  static async deleteJob(jobId: string, projectId: string): Promise<void> {
    await this.cancelJob(jobId, projectId);
    await prisma.videoProcessingJob.deleteMany({
      where: { id: jobId, projectId },
    });
  }
}
