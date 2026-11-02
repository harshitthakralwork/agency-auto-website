import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import { db } from "../src/lib/db";
import { FrameManifestManager } from "../src/modules/cinematic/frames/manifest";
import { FrameCache } from "../src/modules/cinematic/canvas/cache";
import { VideoInspector } from "../src/modules/cinematic/video/inspector";
import { VideoFrameExtractor } from "../src/modules/cinematic/video/extractor";
import { VideoProcessingQueue } from "../src/modules/cinematic/video/queue";
import { CINEMATIC_PATTERNS } from "../src/modules/cinematic/registry";
import { defaultPerformanceBudget, isMobileDevice } from "../src/modules/cinematic/performance";
import { shouldReduceMotion } from "../src/modules/cinematic/accessibility";
import { FrameManifest } from "../src/modules/cinematic/types";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runCinematicEngineTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 2.3 VERIFICATION  ");
  console.log("  (Complete Cinematic Experience Engine)         ");
  console.log("=================================================\n");

  const testProjectSlug = "test-cinematic-project-" + Date.now();
  let testProject: any = null;
  let testVideoPath = "";
  let testVideoAsset: any = null;

  try {
    // -------------------------------------------------------------------
    // 1. Cinematic Registry & Patterns
    // -------------------------------------------------------------------
    console.log("--- 1. Testing Cinematic Registry & Reusable Patterns ---");
    assert(CINEMATIC_PATTERNS.length >= 6, "All 6 required cinematic patterns are registered");
    const patternIds = CINEMATIC_PATTERNS.map((p) => p.id);
    assert(patternIds.includes("scroll-reveal"), "Pattern 'scroll-reveal' is registered");
    assert(patternIds.includes("pinned-story"), "Pattern 'pinned-story' is registered");
    assert(patternIds.includes("parallax-layer"), "Pattern 'parallax-layer' is registered");
    assert(patternIds.includes("text-storytelling"), "Pattern 'text-storytelling' is registered");
    assert(patternIds.includes("horizontal-gallery"), "Pattern 'horizontal-gallery' is registered");
    assert(patternIds.includes("canvas-frame-sequence"), "Pattern 'canvas-frame-sequence' is registered");

    // -------------------------------------------------------------------
    // 2. Performance & Accessibility Systems
    // -------------------------------------------------------------------
    console.log("\n--- 2. Testing Performance Budgets & Accessibility Defaults ---");
    assert(defaultPerformanceBudget.maxFrameCacheCapacity === 40, "Frame cache capacity bounded to 40 frames");
    assert(defaultPerformanceBudget.maxDpr === 2, "Max DPR clamped to 2 for high-DPI memory protection");
    assert(defaultPerformanceBudget.enableHardwareAcceleration === true, "Hardware acceleration enabled");
    assert(typeof isMobileDevice() === "boolean", "Mobile device detection returns valid boolean");
    assert(typeof shouldReduceMotion() === "boolean", "Reduced motion detector returns valid boolean");

    // -------------------------------------------------------------------
    // 3. Frame Manifest Engine (Validation, Serialization & Load)
    // -------------------------------------------------------------------
    console.log("\n--- 3. Testing Frame Manifest Engine & Boundary Checks ---");
    const validManifest: FrameManifest = {
      version: "1.0",
      id: "manifest-test-01",
      projectId: "proj-123",
      sourceVideoName: "showcase.mp4",
      fps: 24,
      frameCount: 3,
      duration: 1.5,
      width: 1920,
      height: 1080,
      format: "webp",
      fitMode: "cover",
      frames: [
        { index: 0, url: "/uploads/frames/f_0000.webp", filename: "f_0000.webp" },
        { index: 1, url: "/uploads/frames/f_0001.webp", filename: "f_0001.webp" },
        { index: 2, url: "/uploads/frames/f_0002.webp", filename: "f_0002.webp" },
      ],
      createdAt: new Date().toISOString(),
    };

    const validCheck = FrameManifestManager.validate(validManifest);
    assert(validCheck.valid === true, "Valid manifest passes validation");

    const invalidVersion = { ...validManifest, version: "2.0" };
    assert(FrameManifestManager.validate(invalidVersion).valid === false, "Invalid manifest version is rejected");

    const countMismatch = { ...validManifest, frameCount: 10 };
    assert(FrameManifestManager.validate(countMismatch).valid === false, "Frame count mismatch is rejected");

    const outOfOrder = {
      ...validManifest,
      frames: [
        { index: 1, url: "/uploads/frames/f_0001.webp", filename: "f_0001.webp" },
        { index: 0, url: "/uploads/frames/f_0000.webp", filename: "f_0000.webp" },
        { index: 2, url: "/uploads/frames/f_0002.webp", filename: "f_0002.webp" },
      ],
    };
    assert(FrameManifestManager.validate(outOfOrder).valid === false, "Out-of-order frame indices are rejected");

    // Save and load manifest from disk
    const testFramesDir = path.resolve(process.cwd(), "public", "uploads", "test_frames_manifest");
    const { manifestPath, manifestUrl } = await FrameManifestManager.saveManifest(testFramesDir, validManifest);
    assert(manifestUrl.includes("/uploads/test_frames_manifest/manifest.json"), "Manifest URL formatted with forward slashes");

    const loadedManifest = await FrameManifestManager.loadManifest(manifestPath);
    assert(loadedManifest.id === "manifest-test-01", "Persisted manifest reloaded with matching ID");
    assert(loadedManifest.frames.length === 3, "Persisted manifest reloaded all 3 frames");
    await fs.rm(testFramesDir, { recursive: true, force: true });

    // -------------------------------------------------------------------
    // 4. Frame Cache Engine & Eviction
    // -------------------------------------------------------------------
    console.log("\n--- 4. Testing Frame Cache Engine & LRU Eviction ---");
    const cache = new FrameCache(3); // Small capacity of 3
    cache.set(0, { src: "frame0" } as any);
    cache.set(1, { src: "frame1" } as any);
    cache.set(2, { src: "frame2" } as any);
    assert(cache.has(0) && cache.has(1) && cache.has(2), "Initial 3 frames cached");

    // Adding 4th frame should evict oldest (0)
    cache.set(3, { src: "frame3" } as any);
    assert(!cache.has(0), "Oldest frame 0 evicted after reaching capacity");
    assert(cache.has(1) && cache.has(2) && cache.has(3), "Frames 1, 2, 3 remain in cache");

    // Accessing frame 1 refreshes it in LRU
    cache.get(1);
    // Adding frame 4 should now evict 2 (since 1 was refreshed)
    cache.set(4, { src: "frame4" } as any);
    assert(!cache.has(2), "Frame 2 evicted as LRU after frame 1 was refreshed");
    assert(cache.has(1) && cache.has(4), "Refreshed frame 1 and new frame 4 exist in cache");
    cache.clear();

    // -------------------------------------------------------------------
    // 5. Setup Project & Synthetic Video via FFmpeg
    // -------------------------------------------------------------------
    console.log("\n--- 5. Generating Synthetic Test Video with FFmpeg & SQLite Fixtures ---");
    testProject = await db.project.create({
      data: {
        name: "Cinematic Luxury Hotel",
        slug: testProjectSlug,
        category: "hotels-banquets",
        experienceLevel: "CINEMATIC",
        services: "Fine Dining, Presidential Suites, Banquet Halls",
        designConfig: {
          create: {
            experienceLevel: "CINEMATIC",
            preset: "luxury",
            animationIntensity: "cinematic",
            enableCanvasFx: true,
          },
        },
      },
      include: { designConfig: true },
    });
    assert(!!testProject.id, "Test project created in SQLite with CINEMATIC tier");

    const projectUploadsDir = path.resolve(process.cwd(), "public", "uploads", "projects", testProject.id);
    await fs.mkdir(projectUploadsDir, { recursive: true });
    testVideoPath = path.join(projectUploadsDir, "test_render.mp4");

    // Generate a 1-second 30fps 640x360 synthetic MP4 video using ffmpeg
    execSync(
      `ffmpeg -y -f lavfi -i testsrc=duration=1:size=640x360:rate=24 -c:v libx264 -pix_fmt yuv420p "${testVideoPath}"`,
      { stdio: "ignore" }
    );
    const videoStats = await fs.stat(testVideoPath);
    assert(videoStats.size > 1000, `Synthetic test MP4 video generated with FFmpeg (${videoStats.size} bytes)`);

    testVideoAsset = await db.projectAsset.create({
      data: {
        projectId: testProject.id,
        name: "Grand Suite Aerial Video",
        fileName: "test_render.mp4",
        fileUrl: `/uploads/projects/${testProject.id}/test_render.mp4`,
        filePath: testVideoPath,
        mimeType: "video/mp4",
        fileSize: videoStats.size,
        assetType: "VIDEO",
        assignedSlot: "HERO_BACKGROUND",
      },
    });
    assert(!!testVideoAsset.id, "Video asset fixture stored in SQLite ProjectAsset");

    // -------------------------------------------------------------------
    // 6. FFprobe Video Inspector Validation
    // -------------------------------------------------------------------
    console.log("\n--- 6. Testing FFprobe Video Inspector ---");
    const inspected = await VideoInspector.inspect(testVideoPath);
    assert(inspected.duration >= 0.9 && inspected.duration <= 1.2, `Inspected duration is accurate (${inspected.duration}s)`);
    assert(inspected.width === 640 && inspected.height === 360, `Inspected dimensions are accurate (${inspected.width}x${inspected.height})`);
    assert(inspected.fps === 24, `Inspected frame rate is 24 fps`);
    assert(inspected.codec === "h264", `Inspected codec is h264`);

    // Test rejection of non-video file
    let rejectedNonVideo = false;
    try {
      await VideoInspector.inspect(__filename);
    } catch {
      rejectedNonVideo = true;
    }
    assert(rejectedNonVideo === true, "FFprobe cleanly rejects non-video files");

    // -------------------------------------------------------------------
    // 7. Video Frame Extractor & Sharp WebP Optimization
    // -------------------------------------------------------------------
    console.log("\n--- 7. Testing Video Frame Extractor & WebP Optimization Pipeline ---");
    const extractionJobId = "job_test_01";
    let progressReported = 0;

    const extractionResult = await VideoFrameExtractor.extract(
      extractionJobId,
      {
        projectId: testProject.id,
        videoId: testVideoAsset.id,
        videoFilePath: testVideoAsset.filePath,
        videoFileName: testVideoAsset.fileName,
        videoUrl: testVideoAsset.fileUrl,
        targetFps: 12,
        maxFrames: 15,
        quality: "high",
        outputFormat: "webp",
      },
      (p) => {
        progressReported = p;
      }
    );

    assert(progressReported === 100, `Extraction progress reported all the way to 100%`);
    assert(extractionResult.frameCount >= 10, `Extracted ${extractionResult.frameCount} frames successfully`);
    assert(extractionResult.manifestUrl.includes("manifest.json"), "Extraction generated manifest.json URL");
    assert(await fs.stat(extractionResult.manifestPath).then(() => true).catch(() => false), "Manifest physically exists on disk");
    assert(!!extractionResult.posterUrl, "Extraction generated poster.webp fallback");

    // Verify frames are real valid WebP files
    const manifestOnDisk = await FrameManifestManager.loadManifest(extractionResult.manifestPath);
    assert(manifestOnDisk.frames.length === extractionResult.frameCount, "Manifest frame count matches extraction result");

    const firstFrameWebPath = manifestOnDisk.frames[0].url.replace(/^\//, "");
    const firstFrameDiskPath = path.resolve(process.cwd(), "public", firstFrameWebPath);
    const frameStats = await fs.stat(firstFrameDiskPath);
    assert(frameStats.size > 200, `Extracted WebP frame physically verified (${frameStats.size} bytes)`);

    // Path traversal rejection test in extractor
    let traversalRejected = false;
    try {
      await VideoFrameExtractor.extract("../../evil", {
        projectId: testProject.id,
        videoId: testVideoAsset.id,
        videoFilePath: testVideoAsset.filePath,
        videoFileName: testVideoAsset.fileName,
        videoUrl: testVideoAsset.fileUrl,
      });
    } catch {
      traversalRejected = true;
    }
    assert(traversalRejected === true, "Path traversal attempt in job ID cleanly rejected");

    // -------------------------------------------------------------------
    // 8. Persistent SQLite Video Processing Queue Lifecycle
    // -------------------------------------------------------------------
    console.log("\n--- 8. Testing Persistent Video Processing Queue (SQLite) ---");
    const queueJobId = await VideoProcessingQueue.createJob(testProject.id, testVideoAsset.id, {
      targetFps: 12,
      maxFrames: 10,
      quality: "high",
    });

    assert(typeof queueJobId === "string" && queueJobId.length > 5, "Job created and queued in SQLite queue");

    // Poll until completed
    let attempts = 0;
    let finalJob: any = null;
    while (attempts < 30) {
      await new Promise((r) => setTimeout(r, 500));
      finalJob = await VideoProcessingQueue.getJob(queueJobId, testProject.id);
      if (finalJob?.status === "COMPLETED" || finalJob?.status === "FAILED") {
        break;
      }
      attempts++;
    }

    assert(finalJob?.status === "COMPLETED", `Background queue completed job with status: ${finalJob?.status}`);
    assert(Math.round(finalJob?.progress || 0) === 100, `Background queue reported 100% completion progress (actual: ${finalJob?.progress})`);
    assert(!!finalJob?.manifestUrl, "Background queue saved manifest URL to database");

    // Verify ProjectAsset for Frame Sequence was created
    const sequenceAsset = await db.projectAsset.findFirst({
      where: {
        projectId: testProject.id,
        assetType: "FRAME_SEQUENCE",
      },
    });
    assert(!!sequenceAsset, "ProjectAsset with assetType 'FRAME_SEQUENCE' created in SQLite");
    assert(sequenceAsset?.assignedSlot === "CANVAS_HERO_SEQUENCE", "Frame Sequence assigned to 'CANVAS_HERO_SEQUENCE' slot");

    // Project isolation check: getting job through different project returns null
    const crossProjectJob = await VideoProcessingQueue.getJob(queueJobId, "different-project-id");
    assert(crossProjectJob === null, "Cross-project access to video jobs strictly isolated");

    // Cancel / Delete Job
    await VideoProcessingQueue.deleteJob(queueJobId, testProject.id);
    const deletedJob = await VideoProcessingQueue.getJob(queueJobId, testProject.id);
    assert(deletedJob === null, "Deleted job cleanly removed from database");

    // -------------------------------------------------------------------
    // 9. Testing Stale-Job Crash Recovery & Safe Retry Limits
    // -------------------------------------------------------------------
    console.log("\n--- 9. Testing Stale Job Crash Recovery & Max Retries ---");
    // Simulate a crash leaving a job in PROCESSING state
    const crashJob = await db.videoProcessingJob.create({
      data: {
        projectId: testProject.id,
        videoAssetId: testVideoAsset.id,
        status: "PROCESSING",
        progress: 35.0,
        retryCount: 0,
      },
    });

    const recoveredCount = await VideoProcessingQueue.recoverStaleJobs();
    assert(recoveredCount >= 1, "Startup recovery detected and reclaimed orphaned PROCESSING job");

    const recoveredJob = await db.videoProcessingJob.findUnique({
      where: { id: crashJob.id },
    });
    assert(recoveredJob?.status === "QUEUED", "Recovered job reset to QUEUED for worker pickup");
    assert(recoveredJob?.retryCount === 1, "Recovered job incremented retryCount to 1");

    // Simulate second crash with retryCount = 2 (exceeding limit)
    await db.videoProcessingJob.update({
      where: { id: crashJob.id },
      data: { status: "PROCESSING", retryCount: 2 },
    });

    await VideoProcessingQueue.recoverStaleJobs();
    const finalExceededJob = await db.videoProcessingJob.findUnique({
      where: { id: crashJob.id },
    });
    assert(finalExceededJob?.status === "FAILED", "Job exceeding max retries marked as FAILED");
    assert(finalExceededJob?.errorMessage?.includes("max retries exceeded") === true, "Failure message explicitly reports max retries exceeded");

    // Clean up crash test job
    await db.videoProcessingJob.delete({ where: { id: crashJob.id } });

    // -------------------------------------------------------------------
    // 10. Testing Real OS Process Cancellation
    // -------------------------------------------------------------------
    console.log("\n--- 10. Testing Real Process Cancellation & Directory Purge ---");
    const cancelTestJobId = await VideoProcessingQueue.createJob(testProject.id, testVideoAsset.id, {
      targetFps: 24,
      maxFrames: 60,
    });

    // Cancel immediately while queued or starting
    await VideoProcessingQueue.cancelJob(cancelTestJobId, testProject.id);
    const cancelledJob = await VideoProcessingQueue.getJob(cancelTestJobId, testProject.id);
    assert(cancelledJob?.status === "CANCELLED", "Job status updated to CANCELLED");

    const partialDir = path.resolve(process.cwd(), "public", "uploads", "projects", testProject.id, "frames", cancelTestJobId);
    const dirExists = await fs.stat(partialDir).then(() => true).catch(() => false);
    assert(!dirExists, "Partial extraction directory completely purged upon cancellation");
    await db.videoProcessingJob.delete({ where: { id: cancelTestJobId } });

    console.log("\n=================================================");
    console.log(`  CINEMATIC ENGINE VERIFICATION: ${passedCount}/${totalCount} TESTS PASSED`);
    console.log("=================================================");
  } finally {
    // Clean up test project and directory
    if (testProject) {
      try {
        await db.project.delete({ where: { id: testProject.id } });
        const pDir = path.resolve(process.cwd(), "public", "uploads", "projects", testProject.id);
        await fs.rm(pDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

runCinematicEngineTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

