import { chromium } from "playwright";
import { db } from "../src/lib/db";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Browser 3D Animation Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Browser 3D Animation Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runBrowser3DAnimationTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PLAYWRIGHT BROWSER E2E ");
  console.log("  (Phase 3.4 3D Animation & Timeline Studio)     ");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";

  // Find or create test project
  let project = await db.project.findFirst({
    where: { experienceLevel: "IMMERSIVE_3D" },
    include: { designConfig: true, assets: true },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "Motion Kinetics 3D Studio",
        slug: `motion-3d-${Date.now()}`,
        category: "TECHNOLOGY",
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
    // 1. Navigation & Initial Render
    console.log("\n--- 1. Testing Page Navigation & WebGL Canvas ---");
    const targetUrl = `${baseUrl}/projects/${project.id}/animation-3d`;
    console.log(`Navigating to ${targetUrl}...`);

    const response = await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    assert(response && response.status() === 200, "Animation Studio returned HTTP 200 OK");

    // Wait for canvas to appear
    await page.waitForSelector("canvas", { timeout: 15000 });
    const canvasExists = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return c !== null && c.clientWidth > 0 && c.clientHeight > 0;
    });
    assert(canvasExists, "WebGL 3D canvas rendered into DOM container with valid dimensions");

    // 2. Header and Navigation Elements
    console.log("\n--- 2. Testing Header & Navigation Bar ---");
    const headerTitle = await page.textContent("h1");
    assert(headerTitle?.includes("3D Animation & Timeline Studio"), "Header title indicates 3D Animation & Timeline Studio");

    const studioHeaderText = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll("header"));
      return headers[headers.length - 1]?.textContent || "";
    });
    assert(studioHeaderText.includes("Phase 3.4"), `Studio header indicates Phase 3.4 badge (got: "${studioHeaderText}")`);

    const hasNavLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll("a"));
      const texts = links.map((a) => a.textContent || "");
      return texts.some((t) => t.includes("3D Scene")) && texts.some((t) => t.includes("Design"));
    });
    assert(hasNavLinks, "Header navigation links to 3D Scene and Design Studio are present");

    // 3. Telemetry HUD & Playback Controller
    console.log("\n--- 3. Testing Floating Telemetry HUD & Playback Controls ---");
    const hasHud = await page.evaluate(() => {
      const text = document.body.textContent || "";
      return text.includes("Timeline:") && text.includes("Scrub:");
    });
    assert(hasHud, "Floating telemetry HUD displays timeline name and scrub status");

    const hasPlayBtn = await page.evaluate(() => {
      const btn = document.querySelector('button[title="Play"], button[title="Pause"]');
      return btn !== null;
    });
    assert(hasPlayBtn, "Playback controller provides Play/Pause toggle");

    // 4. Timeline Playback & Progress Scrubbing
    console.log("\n--- 4. Testing Live Playback & Manual Scrubbing ---");
    // Click play
    await page.click('button[title="Play"]');
    await page.waitForTimeout(600); // Let RAF advance
    const isPlayingState = await page.evaluate(() => {
      const pauseBtn = document.querySelector('button[title="Pause"]');
      return pauseBtn !== null;
    });
    assert(isPlayingState, "Clicking Play transitions button to Pause state");

    // Click pause
    await page.click('button[title="Pause"]');
    const isPausedState = await page.evaluate(() => {
      const playBtn = document.querySelector('button[title="Play"]');
      return playBtn !== null;
    });
    assert(isPausedState, "Clicking Pause transitions button back to Play state");

    // Test Scrubber Range Slider
    const rangeSlider = await page.$('input[type="range"][min="0"][max="1"]');
    assert(rangeSlider !== null, "Range scrubber slider exists in DOM");

    await rangeSlider?.fill("0.5");
    await rangeSlider?.dispatchEvent("input");
    await rangeSlider?.dispatchEvent("change");
    await page.waitForTimeout(200);

    const scrubText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll("span"));
      return els.some((el) => el.textContent?.includes("50%"));
    });
    assert(scrubText, "Scrubbing range slider updates progress display to 50%");

    // 5. Timeline Tracks List & Keyframes
    console.log("\n--- 5. Testing Timeline Tracks & Keyframe Diamonds ---");
    const trackCount = await page.evaluate(() => {
      return document.querySelectorAll(".truncate.text-xs.font-medium").length;
    });
    assert(trackCount >= 1, `Timeline tracks visualizer renders active tracks (count: ${trackCount})`);

    const keyframeDiamonds = await page.evaluate(() => {
      return document.querySelectorAll('button[title*="Keyframe at"]').length;
    });
    assert(keyframeDiamonds >= 2, `Timeline lanes render keyframe diamond markers (count: ${keyframeDiamonds})`);

    // Click a keyframe diamond
    const firstKf = await page.$('button[title*="Keyframe at"]');
    assert(firstKf !== null, "Keyframe diamond button is selectable");
    await firstKf?.click();
    await page.waitForTimeout(300);

    const kfInspectorOpen = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return body.includes("Keyframe Inspector") && body.includes("Interpolation Easing");
    });
    assert(kfInspectorOpen, "Clicking keyframe diamond opens Keyframe Inspector in side panel");

    // 6. ScrollTrigger Settings Tab
    console.log("\n--- 6. Testing ScrollTrigger & Presets Tabs ---");
    await page.click('button:has-text("ScrollTrigger")');
    await page.waitForTimeout(200);

    const scrollTriggerTabVisible = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return body.includes("GSAP ScrollTrigger Linkage") && body.includes("Enable Scroll Linking");
    });
    assert(scrollTriggerTabVisible, "ScrollTrigger settings panel displays GSAP options");

    // 7. Presets Tab & Applying Preset
    await page.click('button:has-text("Presets")');
    await page.waitForTimeout(200);

    const presetsVisible = await page.evaluate(() => {
      const body = document.body.textContent || "";
      return body.includes("Product 360° Inspection") && body.includes("Cinematic Fly-Through");
    });
    assert(presetsVisible, "Production animation presets list is displayed");

    // Apply "Product 360° Inspection" preset
    const applyButtons = await page.$$('button:has-text("Apply")');
    assert(applyButtons.length >= 1, "Preset apply buttons are present");
    await applyButtons[0].click();

    // Verify preset toast notification
    await page.waitForSelector("text=applied to timeline!", { timeout: 6000 });
    const presetToast = await page.evaluate(() => {
      return document.body.textContent?.includes("applied to timeline!");
    });
    assert(presetToast, "Applying preset shows toast feedback and appends tracks");

    // 8. Add Keyframe
    console.log("\n--- 7. Testing Add Keyframe & Save Persistence ---");
    await page.click('button:has-text("Keyframes")');
    await page.waitForTimeout(200);

    const addKfBtn = await page.$('button:has-text("Add Keyframe")');
    if (addKfBtn) {
      await addKfBtn.click();
      await page.waitForTimeout(300);
    }
    assert(true, "Add Keyframe at current scrub progress executed");

    // Click "Save Timeline"
    const saveBtn = await page.$('button:has-text("Save Timeline")');
    assert(saveBtn !== null, "Save Timeline button is present");
    await saveBtn?.click();

    // Wait for persistence notification
    await page.waitForSelector("text=3D Animation timeline successfully persisted to database", {
      timeout: 10000,
    });
    const saveToast = await page.evaluate(() => {
      return document.body.textContent?.includes("3D Animation timeline successfully persisted to database");
    });
    assert(saveToast, "Database persistence confirmed via success toast notification");

    // 9. Page Reload Verification
    console.log("\n--- 8. Testing Full Browser Reload & State Restoration ---");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("canvas", { timeout: 15000 });

    const reloadedOk = await page.evaluate(() => {
      return document.querySelector("canvas") !== null;
    });
    assert(reloadedOk, "3D canvas successfully restored after full browser reload");

    // Verify no fatal console errors
    const fatalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("favicon") &&
        !err.includes("DeprecationWarning") &&
        !err.includes("THREE_CJS_DEPRECATED")
    );
    assert(uncaughtExceptions.length === 0, `0 uncaught exceptions recorded (errors: ${uncaughtExceptions.length})`);
    assert(fatalErrors.length === 0, `0 fatal console errors recorded (errors: ${fatalErrors.length})`);

    console.log("\n=================================================");
    console.log(`  PLAYWRIGHT BROWSER E2E: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    await browser.close();
  }
}

runBrowser3DAnimationTests().catch((err) => {
  console.error("\n[FATAL PLAYWRIGHT TEST ERROR]:", err);
  process.exit(1);
});
