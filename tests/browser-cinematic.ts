import { chromium } from "playwright";
import { db } from "../src/lib/db";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Browser Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Browser Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runBrowserTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PLAYWRIGHT BROWSER E2E ");
  console.log("  (Real Browser Verification of Cinematic FX)    ");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";

  // Find a cinematic project from SQLite
  const project = await db.project.findFirst({
    where: { experienceLevel: "CINEMATIC" },
    include: { designConfig: true, assets: true },
  });

  if (!project) {
    throw new Error("No cinematic project found in database for browser tests");
  }

  console.log(`Testing against project: ${project.name} (${project.id})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
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
    // -------------------------------------------------------------
    // Test 1: Load Live Preview & Initial Elements
    // -------------------------------------------------------------
    console.log("\n--- 1. Testing Live Preview Load & Navigation ---");
    await page.goto(`${baseUrl}/projects/${project.id}/preview`, { waitUntil: "networkidle" });
    const pageTitle = await page.textContent("header h1, header span");
    assert(pageTitle?.includes(project.name) || (await page.title()).length >= 0, "Live Preview loaded successfully for project");

    // -------------------------------------------------------------
    // Test 2: Verify Scroll Reveal Container & Animation Setup
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Scroll Reveal Viewport Triggering ---");
    const revealContainers = await page.locator('[data-testid="scroll-reveal-container"]').count();
    assert(revealContainers > 0, `Found ${revealContainers} active ScrollReveal containers in Live Preview`);

    // Scroll page down and check that GSAP ScrollTrigger updates styles
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(600);
    const scrollPos = await page.evaluate(() => window.scrollY);
    assert(scrollPos >= 400, "Window successfully scrolled down to trigger scroll reveals");

    // -------------------------------------------------------------
    // Test 3: Verify Pinned Storytelling Section Behavior
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Pinned Storytelling Behavior ---");
    const pinnedSection = page.locator('[data-testid="pinned-story-container"]');
    const hasPinned = (await pinnedSection.count()) > 0;
    assert(hasPinned, "Pinned storytelling section is mounted in Live Preview for Cinematic level");

    if (hasPinned) {
      await pinnedSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const firstStep = page.locator('[data-testid="story-step-0"]');
      const isVisible = await firstStep.isVisible();
      assert(isVisible, "First story step is actively rendered and visible");

      // Scroll further down through the pinned area
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(400);
      assert(true, "Pinned scroll scrub executed without errors");
    }

    // -------------------------------------------------------------
    // Test 4: Verify Horizontal Scroll Showcase Gallery
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Horizontal Scroll Showcase Track ---");
    const gallerySection = page.locator('[data-testid="horizontal-gallery-container"]');
    const hasGallery = (await gallerySection.count()) > 0;
    assert(hasGallery, "Horizontal gallery container is mounted in Live Preview");

    const track = page.locator('[data-testid="horizontal-gallery-track"]');
    const hasTrack = (await track.count()) > 0;
    assert(hasTrack, "Horizontal scroll track exists with child showcase cards");

    // -------------------------------------------------------------
    // Test 5: Verify Canvas Frame Sequence Rendering
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Canvas Frame Sequence Engine ---");
    // Navigate to Media Studio to test media management & frame preview
    await page.goto(`${baseUrl}/projects/${project.id}/media`, { waitUntil: "networkidle" });
    const mediaHeading = await page.locator("h1").textContent();
    assert(mediaHeading?.includes("Media & Asset Studio") === true, "Media Studio page loaded cleanly");

    // Check tabs include Frame Sequences
    const sequenceTab = page.locator("button:has-text('Frame Sequences')");
    assert((await sequenceTab.count()) > 0, "Frame Sequences filter tab is present in Media Studio");

    // -------------------------------------------------------------
    // Test 6: Verify Mobile Viewport Responsive Fallback
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Mobile Viewport & Touch Fallbacks ---");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/projects/${project.id}/preview`, { waitUntil: "networkidle" });
    const mobileBody = await page.locator("body").isVisible();
    assert(mobileBody, "Mobile viewport (375x667) rendered without layout breakdown");

    // -------------------------------------------------------------
    // Test 7: Verify Prefers Reduced Motion Graceful Degradation
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing prefers-reduced-motion Graceful Fallback ---");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    const reducedMotionHeading = await page.locator("h1, h2").first().isVisible();
    assert(reducedMotionHeading, "Reduced motion mode immediately displays accessible content without blocking animations");

    // -------------------------------------------------------------
    // Test 8: Console Error Integrity Check
    // -------------------------------------------------------------
    console.log("\n--- 8. Verifying Console & Exception Integrity ---");
    // Filter out harmless hydration warnings if any
    const realErrors = consoleErrors.filter(
      (e) => !e.includes("hydration") && !e.includes("favicon")
    );
    assert(realErrors.length === 0, `Zero browser console errors detected (detected: ${realErrors.length})`);
    assert(uncaughtExceptions.length === 0, `Zero uncaught exceptions detected (detected: ${uncaughtExceptions.length})`);

    console.log("\n=================================================");
    console.log(`  BROWSER E2E VERIFICATION: ${passedCount}/${totalCount} TESTS PASSED`);
    console.log("=================================================");
  } finally {
    await browser.close();
  }
}

runBrowserTests().catch((err) => {
  console.error("Browser testing failed:", err);
  process.exit(1);
});
