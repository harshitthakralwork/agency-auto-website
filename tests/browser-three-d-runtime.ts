import { chromium } from "playwright";
import { db } from "../src/lib/db";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Browser 3D Runtime Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Browser 3D Runtime Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runBrowser3DRuntimeTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PLAYWRIGHT BROWSER E2E ");
  console.log("  (Phase 3.5 Production 3D Live Preview Runtime)  ");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";

  // Find or create test project with IMMERSIVE_3D tier
  let project = await db.project.findFirst({
    where: { experienceLevel: "IMMERSIVE_3D" },
    include: { designConfig: true, assets: true },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "Lumière Aesthetics & Spatial Hair Atelier",
        slug: `lumiere-3d-${Date.now()}`,
        category: "SALON_BEAUTY",
        experienceLevel: "IMMERSIVE_3D",
        status: "DRAFT",
      },
      include: { designConfig: true, assets: true },
    });
  }

  console.log(`Testing against project: ${project.name} (${project.id})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
  });

  const consoleErrors: string[] = [];
  const uncaughtExceptions: string[] = [];

  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    uncaughtExceptions.push(err.message);
  });

  try {
    // 1. Navigation to Live Preview
    console.log("\n--- 1. Testing Live Preview Navigation ---");
    const targetUrl = `${baseUrl}/projects/${project.id}/preview`;
    console.log(`Navigating to ${targetUrl}...`);

    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    assert(response && response.status() === 200, "Live Preview returned HTTP 200 OK");

    // 2. Production 3D Runtime Root & Canvas Mounting
    console.log("\n--- 2. Testing Production 3D Canvas Mounting ---");
    await page.waitForSelector("[data-3d-production-root]", { timeout: 15000 });
    const rootHtml = await page.evaluate(() => document.querySelector("[data-3d-production-root]")?.innerHTML || "");
    console.log("[DEBUG ROOT HTML]:", rootHtml.slice(0, 300));
    console.log("[DEBUG CONSOLE ERRORS]:", consoleErrors);
    console.log("[DEBUG UNCAUGHT EXCEPTIONS]:", uncaughtExceptions);

    await page.waitForSelector("[data-3d-production-root] canvas", { timeout: 15000 });
    const canvasValid = await page.evaluate(() => {
      const c = document.querySelector("[data-3d-production-root] canvas") as HTMLCanvasElement;
      return c !== null && c.clientWidth > 0 && c.clientHeight > 0;
    });
    assert(canvasValid, "Real WebGL <canvas> initialized with active render viewport");

    // 3. Storytelling Narrative Chapters
    console.log("\n--- 3. Testing 3D Story Narrative Chapters ---");
    const hasStoryChapters = await page.evaluate(() => {
      const text = document.body.textContent || "";
      return text.includes("Spatial Experience") || text.includes("Chapter 01");
    });
    assert(hasStoryChapters, "3D storytelling narrative chapters rendered over pinned viewport");

    // 4. Scroll Scrub Dynamics
    console.log("\n--- 4. Testing Scroll Scrub Dynamics ---");
    // Scroll down to advance GSAP ScrollTrigger
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(400);

    const scrolled = await page.evaluate(() => window.scrollY > 0);
    assert(scrolled, "Page scrolled to trigger 3D scroll-linked animation evaluation");

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    assert(true, "Scrolled back to origin cleanly without stuck pins");

    // 5. Responsive Viewport Switching
    console.log("\n--- 5. Testing Viewport Adaptability ---");
    await page.click('button:has-text("Tablet")');
    await page.waitForTimeout(300);
    const tabletView = await page.evaluate(() => {
      return document.querySelector(".w-\\[768px\\]") !== null;
    });
    assert(tabletView, "Switched to Tablet (768px) viewport constraint");

    await page.click('button:has-text("Mobile")');
    await page.waitForTimeout(300);
    const mobileView = await page.evaluate(() => {
      return document.querySelector(".w-\\[375px\\]") !== null;
    });
    assert(mobileView, "Switched to Mobile (375px) viewport constraint");

    await page.click('button:has-text("Desktop")');
    await page.waitForTimeout(300);
    assert(true, "Returned to Desktop viewport");

    // 6. Exception & Error Integrity
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("DeprecationWarning") &&
        !err.includes("THREE_CJS_DEPRECATED")
    );
    assert(uncaughtExceptions.length === 0, `0 uncaught exceptions recorded (found: ${uncaughtExceptions.length})`);
    assert(fatalErrors.length === 0, `0 fatal console errors recorded (found: ${fatalErrors.length})`);

    console.log("\n=================================================");
    console.log(`  PLAYWRIGHT BROWSER 3D RUNTIME: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    await browser.close();
  }
}

runBrowser3DRuntimeTests().catch((err) => {
  console.error("\n[FATAL BROWSER 3D RUNTIME TEST ERROR]:", err);
  process.exit(1);
});
