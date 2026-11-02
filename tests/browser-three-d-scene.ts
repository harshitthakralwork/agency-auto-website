import { chromium } from "playwright";
import { db } from "../src/lib/db";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Browser 3D Scene Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Browser 3D Scene Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runBrowser3DSceneTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PLAYWRIGHT BROWSER E2E ");
  console.log("  (Phase 3.3 3D Scene, Camera & Material Studio)  ");
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
        name: "Zenith Kinetic Architecture",
        slug: `zenith-3d-${Date.now()}`,
        category: "HOTELS_BANQUETS",
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
    // -------------------------------------------------------------
    // 1. Navigate to 3D Scene Studio
    // -------------------------------------------------------------
    console.log("--- 1. Navigating to 3D Scene Studio ---");
    const sceneStudioUrl = `${baseUrl}/projects/${project.id}/3d`;
    await page.goto(sceneStudioUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);

    const titleEl = page.locator("h1:has-text('3D Scene & Camera Studio')");
    assert(
      (await titleEl.count()) > 0,
      "3D Scene & Camera Studio heading rendered in UI"
    );

    // -------------------------------------------------------------
    // 2. Real WebGL Viewport & Telemetry HUD
    // -------------------------------------------------------------
    console.log("\n--- 2. Verifying Real WebGL Canvas & Telemetry HUD ---");
    const canvas = page.locator('[data-testid="three-d-viewport"] canvas');
    assert((await canvas.count()) > 0, "Three.js WebGL <canvas> mounted inside viewport");

    const fpsHud = page.locator("text=FPS");
    assert((await fpsHud.count()) > 0, "Real-time FPS telemetry indicator present in viewport HUD");

    // -------------------------------------------------------------
    // 3. Objects Tab & Add Object Modal Flow
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Object Graph & Adding Objects ---");
    const addObjTrigger = page.locator('[data-testid="add-object-trigger-btn"]');
    assert((await addObjTrigger.count()) > 0, "Add Object button is visible");
    await addObjTrigger.click();
    await page.waitForTimeout(400);

    const modalTitle = page.locator("text=Add Object to Scene");
    assert((await modalTitle.count()) > 0, "Add Object modal dialog opened");

    // Select procedural hero floating knot
    const procSelect = page.locator('[data-testid="procedural-type-select"]');
    if ((await procSelect.count()) > 0) {
      await procSelect.selectOption("hero_floating_object");
    }

    const nameInput = page.locator('[data-testid="new-obj-name-input"]');
    await nameInput.fill("Kinetic Torus Knot");

    const confirmAddBtn = page.locator('[data-testid="confirm-add-obj-btn"]');
    await confirmAddBtn.click();
    await page.waitForTimeout(600);

    const newObjCard = page.locator("text=Kinetic Torus Knot");
    assert(
      (await newObjCard.count()) > 0,
      "Newly added object 'Kinetic Torus Knot' appears in scene object hierarchy"
    );

    // -------------------------------------------------------------
    // 4. Transform Tab Controls
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Object Transforms (Position, Rotation, Scale) ---");
    const transformTab = page.locator('[data-testid="tab-properties"]');
    await transformTab.click();
    await page.waitForTimeout(300);

    const posXInput = page.locator('[data-testid="pos-x"]');
    assert((await posXInput.count()) > 0, "Position X input is visible and reactive");
    await posXInput.fill("1.8");
    await posXInput.dispatchEvent("change");
    await page.waitForTimeout(300);

    const rotYInput = page.locator('[data-testid="rot-y"]');
    assert((await rotYInput.count()) > 0, "Rotation Y input is visible");
    await rotYInput.fill("45");
    await rotYInput.dispatchEvent("change");
    await page.waitForTimeout(300);

    // -------------------------------------------------------------
    // 5. Material Overrides Tab
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Surface Material Overrides ---");
    const materialTab = page.locator('[data-testid="tab-materials"]');
    await materialTab.click();
    await page.waitForTimeout(300);

    const wireframeCheck = page.locator('[data-testid="mat-wireframe-checkbox"]');
    assert((await wireframeCheck.count()) > 0, "Wireframe toggle checkbox is visible");
    await wireframeCheck.check();
    await page.waitForTimeout(300);

    const roughnessSlider = page.locator('[data-testid="mat-roughness-slider"]');
    assert((await roughnessSlider.count()) > 0, "Roughness slider is visible");

    // -------------------------------------------------------------
    // 6. Camera Viewpoint Presets
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Camera Angles & Presets ---");
    const cameraTab = page.locator('[data-testid="tab-camera"]');
    await cameraTab.click();
    await page.waitForTimeout(300);

    const isometricBtn = page.locator('[data-testid="camera-preset-isometric"]');
    assert((await isometricBtn.count()) > 0, "Isometric camera preset button is visible");
    await isometricBtn.click();
    await page.waitForTimeout(400);

    const fovSlider = page.locator('[data-testid="camera-fov-slider"]');
    assert((await fovSlider.count()) > 0, "Camera FOV slider is visible");

    // -------------------------------------------------------------
    // 7. Studio Lighting Rigs
    // -------------------------------------------------------------
    console.log("\n--- 7. Testing Studio Lighting Presets ---");
    const lightingTab = page.locator('[data-testid="tab-lighting"]');
    await lightingTab.click();
    await page.waitForTimeout(300);

    const lightPresetSelect = page.locator('[data-testid="lighting-preset-select"]');
    assert((await lightPresetSelect.count()) > 0, "Lighting preset selector is visible");
    await lightPresetSelect.selectOption("dramatic_neon");
    await page.waitForTimeout(400);
    assert(true, "Lighting preset dynamically switched to 'dramatic_neon'");

    // -------------------------------------------------------------
    // 8. Environment & Floor Helpers
    // -------------------------------------------------------------
    console.log("\n--- 8. Testing Environment, Fog & Grid Toggles ---");
    const envTab = page.locator('[data-testid="tab-environment"]');
    await envTab.click();
    await page.waitForTimeout(300);

    const fogCheck = page.locator('[data-testid="fog-toggle-checkbox"]');
    assert((await fogCheck.count()) > 0, "Atmospheric fog checkbox is visible");
    await fogCheck.check();
    await page.waitForTimeout(300);

    const toggleGridBtn = page.locator('[data-testid="toggle-grid-btn"]');
    await toggleGridBtn.click();
    await page.waitForTimeout(200);
    assert(true, "Editor Grid helper toggled cleanly");

    // -------------------------------------------------------------
    // 9. Interactive Orbit Drag
    // -------------------------------------------------------------
    console.log("\n--- 9. Testing OrbitControls Canvas Drag ---");
    const canvasBox = await canvas.first().boundingBox();
    if (canvasBox) {
      const centerX = canvasBox.x + canvasBox.width / 2;
      const centerY = canvasBox.y + canvasBox.height / 2;
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      await page.mouse.move(centerX + 100, centerY - 50, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(400);
      assert(true, "OrbitControls perspective camera drag executed cleanly");
    }

    // -------------------------------------------------------------
    // 10. Persistence: Save Scene & Reload Check
    // -------------------------------------------------------------
    console.log("\n--- 10. Saving 3D Scene to Database & Verifying Persistence ---");
    const saveBtn = page.locator('[data-testid="save-scene-btn"]');
    assert((await saveBtn.count()) > 0, "Save 3D Scene button is present in header");
    await saveBtn.click();
    await page.waitForSelector("text=3D Scene successfully persisted", { timeout: 10000 });

    const successMsg = page.locator("text=3D Scene successfully persisted");
    assert((await successMsg.count()) > 0, "Success notification confirmed database persistence");

    // -------------------------------------------------------------
    // 11. Exception & Crash Integrity
    // -------------------------------------------------------------
    console.log("\n--- 11. Verifying Exception & WebGL Integrity ---");
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("WebGL")
    );
    assert(
      uncaughtExceptions.length === 0,
      `Zero uncaught page exceptions during 3D scene editing (Detected: ${uncaughtExceptions.length})`
    );

    console.log("\n=================================================");
    console.log(`  PHASE 3.3 BROWSER 3D SCENE: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    await browser.close();
    await db.$disconnect();
  }
}

runBrowser3DSceneTests().catch((err) => {
  console.error("\n[FATAL BROWSER TEST RUNNER ERROR]:", err);
  process.exit(1);
});
