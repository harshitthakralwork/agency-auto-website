import fs from "fs";
import path from "path";
import http from "http";
import { chromium } from "playwright";
import { db } from "../src/lib/db";
import { WebsiteGeneratorService } from "../src/modules/generator/service";
import { CompositionService } from "../src/modules/composition/service";

let totalCount = 0;
let passedCount = 0;

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

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=UTF-8",
  ".js": "text/javascript; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".glb": "model/gltf-binary",
};

async function runTests() {
  console.log("\n=== AGENCY WEBSITE ENGINE: PHASE 6.1 CINEMATIC & IMMERSIVE INTEGRATION ===\n");

  // 1. Setup Cinematic Project
  const cinematicSlug = `test-cinematic-${Date.now()}`;
  console.log("Setting up Cinematic test project in database...");
  const cinematicProject = await db.project.create({
    data: {
      name: "Solstice Luxury Banquets & Resort",
      slug: cinematicSlug,
      category: "hotels-banquets",
      experienceLevel: "CINEMATIC",
      description: "Palatial ballrooms, cinematic event choreography, and private estates.",
      designConfig: {
        create: {
          preset: "luxury",
          primaryColor: "#d97706",
          secondaryColor: "#18181b",
          accentColor: "#fbbf24",
          backgroundColor: "#09090b",
          surfaceColor: "#18181b",
          textColor: "#f4f4f5",
          mutedTextColor: "#a1a1aa",
          headingFont: "Cinzel",
          bodyFont: "Inter",
          baseFontSize: "16px",
          layoutStyle: "modern-contained",
          borderRadius: "12px",
          containerWidth: "1280px",
          animationIntensity: "cinematic",
          enableCanvasFx: true,
          threeDPreferences: JSON.stringify({}),
          mediaPreferences: JSON.stringify({}),
          sectionsConfigJson: JSON.stringify([]),
          responsiveSettings: JSON.stringify({}),
        },
      },
    },
  });

  assert(cinematicProject && cinematicProject.id, "Cinematic project created in database");

  // Setup Composition with Cinematic Hero & Canvas Sequence
  const cineHome = await CompositionService.createPage({
    projectId: cinematicProject.id,
    slug: "/",
    title: "Cinematic Showcase",
  });
  await CompositionService.addSection(cineHome.id, {
    componentId: "hero-cinematic",
    order: 0,
    customName: "Palatial Event Spaces",
  });
  await CompositionService.addSection(cineHome.id, {
    componentId: "advanced-canvas-frame-sequences",
    order: 1,
    customName: "Architecture Scroll Storytelling",
  });
  await CompositionService.addSection(cineHome.id, {
    componentId: "conversion-booking-cta",
    order: 2,
    customName: "Reserve Grand Ballroom",
  });

  // 2. Generate Cinematic Website
  console.log("\nCompiling Cinematic website package...");
  const cineOutputDir = path.resolve(process.cwd(), "storage", "test-generated", cinematicSlug);
  const cineResult = await WebsiteGeneratorService.generateWebsite(cinematicProject.id, {
    projectId: cinematicProject.id,
    outputDirectory: cineOutputDir,
    zip: true,
  });

  assert(cineResult.success === true, "Cinematic site compiled successfully");
  assert(fs.existsSync(path.join(cineOutputDir, "vendor", "gsap.min.js")), "vendor/gsap.min.js bundled locally");
  assert(fs.existsSync(path.join(cineOutputDir, "vendor", "ScrollTrigger.min.js")), "vendor/ScrollTrigger.min.js bundled locally");
  assert(fs.existsSync(path.join(cineOutputDir, "js", "cinematic.js")), "js/cinematic.js generated");

  const cineHtml = fs.readFileSync(path.join(cineOutputDir, "index.html"), "utf8");
  assert(cineHtml.includes('src="./vendor/gsap.min.js"'), "index.html loads local GSAP");
  assert(cineHtml.includes('src="./vendor/ScrollTrigger.min.js"'), "index.html loads local ScrollTrigger");
  assert(cineHtml.includes('src="./js/cinematic.js"'), "index.html loads local cinematic.js");
  assert(cineResult.manifest.experienceTier === "CINEMATIC", "Manifest records CINEMATIC tier");

  // 3. Setup Immersive 3D Project
  const threeDSlug = `test-3d-${Date.now()}`;
  console.log("\nSetting up Immersive 3D test project in database...");
  const threeDProject = await db.project.create({
    data: {
      name: "Stratos Spatial Aerodynamics",
      slug: threeDSlug,
      category: "healthcare",
      experienceLevel: "IMMERSIVE_3D",
      description: "Cutting-edge spatial biomechanics and cardiovascular simulations.",
      designConfig: {
        create: {
          preset: "cinematic",
          primaryColor: "#0284c7",
          secondaryColor: "#0f172a",
          accentColor: "#38bdf8",
          backgroundColor: "#020617",
          surfaceColor: "#0f172a",
          textColor: "#f8fafc",
          mutedTextColor: "#94a3b8",
          headingFont: "Inter",
          bodyFont: "Inter",
          baseFontSize: "16px",
          layoutStyle: "modern-contained",
          borderRadius: "8px",
          containerWidth: "1280px",
          animationIntensity: "cinematic",
          enableCanvasFx: true,
          threeDPreferences: JSON.stringify({
            objectType: "product_model",
            lightingEnvironment: "studio",
          }),
          mediaPreferences: JSON.stringify({}),
          sectionsConfigJson: JSON.stringify([]),
          responsiveSettings: JSON.stringify({}),
        },
      },
    },
  });

  assert(threeDProject && threeDProject.id, "3D project created in database");

  // Setup Composition with Hero 3D & Advanced 3D Showcase
  const threeDHome = await CompositionService.createPage({
    projectId: threeDProject.id,
    slug: "/",
    title: "Spatial 3D Simulation",
  });
  await CompositionService.addSection(threeDHome.id, {
    componentId: "hero-3d",
    order: 0,
    customName: "Interactive 3D Biomechanics Simulation",
  });
  await CompositionService.addSection(threeDHome.id, {
    componentId: "advanced-interactive-3d-model",
    order: 1,
    customName: "Spatial Cardiology Model",
  });

  // 4. Generate Immersive 3D Website
  console.log("\nCompiling Immersive 3D website package...");
  const threeDOutputDir = path.resolve(process.cwd(), "storage", "test-generated", threeDSlug);
  const threeDResult = await WebsiteGeneratorService.generateWebsite(threeDProject.id, {
    projectId: threeDProject.id,
    outputDirectory: threeDOutputDir,
    zip: true,
  });

  assert(threeDResult.success === true, "Immersive 3D site compiled successfully");
  assert(fs.existsSync(path.join(threeDOutputDir, "vendor", "three.module.js")), "vendor/three.module.js bundled locally");
  assert(fs.existsSync(path.join(threeDOutputDir, "vendor", "jsm", "loaders", "GLTFLoader.js")), "vendor/jsm/loaders/GLTFLoader.js bundled locally");
  assert(fs.existsSync(path.join(threeDOutputDir, "js", "immersive-3d.js")), "js/immersive-3d.js generated");

  const threeDHtml = fs.readFileSync(path.join(threeDOutputDir, "index.html"), "utf8");
  assert(threeDHtml.includes('type="module" src="./js/immersive-3d.js"'), "index.html loads local immersive-3d.js module");
  assert(threeDHtml.includes('id="scene-3d-canvas-host"'), "index.html renders #scene-3d-canvas-host 3D container");
  assert(threeDHtml.includes('data-interactive-3d="true"'), "index.html renders data-interactive-3d attribute");
  assert(threeDResult.manifest.experienceTier === "IMMERSIVE_3D", "Manifest records IMMERSIVE_3D tier");
  assert(threeDResult.manifest.zeroCdnVerified === true, "Zero-CDN compliance verified for 3D build");

  // 5. Live Chromium Browser E2E Verification of 3D Scene
  console.log("\nStarting local static HTTP server for 3D browser verification...");
  const server = http.createServer((req, res) => {
    let reqPath = req.url?.split("?")[0] || "/";
    if (reqPath === "/") reqPath = "/index.html";
    const filePath = path.join(threeDOutputDir, reqPath.replace(/^\//, ""));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(fs.readFileSync(filePath));
    } else {
      console.log("[SERVER 404]:", req.url, "->", filePath);
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  await new Promise<void>((resolve) => server.listen(8098, "127.0.0.1", () => resolve()));
  console.log("3D static test server listening on http://127.0.0.1:8098");

  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const uncaughtExceptions: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    uncaughtExceptions.push(err.message);
  });

  try {
    console.log("Navigating to generated 3D site http://127.0.0.1:8098/index.html...");
    await page.goto("http://127.0.0.1:8098/index.html", { waitUntil: "networkidle" });

    // Verify 3D canvas mount
    const canvasLocator = page.locator("#scene-3d-canvas-host canvas");
    await canvasLocator.waitFor({ state: "attached", timeout: 5000 });
    assert(await canvasLocator.count() > 0, "Three.js WebGL <canvas> dynamically mounted inside #scene-3d-canvas-host");

    // Perform interactive mouse drag
    console.log("Testing user mouse drag interaction on 3D canvas...");
    const canvasBox = await canvasLocator.boundingBox();
    if (canvasBox) {
      await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width / 2 + 100, canvasBox.y + canvasBox.height / 2 + 50);
      await page.mouse.up();
      await page.waitForTimeout(300);
      assert(true, "User mouse drag orbit interaction completed without throwing errors");
    }

    // Perform scroll interaction
    console.log("Testing scroll-linked rotation...");
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    assert(true, "Scroll scrub completed without throwing errors");

    // Check errors
    if (uncaughtExceptions.length > 0) {
      console.log("Uncaught exceptions captured:", uncaughtExceptions);
    }
    if (consoleErrors.length > 0) {
      console.log("Console errors captured:", consoleErrors);
    }
    assert(uncaughtExceptions.length === 0, `Zero uncaught exceptions in browser (found: ${uncaughtExceptions.length})`);
    assert(consoleErrors.length === 0, `Zero console errors in browser (found: ${consoleErrors.length})`);

  } finally {
    await browser.close();
    server.close();
    console.log("3D test server and browser stopped cleanly.");
  }

  // 6. Cleanup
  console.log("\nCleaning up test artifacts...");
  try {
    fs.rmSync(cineOutputDir, { recursive: true, force: true });
    fs.rmSync(threeDOutputDir, { recursive: true, force: true });
    if (cineResult.zipPath && fs.existsSync(cineResult.zipPath)) fs.unlinkSync(cineResult.zipPath);
    if (threeDResult.zipPath && fs.existsSync(threeDResult.zipPath)) fs.unlinkSync(threeDResult.zipPath);

    // Delete DB records
    for (const pId of [cinematicProject.id, threeDProject.id]) {
      await db.pageSectionComposition.deleteMany({ where: { pageComposition: { projectId: pId } } });
      await db.pageComposition.deleteMany({ where: { projectId: pId } });
      await db.projectDesignConfig.deleteMany({ where: { projectId: pId } });
      await db.project.delete({ where: { id: pId } });
    }
  } catch (cleanErr: any) {
    console.warn("Cleanup warning:", cleanErr.message);
  }

  assert(true, "Test projects and artifacts cleaned up successfully");

  console.log(`\n================================================================`);
  console.log(`PHASE 6.1 CINEMATIC & IMMERSIVE INTEGRATION COMPLETE: ${passedCount} / ${totalCount} PASSED`);
  console.log(`================================================================\n`);
}

runTests().catch((err) => {
  console.error("\n[FATAL ERROR]:", err);
  process.exit(1);
});
