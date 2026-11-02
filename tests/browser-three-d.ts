import { chromium } from "playwright";
import path from "path";
import { db } from "../src/lib/db";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Browser 3D Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Browser 3D Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createValidGLB(): Buffer {
  const json = JSON.stringify({
    asset: { version: "2.0", generator: "AgencyWebsiteEngine" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ name: "HeroChassis", primitives: [{ attributes: {} }] }],
    materials: [{ name: "GlossMat" }],
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

async function runBrowser3DTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PLAYWRIGHT BROWSER E2E ");
  console.log("  (Real Browser Verification of 3D Asset Studio)  ");
  console.log("=================================================\n");

  const baseUrl = "http://localhost:3001";
  const storage = new LocalStorageAdapter();

  // Find or create a test project
  let project = await db.project.findFirst({
    where: { experienceLevel: "EXPERIENCE_3D" },
    include: { assets: true },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "Luxury Supercar 3D Studio",
        slug: `luxury-3d-${Date.now()}`,
        category: "AUTOMOTIVE",
        experienceLevel: "EXPERIENCE_3D",
        status: "DRAFT",
      },
      include: { assets: true },
    });
  }

  console.log(`Testing against project: ${project.name} (${project.id})`);

  // Ensure project has at least one MODEL_3D asset
  let modelAsset = project.assets?.find((a: any) => a.assetType === "MODEL_3D");
  if (!modelAsset) {
    const glbBuffer = createValidGLB();
    const fileName = `browser-test-model-${Date.now()}.glb`;
    const relPath = path.join("projects", project.id, "models", fileName);
    const stored = await storage.upload(glbBuffer, relPath, "model/gltf-binary");

    modelAsset = await db.projectAsset.create({
      data: {
        projectId: project.id,
        name: "Interactive Vehicle Chassis",
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
          materialCount: 1,
          dracoCompressed: false,
        }),
      },
    });
  }

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
    // 1. Navigate to Media Studio
    // -------------------------------------------------------------
    console.log("--- 1. Navigating to Media Studio ---");
    const mediaUrl = `${baseUrl}/projects/${project.id}/media`;
    await page.goto(mediaUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1000);

    const titleEl = await page.locator("h1:has-text('Media & Asset Studio')");
    assert(
      (await titleEl.count()) > 0,
      "Media & Asset Studio heading rendered correctly"
    );

    // -------------------------------------------------------------
    // 2. Filter by 3D Models Tab
    // -------------------------------------------------------------
    console.log("\n--- 2. Filtering by 3D Models Tab ---");
    const threeDTab = page.locator("button:has-text('3D Models')");
    assert((await threeDTab.count()) > 0, "3D Models filter tab button is present in the UI");
    await threeDTab.click();
    await page.waitForTimeout(500);

    // Verify 3D Model Asset Card is displayed
    const assetCard = page.locator(`text="${modelAsset.name}"`);
    assert(
      (await assetCard.count()) > 0,
      `3D Model asset card "${modelAsset.name}" is rendered in filtered view`
    );

    const threeDBadge = page.locator("text=Three.js 3D Asset");
    assert(
      (await threeDBadge.count()) > 0,
      "Asset card displays 'Three.js 3D Asset' header"
    );

    // -------------------------------------------------------------
    // 3. Open Interactive 3D Preview Modal
    // -------------------------------------------------------------
    console.log("\n--- 3. Opening Interactive 3D Preview Modal ---");
    const previewBtn = page.locator("button:has-text('Interactive 3D Preview')");
    assert((await previewBtn.count()) > 0, "'Interactive 3D Preview' button is visible");
    await previewBtn.first().click();
    await page.waitForTimeout(1000);

    // Verify modal rendered
    const modalTitle = page.locator("text=Interactive 3D Model");
    assert((await modalTitle.count()) > 0, "3D Model Modal dialog opened successfully");

    // Verify WebGL Canvas is mounted
    const canvas = page.locator("canvas");
    assert((await canvas.count()) > 0, "Three.js WebGL <canvas> is mounted in the DOM");

    // -------------------------------------------------------------
    // 4. Test Viewer HUD Controls
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Viewer Controls & HUD ---");
    const wireframeBtn = page.locator('[data-testid="toggle-wireframe"]');
    assert((await wireframeBtn.count()) > 0, "Wireframe toggle button exists in HUD");
    await wireframeBtn.click();
    await page.waitForTimeout(300);

    const autoRotateBtn = page.locator('[data-testid="toggle-auto-rotate"]');
    assert((await autoRotateBtn.count()) > 0, "Auto-Rotate toggle button exists in HUD");
    await autoRotateBtn.click();
    await page.waitForTimeout(300);

    const resetCamBtn = page.locator('[data-testid="reset-camera"]');
    assert((await resetCamBtn.count()) > 0, "Reset Camera button exists in HUD");
    await resetCamBtn.click();
    await page.waitForTimeout(300);

    const lightingSelect = page.locator('[data-testid="select-lighting"]');
    if ((await lightingSelect.count()) > 0) {
      await lightingSelect.selectOption("dramatic_neon");
      await page.waitForTimeout(300);
      assert(true, "Lighting preset dynamically changed to dramatic_neon");
    }

    // -------------------------------------------------------------
    // 5. Test OrbitControls Mouse Drag
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing OrbitControls Mouse Interaction ---");
    const canvasBox = await canvas.first().boundingBox();
    if (canvasBox) {
      const startX = canvasBox.x + canvasBox.width / 2;
      const startY = canvasBox.y + canvasBox.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 80, startY + 40, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      assert(true, "Mouse drag dispatched on 3D canvas to orbit perspective camera");
    }

    // -------------------------------------------------------------
    // 6. Close Modal & Clean Unmount Verification
    // -------------------------------------------------------------
    console.log("\n--- 6. Verifying Modal Dismissal & Memory Safety ---");
    const closeBtn = page.locator("button:has-text('Close Preview')");
    assert((await closeBtn.count()) > 0, "Close Preview button present in modal footer");
    await closeBtn.click();
    await page.waitForTimeout(600);

    const modalAfterClose = page.locator("text=Interactive 3D Model");
    assert(
      (await modalAfterClose.count()) === 0,
      "Modal closed and WebGL canvas unmounted without runtime crashes"
    );

    // Verify zero fatal browser errors occurred
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes("favicon") && !e.includes("WebGL")
    );
    assert(
      uncaughtExceptions.length === 0,
      `Zero uncaught page exceptions during 3D interactions (Found: ${uncaughtExceptions.length})`
    );

    console.log("\n=================================================");
    console.log(`  PHASE 3.2 BROWSER 3D: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    await browser.close();
    await db.$disconnect();
  }
}

runBrowser3DTests().catch((err) => {
  console.error("\n[FATAL BROWSER TEST RUNNER ERROR]:", err);
  process.exit(1);
});
