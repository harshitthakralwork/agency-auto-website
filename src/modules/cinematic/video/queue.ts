import path from "path";
import fs from "fs/promises";
import { db as prisma } from "@/lib/db";
import { VideoFrameExtractor } from "./extractor";
import { VideoExtractionOptions, VideoJobProgress } from "../types";

export class VideoProcessingQueue {
  private static MAX_CONCURRENT_JOBS = 1;
  private static activeJobs: Map<string, boolean> = new Map();
  private static isInitialized = false;
  private static isWorkerLoopRunning = false;
  private static isRecovering = false;

  private static STALE_JOB_TIMEOUT_MS = 60 * 1000; // 60 seconds without heartbeat

  /**
   * Initializes the queue and performs startup recovery on stale or orphaned jobs.
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    await this.recoverStaleJobs({ forceStartup: true });
  }

  /**
   * Periodic recovery sweep for stale jobs whose heartbeat expired.
   */
  static async sweepStaleJobs(): Promise<number> {
    return this.recoverStaleJobs({ forceStartup: false });
  }

  /**
   * Recovers jobs left in PROCESSING state from a previous server crash or dead worker.
   * Mutex lock and atomic conditional updates prevent concurrent recovery sweeps from duplicating execution.
   */
  static async recoverStaleJobs(options: { forceStartup?: boolean } = {}): Promise<number> {
    if (this.isRecovering) return 0;
    this.isRecovering = true;

    try {
      const staleThreshold = new Date(Date.now() - this.STALE_JOB_TIMEOUT_MS);

      // Query candidate jobs:
      // On startup (forceStartup = true), all PROCESSING jobs are orphans from the dead server.
      // In periodic sweeps, only jobs with null heartbeat or heartbeat older than threshold.
      const stuckJobs = await prisma.videoProcessingJob.findMany({
        where: {
          status: "PROCESSING",
          ...(options.forceStartup
            ? {}
            : {
                OR: [
                  { heartbeatAt: null },
                  { heartbeatAt: { lt: staleThreshold } },
                ],
              }),
        },
      });

      let recovered = 0;
      for (const job of stuckJobs) {
        // Guard: Do not touch jobs actively being executed by THIS running worker process
        if (!options.forceStartup && this.activeJobs.has(job.id)) {
          continue;
        }

        const isExceeded = job.retryCount >= 2;

        // Atomic claim: only succeed if the job is STILL in PROCESSING state
        const claim = await prisma.videoProcessingJob.updateMany({
          where: { id: job.id, status: "PROCESSING" },
          data: {
            status: isExceeded ? "FAILED" : "QUEUED",
            progress: 0.0,
            retryCount: { increment: 1 },
            heartbeatAt: null,
            errorMessage: isExceeded
              ? "Processing interrupted by server restart (max retries exceeded)"
              : null,
          },
        });

        if (claim.count === 0) {
          // Another recovery sweep or active worker claimed or updated this record
          continue;
        }

        // Clean up any abandoned partial files
        await this.cleanOrphanedFiles(job.projectId, job.id);
        recovered++;
      }

      if (recovered > 0) {
        this.triggerWorker();
      }

      return recovered;
    } catch (err) {
      console.error("Error during stale job recovery:", err);
      return 0;
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Enqueues a new video processing job into SQLite.
   */
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
    await this.initialize();

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

    // Trigger local worker to process queue
    this.triggerWorker();

    return job.id;
  }

  /**
   * Triggers the queue worker loop asynchronously.
   */
  private static triggerWorker(): void {
    if (this.isWorkerLoopRunning) return;
    setImmediate(() => {
      this.processNextJob().catch((err) => {
        console.error("Queue worker processNextJob error:", err);
      });
    });
  }

  /**
   * Atomically claims and processes the next QUEUED job within concurrency limits.
   */
  static async processNextJob(): Promise<boolean> {
    if (this.activeJobs.size >= this.MAX_CONCURRENT_JOBS) {
      return false;
    }

    this.isWorkerLoopRunning = true;

    try {
      // Find oldest QUEUED candidate
      let candidate: any = null;
      try {
        candidate = await prisma.videoProcessingJob.findFirst({
          where: { status: "QUEUED" },
          include: { videoAsset: true },
          orderBy: { createdAt: "asc" },
        });
      } catch {
        // If relation inconsistency occurs (e.g. asset unlinked in tests), purge dangling queued job
        await prisma.videoProcessingJob.deleteMany({
          where: { status: "QUEUED", videoAsset: null as any },
        }).catch(() => {});
        return false;
      }

      if (!candidate || !candidate.videoAsset) {
        if (candidate) {
          await prisma.videoProcessingJob.updateMany({
            where: { id: candidate.id },
            data: { status: "FAILED", errorMessage: "Missing linked video asset" },
          });
        }
        return false;
      }

      // Atomic claim: only succeed if status is still QUEUED
      const claim = await prisma.videoProcessingJob.updateMany({
        where: { id: candidate.id, status: "QUEUED" },
        data: {
          status: "PROCESSING",
          progress: 5.0,
          heartbeatAt: new Date(),
        },
      });

      if (claim.count === 0) {
        // Lost race to another worker or job was cancelled
        return false;
      }

      const jobId = candidate.id;
      this.activeJobs.set(jobId, true);

      // Execute claimed job
      await this.runClaimedJob(jobId, {
        projectId: candidate.projectId,
        videoId: candidate.videoAsset.id,
        videoFilePath: candidate.videoAsset.filePath,
        videoFileName: candidate.videoAsset.fileName,
        videoUrl: candidate.videoAsset.fileUrl,
        targetFps: candidate.targetFps,
        maxFrames: candidate.maxFrames,
        quality: candidate.quality as any,
        outputFormat: candidate.outputFormat as any,
      });

      return true;
    } finally {
      this.isWorkerLoopRunning = false;

      // Check if more jobs are waiting in queue
      const remainingQueued = await prisma.videoProcessingJob.count({
        where: { status: "QUEUED" },
      });
      if (remainingQueued > 0 && this.activeJobs.size < this.MAX_CONCURRENT_JOBS) {
        this.triggerWorker();
      }
    }
  }

  private static async runClaimedJob(
    jobId: string,
    options: VideoExtractionOptions
  ): Promise<void> {
    let heartbeatTimer: NodeJS.Timeout | null = null;

    try {
      // Update heartbeat every 10 seconds to indicate active worker life
      heartbeatTimer = setInterval(async () => {
        try {
          await prisma.videoProcessingJob.update({
            where: { id: jobId },
            data: { heartbeatAt: new Date() },
          });
        } catch {}
      }, 10000);

      const result = await VideoFrameExtractor.extract(jobId, options, async (progress) => {
        if (!this.activeJobs.has(jobId)) return;

        try {
          const updateRes = await prisma.videoProcessingJob.updateMany({
            where: { id: jobId, status: "PROCESSING" },
            data: { progress },
          });

          if (updateRes.count === 0) {
            // Job was cancelled, completed, or deleted
            VideoFrameExtractor.abort(jobId);
          }
        } catch {}
      });

      // Verify not cancelled or deleted
      const current = await prisma.videoProcessingJob.findUnique({
        where: { id: jobId },
      });

      if (!current || current.status === "CANCELLED") {
        await this.cleanOrphanedFiles(options.projectId, jobId);
        return;
      }

      // Mark completed only if status is still PROCESSING
      const completeRes = await prisma.videoProcessingJob.updateMany({
        where: { id: jobId, status: "PROCESSING" },
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

      if (completeRes.count === 0) {
        // Job was cancelled or deleted concurrently - do not create asset
        await this.cleanOrphanedFiles(options.projectId, jobId);
        return;
      }

      // Register Frame Sequence Asset
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
      console.error(`Job ${jobId} failed during execution:`, err);
      // Clean up partial frames
      await this.cleanOrphanedFiles(options.projectId, jobId);

      await prisma.videoProcessingJob.updateMany({
        where: { id: jobId, status: "PROCESSING" },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Unknown video processing error",
        },
      });
    } finally {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      this.activeJobs.delete(jobId);
    }
  }

  static async getJob(jobId: string, projectId: string): Promise<VideoJobProgress | null> {
    await this.initialize();

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
    await this.initialize();
    return prisma.videoProcessingJob.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Cancels a job: terminates the actual OS FFmpeg child process, updates database, and cleans up partial files.
   */
  static async cancelJob(jobId: string, projectId: string): Promise<void> {
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

    // 1. Immediately abort running FFmpeg OS process
    VideoFrameExtractor.abort(jobId);
    this.activeJobs.delete(jobId);

    // 2. Mark as CANCELLED in database
    await prisma.videoProcessingJob.updateMany({
      where: { id: jobId, projectId },
      data: { status: "CANCELLED" },
    });

    // 3. Clean up partial files
    await this.cleanOrphanedFiles(projectId, jobId);

    // 4. Trigger queue worker to process any waiting jobs
    this.triggerWorker();
  }

  /**
   * Cancels all queued or actively processing jobs for a project.
   * Ensures no background workers continue executing or writing files after project deletion.
   */
  static async cancelProjectJobs(projectId: string): Promise<void> {
    if (!projectId || projectId.includes("..") || projectId.includes("/") || projectId.includes("\\")) {
      return;
    }

    const activeJobs = await prisma.videoProcessingJob.findMany({
      where: {
        projectId,
        status: { in: ["QUEUED", "PROCESSING"] },
      },
      select: { id: true },
    });

    for (const job of activeJobs) {
      try {
        await this.cancelJob(job.id, projectId);
      } catch {}
    }
  }

  static async deleteJob(jobId: string, projectId: string): Promise<void> {
    await this.cancelJob(jobId, projectId);
    await prisma.videoProcessingJob.deleteMany({
      where: { id: jobId, projectId },
    });
  }

  private static async cleanOrphanedFiles(projectId: string, jobId: string): Promise<void> {
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
}
