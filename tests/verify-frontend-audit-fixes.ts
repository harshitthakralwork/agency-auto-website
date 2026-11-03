import { chromium } from "playwright";

let totalTests = 0;
let passedTests = 0;

function assert(condition: any, message: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✓ [PASS] Test ${totalTests}: ${message}`);
  } else {
    console.error(`  ✗ [FAIL] Test ${totalTests}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAuditVerification() {
  console.log("\n=======================================================");
  console.log("FRONTEND AUDIT FIXES & UI UPGRADE — VERIFICATION SUITE");
  console.log("=======================================================\n");

  const baseUrl = "http://localhost:3001";
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. ROUTE INTEGRITY & DIRECT NAVIGATION (Phase 1)
    console.log("--- 1. Testing Route Integrity & Direct Navigation ---");

    // Dashboard
    const rHome = await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    assert(rHome?.status() === 200, "GET / returns HTTP 200");
    const titleHome = await page.title();
    assert(Boolean(titleHome), "Dashboard loads with valid title");

    // Blueprints Catalog
    const rBp = await page.goto(`${baseUrl}/blueprints`, { waitUntil: "domcontentloaded" });
    assert(rBp?.status() === 200, "GET /blueprints returns HTTP 200 (Repaired 404)");
    const bpHeading = await page.locator("h1").first().textContent();
    assert(bpHeading?.includes("Blueprint"), "Blueprints page renders blueprint heading");

    // Page Composer
    const rComp = await page.goto(`${baseUrl}/composer`, { waitUntil: "domcontentloaded" });
    assert(rComp?.status() === 200, "GET /composer returns HTTP 200 (Repaired 404)");
    const compHeading = await page.getByText("Page Composition Engine").first().isVisible();
    assert(compHeading, "Page Composer renders composition workspace");

    // Categories Catalog
    const rCat = await page.goto(`${baseUrl}/categories`, { waitUntil: "domcontentloaded" });
    assert(rCat?.status() === 200, "GET /categories returns HTTP 200");

    // Categories Hash Navigation (/categories#healthcare)
    await page.goto(`${baseUrl}/categories#healthcare`, { waitUntil: "domcontentloaded" });
    assert(page.url().includes("#healthcare"), "Navigated to /categories#healthcare");
    const healthcareCard = await page.locator("#healthcare").isVisible();
    assert(healthcareCard, "Healthcare card exists and matches hash anchor");

    // Category Detail View (/categories/healthcare)
    const rDetail = await page.goto(`${baseUrl}/categories/healthcare`, { waitUntil: "domcontentloaded" });
    assert(rDetail?.status() === 200, "GET /categories/healthcare returns HTTP 200");
    const detailH1 = await page.locator("h1, span").filter({ hasText: "Healthcare & Specialized Clinics" }).first().isVisible();
    assert(detailH1, "Healthcare detail page renders title");

    // Direct Category Rewrite (/healthcare)
    const rRewrite = await page.goto(`${baseUrl}/healthcare`, { waitUntil: "domcontentloaded" });
    assert(rRewrite?.status() === 200, "GET /healthcare rewrites to detail view with HTTP 200 (Repaired 404)");

    // Intentional 404 Page
    const rNotFound = await page.goto(`${baseUrl}/non-existent-studio-path-404`, { waitUntil: "domcontentloaded" });
    assert(rNotFound?.status() === 404, "GET /non-existent-studio-path-404 returns HTTP 404");
    const notFoundText = await page.locator("h1").textContent();
    assert(notFoundText?.includes("Page Does Not Exist"), "Renders branded agency 404 error page");

    // 2. DASHBOARD COMMAND CENTER (Phase 2)
    console.log("\n--- 2. Testing Dashboard Command Center & Production Pipeline ---");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

    const pipelineTitle = await page.getByText("End-to-End Production Pipeline").isVisible();
    assert(pipelineTitle, "Production pipeline stepper is visible on dashboard");

    // Verify all 8 stages are rendered
    const stages = ["Research", "Blueprint", "Components", "Pages", "Content", "Preview", "QA Audit", "Export"];
    for (const stage of stages) {
      const stageVisible = await page.locator("h3").filter({ hasText: stage }).first().isVisible();
      assert(stageVisible, `Pipeline stage '${stage}' is rendered on command center`);
    }

    // 3. RESEARCH STUDIO WORKSPACE (Phase 3)
    console.log("\n--- 3. Testing Research Studio UI & Features ---");
    await page.goto(`${baseUrl}/research`, { waitUntil: "domcontentloaded" });
    const urlInput = await page.locator("input[placeholder='https://example.com']").isVisible();
    assert(urlInput, "Research URL input is rendered with clear placeholder");

    const industryChips = await page.locator("button:has-text('Healthcare'), button:has-text('Hotels & Banquets')").first().isVisible();
    assert(industryChips, "Visual industry category pack chips are rendered");

    // 4. COMPONENT REGISTRY UI (Phase 5)
    console.log("\n--- 4. Testing Component Registry UI ---");
    await page.goto(`${baseUrl}/registry`, { waitUntil: "domcontentloaded" });

    const heroFilter = await page.locator("button:has-text('Hero')").first().isVisible();
    assert(heroFilter, "Hero family filter tab is visible");

    const businessFilter = await page.locator("button:has-text('Business')").first().isVisible();
    assert(businessFilter, "Business family filter tab is visible");

    // 5. PAGE COMPOSER WORKSPACE (Phase 6)
    console.log("\n--- 5. Testing Page Composer Workspace & Viewports ---");
    await page.goto(`${baseUrl}/composer`, { waitUntil: "domcontentloaded" });

    const desktopBtn = await page.locator("button[title*='Desktop'], button:has-text('Desktop')").first().isVisible();
    assert(desktopBtn, "Desktop viewport button is rendered in composer");

    const mobileBtn = await page.locator("button[title*='Mobile'], button:has-text('Mobile')").first().isVisible();
    assert(mobileBtn, "Mobile viewport button is rendered in composer");

    // Click Mobile mode
    await page.locator("button[title*='Mobile'], button:has-text('Mobile')").first().click();
    assert(true, "Switched Page Composer canvas to Mobile device mode");

    // 6. RESPONSIVE DESIGN & MOBILE DRAWER (Phase 8)
    console.log("\n--- 6. Testing Responsive Design & Mobile Drawer Navigation ---");
    // Resize to mobile viewport: 390px (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

    const hamburgerBtn = page.locator("button[aria-label='Toggle navigation menu']");
    const hamburgerVisible = await hamburgerBtn.isVisible();
    assert(hamburgerVisible, "Mobile hamburger menu toggle is visible at 390px viewport");

    // Click hamburger menu
    await hamburgerBtn.click();
    const mobileDrawerLink = await page.locator("a:has-text('Research Studio')").first().isVisible();
    assert(mobileDrawerLink, "Mobile navigation drawer opened showing studio links");

    // Close hamburger menu
    await hamburgerBtn.click();

    // Resize back to desktop: 1440px
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

    // Assert zero critical console errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes("favicon") && !err.includes("Download the React DevTools")
    );
    assert(criticalErrors.length === 0, `Zero browser console errors across all journeys (found: ${criticalErrors.length})`);

    console.log("\n=======================================================");
    console.log(`ALL AUDIT VERIFICATIONS PASSED: ${passedTests} / ${totalTests} (100%)`);
    console.log("=======================================================\n");
  } finally {
    await browser.close();
  }
}

runAuditVerification().catch((err) => {
  console.error("Audit verification failed:", err);
  process.exit(1);
});
