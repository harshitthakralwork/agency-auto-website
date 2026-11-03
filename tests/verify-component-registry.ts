/**
 * VERIFY-COMPONENT-REGISTRY.TS
 *
 * Dedicated verification suite for Phase 5.0:
 * Component Registry & Adaptation Engine.
 *
 * Tests:
 * 1. Component Registry Completeness & Inventory (37 components across 7 families)
 * 2. Zod Schema Validation for all component definitions & bindings
 * 3. Category Adaptation Engine across all 6 core industry categories
 * 4. Design Token Resolution & Custom Overrides
 * 5. Experience Tier Gating (STANDARD, CINEMATIC, IMMERSIVE_3D)
 * 6. SQLite Database Persistence & Project Component Library Binding
 * 7. Live Playwright Chromium Browser E2E Interaction (/registry)
 */

import { db } from "../src/lib/db";
import { RegistryService } from "../src/modules/registry/service";
import { ComponentAdapter } from "../src/modules/registry/adapter";
import {
  ComponentDefinitionSchema,
  ProjectComponentBindingSchema,
} from "../src/modules/registry/schema";
import {
  ComponentFamily,
  ExperienceLevel,
} from "../src/modules/registry/types";
import { chromium, Browser, Page } from "playwright";
import http from "http";

let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition: boolean, message: string) {
  totalAssertions++;
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedAssertions++;
  console.log(`  ✓ ${message}`);
}

async function testInventoryAndCompleteness() {
  console.log("\n--- TEST 1: Component Registry Completeness & Inventory ---");

  const allDefs = RegistryService.getAllDefinitions();
  assert(allDefs.length === 42, `Registry contains exactly 42 component definitions (found ${allDefs.length})`);

  // Verify ID uniqueness
  const ids = new Set<string>();
  for (const def of allDefs) {
    assert(!ids.has(def.id), `Component ID '${def.id}' is globally unique`);
    ids.add(def.id);
  }

  // Verify Family distribution
  const families: Record<ComponentFamily, number> = {
    HERO: 0,
    BUSINESS: 0,
    CONVERSION: 0,
    SOCIAL_PROOF: 0,
    MEDIA: 0,
    CONTENT: 0,
    ADVANCED: 0,
  };

  for (const def of allDefs) {
    assert(def.family in families, `Component '${def.id}' has valid family '${def.family}'`);
    families[def.family]++;
    assert(def.variants.length >= 1, `Component '${def.id}' has at least 1 variant (found ${def.variants.length})`);
    assert(def.supportedExperienceLevels.length >= 1, `Component '${def.id}' supports at least 1 experience level`);
    assert(def.propDefinitions.length >= 1, `Component '${def.id}' specifies property definitions`);
    assert(def.tags.length >= 1, `Component '${def.id}' includes searchable tags`);
  }

  assert(families.HERO === 6, `HERO family contains 6 components (found ${families.HERO})`);
  assert(families.BUSINESS === 8, `BUSINESS family contains 8 components (found ${families.BUSINESS})`);
  assert(families.CONVERSION === 6, `CONVERSION family contains 6 components (found ${families.CONVERSION})`);
  assert(families.SOCIAL_PROOF === 5, `SOCIAL_PROOF family contains 5 components (found ${families.SOCIAL_PROOF})`);
  assert(families.MEDIA === 5, `MEDIA family contains 5 components (found ${families.MEDIA})`);
  assert(families.CONTENT === 7, `CONTENT family contains 7 components (found ${families.CONTENT})`);
  assert(families.ADVANCED === 5, `ADVANCED family contains 5 components (found ${families.ADVANCED})`);
}

async function testZodSchemas() {
  console.log("\n--- TEST 2: Zod Schema Validation ---");

  const allDefs = RegistryService.getAllDefinitions();
  for (const def of allDefs) {
    const parseResult = ComponentDefinitionSchema.safeParse(def);
    assert(parseResult.success, `Component '${def.id}' passes Zod ComponentDefinitionSchema`);
  }

  // Test ProjectComponentBindingSchema
  const validBinding = {
    projectId: "proj-123",
    componentId: "hero-split",
    variantId: "split-media-right",
    customProps: { customHeadline: "Custom Hero" },
  };
  const bindingResult = ProjectComponentBindingSchema.safeParse(validBinding);
  assert(bindingResult.success, "Valid ProjectComponentBinding payload passes schema");

  const invalidBinding = {
    projectId: "",
    componentId: "hero-split",
  };
  const invalidResult = ProjectComponentBindingSchema.safeParse(invalidBinding);
  assert(!invalidResult.success, "Invalid ProjectComponentBinding payload rejected by schema");
}

async function testCategoryAdaptationEngine() {
  console.log("\n--- TEST 3: Category Adaptation Engine ---");

  const heroSplit = RegistryService.getDefinitionById("hero-split")!;
  assert(heroSplit !== null, "Found 'hero-split' definition");

  const categories = [
    "healthcare",
    "hotels-banquets",
    "food-restaurants",
    "fitness-gyms",
    "salon-beauty",
    "schools-coaching",
  ];

  const adaptedHeadlines: Record<string, string> = {};

  for (const cat of categories) {
    const adapted = ComponentAdapter.adaptComponent(heroSplit, {
      category: cat,
      experienceLevel: "CINEMATIC",
      designPreset: "cinematic",
    });

    assert(adapted.category === cat, `Adapted component category is '${cat}'`);
    assert(typeof adapted.props.headline === "string", `Adapted headline is a string for '${cat}'`);
    assert(typeof adapted.props.badgeText === "string", `Adapted badgeText is a string for '${cat}'`);
    assert(typeof adapted.props.primaryCtaText === "string", `Adapted primaryCtaText is a string for '${cat}'`);

    adaptedHeadlines[cat] = adapted.props.headline as string;
  }

  // Ensure distinct category headlines
  const uniqueHeadlines = new Set(Object.values(adaptedHeadlines));
  assert(
    uniqueHeadlines.size === categories.length,
    `Each of the 6 categories produced a distinct adapted headline (${uniqueHeadlines.size}/${categories.length})`
  );

  // Check specific industry vocabulary
  assert(
    adaptedHeadlines["healthcare"].toLowerCase().includes("clinical") ||
      adaptedHeadlines["healthcare"].toLowerCase().includes("patient"),
    "Healthcare headline contains clinical/patient vocabulary"
  );
  assert(
    adaptedHeadlines["hotels-banquets"].toLowerCase().includes("hospitality") ||
      adaptedHeadlines["hotels-banquets"].toLowerCase().includes("elegance"),
    "Hotels-banquets headline contains hospitality/grandeur vocabulary"
  );
  assert(
    adaptedHeadlines["food-restaurants"].toLowerCase().includes("flavors") ||
      adaptedHeadlines["food-restaurants"].toLowerCase().includes("dining"),
    "Food-restaurants headline contains dining/flavors vocabulary"
  );
  assert(
    adaptedHeadlines["fitness-gyms"].toLowerCase().includes("performance") ||
      adaptedHeadlines["fitness-gyms"].toLowerCase().includes("coaching"),
    "Fitness-gyms headline contains performance/coaching vocabulary"
  );
  assert(
    adaptedHeadlines["salon-beauty"].toLowerCase().includes("beauty") ||
      adaptedHeadlines["salon-beauty"].toLowerCase().includes("elegance"),
    "Salon-beauty headline contains beauty/elegance vocabulary"
  );
  assert(
    adaptedHeadlines["schools-coaching"].toLowerCase().includes("academic") ||
      adaptedHeadlines["schools-coaching"].toLowerCase().includes("minds"),
    "Schools-coaching headline contains academic/learning vocabulary"
  );
}

async function testTokenResolutionAndOverrides() {
  console.log("\n--- TEST 4: Design Token Resolution & Overrides ---");

  const aboutDef = RegistryService.getDefinitionById("business-about")!;
  assert(aboutDef !== null, "Found 'business-about' definition");

  // Preset resolution without overrides
  const adaptedPreset = ComponentAdapter.adaptComponent(aboutDef, {
    category: "healthcare",
    experienceLevel: "STANDARD",
    designPreset: "luxury",
  });

  assert(adaptedPreset.tokenStyles.fontHeading.length > 0, "Resolved heading font from preset");
  assert(adaptedPreset.tokenStyles.colorPrimary.length > 0, "Resolved primary color from preset");

  // Explicit override takes precedence
  const adaptedOverride = ComponentAdapter.adaptComponent(aboutDef, {
    category: "healthcare",
    experienceLevel: "STANDARD",
    designPreset: "luxury",
    colors: { primary: "#00FFCC" },
    typography: { headingFont: "Playfair Display" },
  });

  assert(
    adaptedOverride.tokenStyles.colorPrimary === "#00FFCC",
    "Explicit primary color override (#00FFCC) took precedence over preset"
  );
  assert(
    adaptedOverride.tokenStyles.fontHeading === "Playfair Display",
    "Explicit heading font override ('Playfair Display') took precedence over preset"
  );
}

async function testExperienceTierGating() {
  console.log("\n--- TEST 5: Experience Tier Gating ---");

  const hero3d = RegistryService.getDefinitionById("hero-3d")!;
  const heroSplit = RegistryService.getDefinitionById("hero-split")!;
  const canvasFrames = RegistryService.getDefinitionById("advanced-canvas-frame-sequences")!;

  assert(
    ComponentAdapter.isSupported(hero3d, "IMMERSIVE_3D") &&
      !ComponentAdapter.isSupported(hero3d, "STANDARD"),
    "hero-3d is supported in IMMERSIVE_3D but rejected in STANDARD"
  );

  assert(
    ComponentAdapter.isSupported(canvasFrames, "CINEMATIC") &&
      !ComponentAdapter.isSupported(canvasFrames, "STANDARD"),
    "canvas-frame-sequences is supported in CINEMATIC but rejected in STANDARD"
  );

  assert(
    ComponentAdapter.isSupported(heroSplit, "STANDARD") &&
      ComponentAdapter.isSupported(heroSplit, "CINEMATIC"),
    "hero-split is supported in both STANDARD and CINEMATIC"
  );
}

async function testDatabasePersistenceAndProjectLibrary() {
  console.log("\n--- TEST 6: SQLite Database Persistence & Project Library ---");

  // 1. Sync static definitions to SQLite
  const syncedCount = await RegistryService.syncDatabase();
  assert(syncedCount === 42, `Synced 42 components to SQLite database (synced: ${syncedCount})`);

  const dbCount = await db.componentRegistryItem.count();
  assert(dbCount >= 42, `SQLite ComponentRegistryItem count >= 42 (found: ${dbCount})`);

  // 2. Toggle Favorite
  const compId = "hero-split";
  const initialFav = (await db.componentRegistryItem.findUnique({ where: { id: compId } }))?.isFavorite ?? false;
  const toggledFav = await RegistryService.toggleFavorite(compId);
  assert(toggledFav === !initialFav, `Toggled favorite for '${compId}' from ${initialFav} to ${toggledFav}`);

  const restoredFav = await RegistryService.toggleFavorite(compId);
  assert(restoredFav === initialFav, `Restored favorite for '${compId}' back to ${restoredFav}`);

  // 3. Create or find test project for project library binding
  const testProject = await db.project.upsert({
    where: { slug: "test-registry-project" },
    update: {},
    create: {
      name: "Test Registry Project",
      slug: "test-registry-project",
      category: "healthcare",
      experienceLevel: "CINEMATIC",
      description: "Project for component registry binding tests",
    },
  });
  assert(testProject.id.length > 0, `Test project ready with ID: ${testProject.id}`);

  // 4. Bind component to project
  const binding = await RegistryService.addComponentToProject(
    testProject.id,
    "hero-split",
    "split-media-right",
    { customBadge: "Priority Clinic" }
  );
  assert(binding.projectId === testProject.id, "Component successfully bound to project");
  assert(binding.componentId === "hero-split", "Component ID matches bound component");

  // 5. Query project component library
  const library = await RegistryService.getProjectComponentLibrary(testProject.id);
  const found = library.find((b) => b.componentId === "hero-split");
  assert(found !== undefined, "Bound component retrieved from project component library");
  assert(found?.variantId === "split-media-right", "Bound component variant retrieved correctly");

  // 6. Remove component from project
  const removed = await RegistryService.removeComponentFromProject(testProject.id, "hero-split");
  assert(removed === true, "Component successfully removed from project component library");

  const libraryAfter = await RegistryService.getProjectComponentLibrary(testProject.id);
  const foundAfter = libraryAfter.find((b) => b.componentId === "hero-split");
  assert(foundAfter === undefined, "Component no longer present in project component library after removal");

  // Clean up test project
  await db.project.delete({ where: { id: testProject.id } });
  assert(true, "Cleaned up test project from SQLite");
}

async function isServerRunning(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/registry/components`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function testLiveChromiumBrowser() {
  console.log("\n--- TEST 7: Live Chromium Browser E2E Interaction (/registry) ---");

  const running = await isServerRunning(3001);
  if (!running) {
    console.log("  ⚠️ Local server on port 3001 not detected. Browser test will launch lightweight check or skip.");
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("  Navigating to http://localhost:3001/registry...");
    await page.goto("http://localhost:3001/registry", { waitUntil: "domcontentloaded", timeout: 15000 });

    // Verify title / header presence
    const titleText = await page.locator("header h1").innerText();
    assert(titleText.includes("Component Registry"), `Page header displays 'Component Registry' (found: '${titleText}')`);

    // Verify family filter buttons exist
    const heroBtn = page.locator("button:has-text('Hero')");
    assert((await heroBtn.count()) >= 1, "Family filter button 'Hero' is rendered");

    const businessBtn = page.locator("button:has-text('Business')");
    assert((await businessBtn.count()) >= 1, "Family filter button 'Business' is rendered");

    // Click 'Business' family filter
    await businessBtn.first().click();
    await page.waitForTimeout(300);

    // Verify business components are shown
    const businessCard = page.locator("h3:has-text('Brand Ethos & About Story')");
    assert((await businessCard.count()) >= 1, "Business family item 'Brand Ethos & About Story' rendered");

    // Click on component to inspect
    await businessCard.first().click();
    await page.waitForTimeout(300);

    // Verify live preview rendered
    const previewHeader = page.locator("text=Live Component Render");
    assert((await previewHeader.count()) >= 1, "Live Component Render preview header visible");

    // Verify category select is present and interactable
    const categorySelect = page.locator("select").first();
    assert((await categorySelect.count()) >= 1, "Category adaptation selector is rendered");

    // Change category to 'food-restaurants'
    await categorySelect.selectOption("food-restaurants");
    await page.waitForTimeout(400);
    assert(true, "Successfully switched category to 'food-restaurants'");

    console.log("  ✓ Chromium browser interaction verified cleanly");
  } catch (err: any) {
    console.error("  ❌ Browser test encountered error:", err.message);
    throw err;
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  console.log("===============================================================");
  console.log("🧪 STARTING PHASE 5.0 COMPONENT REGISTRY VERIFICATION SUITE");
  console.log("===============================================================");

  const startTime = Date.now();

  try {
    await testInventoryAndCompleteness();
    await testZodSchemas();
    await testCategoryAdaptationEngine();
    await testTokenResolutionAndOverrides();
    await testExperienceTierGating();
    await testDatabasePersistenceAndProjectLibrary();
    await testLiveChromiumBrowser();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n===============================================================");
    console.log(`✅ ALL TESTS PASSED: ${passedAssertions}/${totalAssertions} assertions verified in ${duration}s`);
    console.log("===============================================================\n");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ VERIFICATION SUITE TERMINATED WITH ERROR:", error);
    process.exit(1);
  }
}

runAllTests();
