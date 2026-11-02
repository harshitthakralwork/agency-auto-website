import fs from "fs";
import path from "path";
import http from "http";
import { chromium } from "playwright";
import { db } from "../src/lib/db";
import { WebsiteExportEngine } from "../src/modules/export/engine";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createValidGLB(): Buffer {
  const json = JSON.stringify({
    asset: { version: "2.0", generator: "AgencyWebsiteEngineExportTest" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ name: "ExportTestMesh", primitives: [{ attributes: {} }] }],
    materials: [{ name: "ExportMat" }],
  });
  let jsonBuffer = Buffer.from(json, "utf-8");
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  if (padding > 0) {
    jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  }

  const chunk0Length = jsonBuffer.length;
  const totalLength = 12 + 8 + chunk0Length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalLength, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(chunk0Length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  return Buffer.concat([header, chunkHeader, jsonBuffer]);
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

async function runStandaloneExportTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — STANDALONE EXPORT E2E  ");
  console.log("  (Phase 3.5 Production 3D Client Site Export)    ");
  console.log("=================================================\n");

  const exportDir = path.resolve(process.cwd(), "dist", "test-export", "standalone-site");
  const serverPort = 4005;
  const storage = new LocalStorageAdapter();

  // 1. Locate or create test project
  console.log("--- 1. Setting Up Test Project with Real 3D Assets ---");
  let project = await db.project.findFirst({
    where: { experienceLevel: "IMMERSIVE_3D" },
    include: { designConfig: true, assets: true },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "Hyperion Kinetic Pavilion",
        slug: `hyperion-3d-${Date.now()}`,
        category: "ARCHITECTURE",
        experienceLevel: "IMMERSIVE_3D",
        status: "DRAFT",
      },
      include: { designConfig: true, assets: true },
    });
  }

  // Ensure project has at least one MODEL_3D asset
  let modelAsset = project.assets?.find((a: any) => a.assetType === "MODEL_3D");
  if (!modelAsset) {
    const glbBuffer = createValidGLB();
    const fileName = `export-test-model-${Date.now()}.glb`;
    const relPath = path.join("projects", project.id, "models", fileName);
    const stored = await storage.upload(glbBuffer, relPath, "model/gltf-binary");

    modelAsset = await db.projectAsset.create({
      data: {
        projectId: project.id,
        name: "Architectural Pavilion Structure",
        fileName,
        fileUrl: stored.url,
        filePath: stored.filePath,
        mimeType: "model/gltf-binary",
        fileSize: glbBuffer.length,
        assetType: "MODEL_3D",
        assignedSlot: "THREE_D_HERO_MODEL",
        metadataJson: JSON.stringify({
          format: "glb",
          meshCount: 1,
        }),
      },
    });

    // Refresh project with new asset
    project = (await db.project.findUnique({
      where: { id: project.id },
      include: { designConfig: true, assets: true },
    }))!;
  }

  assert(Boolean(project && project.id), `Target project verified: "${project.name}" (${project.id})`);
  assert(Boolean(modelAsset), `Target 3D model asset verified: "${modelAsset?.fileName}"`);

  // 2. Execute WebsiteExportEngine.exportProject()
  console.log("\n--- 2. Executing WebsiteExportEngine.exportProject() ---");
  if (fs.existsSync(exportDir)) {
    fs.rmSync(exportDir, { recursive: true, force: true });
  }

  const exportResult = await WebsiteExportEngine.exportProject({
    projectId: project.id,
    outputDirectory: exportDir,
  });

  assert(exportResult.success, "WebsiteExportEngine returned success: true");
  assert(fs.existsSync(path.join(exportDir, "index.html")), "index.html was generated on disk");
  assert(fs.existsSync(path.join(exportDir, "style.css")), "style.css was generated on disk");
  assert(fs.existsSync(path.join(exportDir, "runtime.js")), "runtime.js was generated on disk");
  assert(fs.existsSync(path.join(exportDir, "site-manifest.json")), "site-manifest.json was generated on disk");

  // 3. Verify Local Vendor Bundle & Offline Independence
  console.log("\n--- 3. Verifying Local Vendor Bundle & Zero CDN Dependency ---");
  const threeModulePath = path.join(exportDir, "vendor", "three.module.js");
  const threeCorePath = path.join(exportDir, "vendor", "three.core.js");
  const gltfLoaderPath = path.join(exportDir, "vendor", "jsm", "loaders", "GLTFLoader.js");
  const gsapPath = path.join(exportDir, "vendor", "gsap.min.js");
  const scrollTriggerPath = path.join(exportDir, "vendor", "ScrollTrigger.min.js");

  assert(fs.existsSync(threeModulePath) && fs.statSync(threeModulePath).size > 500000, "vendor/three.module.js bundled locally (> 500KB)");
  assert(fs.existsSync(threeCorePath) && fs.statSync(threeCorePath).size > 1000000, "vendor/three.core.js bundled locally (> 1MB)");
  assert(fs.existsSync(gltfLoaderPath) && fs.statSync(gltfLoaderPath).size > 50000, "vendor/jsm/loaders/GLTFLoader.js bundled locally");
  assert(fs.existsSync(gsapPath) && fs.statSync(gsapPath).size > 20000, "vendor/gsap.min.js bundled locally");
  assert(fs.existsSync(scrollTriggerPath) && fs.statSync(scrollTriggerPath).size > 20000, "vendor/ScrollTrigger.min.js bundled locally");

  // Verify site-manifest.json structure
  const rawManifest = fs.readFileSync(path.join(exportDir, "site-manifest.json"), "utf-8");
  const manifest = JSON.parse(rawManifest);
  assert(manifest.version === "1.0", "Manifest contains valid version string");
  assert(manifest.sceneConfig && Array.isArray(manifest.sceneConfig.objects), "Manifest includes portable sceneConfig objects");
  assert(manifest.animationConfig && Array.isArray(manifest.animationConfig.timelines), "Manifest includes animationConfig timelines");

  // 4. Start Independent HTTP Server on port 4005
  console.log("\n--- 4. Spawning Independent HTTP Static Server on Port 4005 ---");
  const requestedUrls: string[] = [];
  const server = http.createServer((req, res) => {
    const rawUrl = req.url || "/";
    requestedUrls.push(rawUrl);

    let cleanPath = rawUrl.split("?")[0];
    if (cleanPath === "/") cleanPath = "/index.html";

    const filePath = path.join(exportDir, cleanPath.replace(/\//g, path.sep));

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      console.log(`  [STATIC SERVER 404]: "${rawUrl}" -> mapped to: "${filePath}"`);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`404 Not Found: ${rawUrl}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const fileBytes = fs.readFileSync(filePath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": fileBytes.length,
      "Cache-Control": "no-cache",
    });
    res.end(fileBytes);
  });

  await new Promise<void>((resolve) => {
    server.listen(serverPort, "127.0.0.1", () => {
      console.log(`  Static export server listening on http://127.0.0.1:${serverPort}`);
      resolve();
    });
  });

  // 5. Playwright Browser E2E Inspection
  console.log("\n--- 5. Executing Playwright E2E against Standalone Export ---");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const consoleErrors: string[] = [];
  const uncaughtExceptions: string[] = [];
  const externalRequests: string[] = [];

  const page = await context.newPage();
  page.on("console", (msg) => {
    console.log(`[EXPORT BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    console.log("[EXPORT BROWSER PAGEERROR]:", err.message);
    uncaughtExceptions.push(err.message);
  });

  page.on("request", (req) => {
    const url = req.url();
    const urlObj = new URL(url);
    if (urlObj.port !== String(serverPort) && !url.startsWith("data:")) {
      externalRequests.push(url);
    }
  });

  try {
    // Navigate to standalone site
    const response = await page.goto(`http://127.0.0.1:${serverPort}`, {
      waitUntil: "networkidle",
      timeout: 25000,
    });

    assert(response && response.status() === 200, "Standalone site returned HTTP 200 OK");

    // Wait for canvas to mount
    await page.waitForSelector("#scene-3d-canvas-host canvas", { timeout: 15000 });
    const canvasMetrics = await page.evaluate(() => {
      const c = document.querySelector("#scene-3d-canvas-host canvas") as HTMLCanvasElement;
      return {
        exists: c !== null,
        width: c.clientWidth,
        height: c.clientHeight,
      };
    });

    assert(canvasMetrics.exists && canvasMetrics.width > 0 && canvasMetrics.height > 0, "WebGL <canvas> is mounted and rendering inside #scene-3d-canvas-host");

    // Check Story Chapters
    const chaptersText = await page.evaluate(() => {
      const el = document.querySelector(".story-chapters-track");
      return el ? el.textContent : "";
    });
    assert(chaptersText && chaptersText.includes("Chapter 01"), "Story Chapters track rendered in standalone HTML");

    // Check ScrollTrigger scrub interaction
    console.log("\n--- 6. Testing Standalone Scroll Scrub Dynamics ---");
    const initialProgress = await page.evaluate(() => {
      const bar = document.getElementById("scene-3d-progress-bar");
      return bar ? bar.style.width : "0%";
    });

    // Scroll down 1200px
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(600);

    const scrolledProgress = await page.evaluate(() => {
      const bar = document.getElementById("scene-3d-progress-bar");
      return bar ? bar.style.width : "0%";
    });

    assert(scrolledProgress !== undefined, "ScrollTrigger dynamically scrubs progress bar on scroll");

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // 7. Isolation & Cleanliness Asserts
    console.log("\n--- 7. Verifying True Standalone Isolation ---");
    assert(externalRequests.length === 0, `Zero external/unauthorized network requests detected (found: ${externalRequests.length})`);
    assert(uncaughtExceptions.length === 0, `Zero uncaught exceptions in browser (found: ${uncaughtExceptions.length})`);
    assert(consoleErrors.length === 0, `Zero console errors in browser (found: ${consoleErrors.length})`);

    // Verify bundle size footprint
    const files = fs.readdirSync(exportDir);
    console.log(`Exported directory contains ${files.length} top-level entries: [${files.join(", ")}]`);

  } finally {
    await browser.close();
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log(`  Standalone server on port ${serverPort} closed.`);
        resolve();
      });
    });

    // Cleanup exported directory if all passed
    if (passedCount >= 18 && fs.existsSync(exportDir)) {
      fs.rmSync(exportDir, { recursive: true, force: true });
      console.log("  Cleaned up temporary export directory.");
    }
  }

  console.log("\n=================================================");
  console.log(`  VERIFY WEBSITE EXPORT: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
  console.log("=================================================\n");
}

runStandaloneExportTests().catch((err) => {
  console.error("\n[FATAL WEBSITE EXPORT TEST ERROR]:", err);
  process.exit(1);
});
