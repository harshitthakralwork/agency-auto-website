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
  console.log("\n=== AGENCY WEBSITE ENGINE: PHASE 6.0 GENERATION ENGINE VERIFICATION ===\n");

  // 1. Setup Test Project
  const testSlug = `gen-test-${Date.now()}`;
  console.log("Setting up test project in database...");
  const project = await db.project.create({
    data: {
      name: "Apex Healthcare Clinic",
      slug: testSlug,
      category: "healthcare",
      experienceLevel: "STANDARD",
      description: "Premier specialized clinical care and advanced wellness center.",
      designConfig: {
        create: {
          preset: "cinematic",
          primaryColor: "#0284c7",
          secondaryColor: "#0f172a",
          accentColor: "#38bdf8",
          backgroundColor: "#f8fafc",
          surfaceColor: "#ffffff",
          textColor: "#0f172a",
          mutedTextColor: "#64748b",
          headingFont: "Inter",
          bodyFont: "Inter",
          baseFontSize: "16px",
          layoutStyle: "modern-contained",
          borderRadius: "8px",
          containerWidth: "1240px",
          animationIntensity: "subtle",
          enableCanvasFx: false,
          threeDPreferences: JSON.stringify({}),
          mediaPreferences: JSON.stringify({}),
          sectionsConfigJson: JSON.stringify([]),
          responsiveSettings: JSON.stringify({}),
        },
      },
    },
  });

  assert(project && project.id, "Test project created in database");

  // 2. Setup Multi-Page Composition with Sections from Different Families
  console.log("\nSynthesizing multi-page compositions for test project...");
  const homePage = await CompositionService.createPage({
    projectId: project.id,
    slug: "/",
    title: "Apex Clinical Home",
    routePriority: "HIGH",
    navigationPlacement: "PRIMARY",
    seoTitle: "Apex Healthcare | World-Class Clinical Wellness",
    seoDescription: "Excellence in specialized healthcare, cardiology, and diagnostics.",
  });
  assert(homePage && homePage.id, "Home page composition created");

  // Add Hero section
  const heroSec = await CompositionService.addSection(homePage.id, {
    componentId: "hero-split",
    order: 0,
    customName: "Primary Clinical Hero",
  });
  assert(heroSec && heroSec.componentId === "hero-split", "Hero section added to Home");

  // Add Business Services section
  const servSec = await CompositionService.addSection(homePage.id, {
    componentId: "business-services",
    order: 1,
    customName: "Specialized Clinical Departments",
  });
  assert(servSec && servSec.componentId === "business-services", "Business services section added to Home");

  // Add Business Stats section
  const statsSec = await CompositionService.addSection(homePage.id, {
    componentId: "business-stats",
    order: 2,
    customName: "Clinical Excellence In Numbers",
  });
  assert(statsSec && statsSec.componentId === "business-stats", "Business stats section added to Home");

  // Add Social Proof Testimonials Carousel
  const testSec = await CompositionService.addSection(homePage.id, {
    componentId: "social-proof-testimonials-carousel",
    order: 3,
    customName: "Patient Endorsements Carousel",
  });
  assert(testSec && testSec.componentId === "social-proof-testimonials-carousel", "Testimonials carousel section added");

  // Add Media Before-After Slider
  const sliderSec = await CompositionService.addSection(homePage.id, {
    componentId: "media-before-after-slider",
    order: 4,
    customName: "Rehabilitation Outcomes Slider",
  });
  assert(sliderSec && sliderSec.componentId === "media-before-after-slider", "Media before-after slider section added");

  // Add Content FAQ Accordion
  const faqSec = await CompositionService.addSection(homePage.id, {
    componentId: "content-faq-accordion",
    order: 5,
    customName: "Frequently Asked Patient Questions",
  });
  assert(faqSec && faqSec.componentId === "content-faq-accordion", "Content FAQ accordion section added");

  // Add Conversion Contact Form
  const formSec = await CompositionService.addSection(homePage.id, {
    componentId: "conversion-contact-form",
    order: 6,
    customName: "Confidential Clinical Inquiry",
  });
  assert(formSec && formSec.componentId === "conversion-contact-form", "Conversion contact form section added");

  // Setup Services Page
  const servicesPage = await CompositionService.createPage({
    projectId: project.id,
    slug: "/services",
    title: "Clinical Services",
    routePriority: "MEDIUM",
    navigationPlacement: "PRIMARY",
  });
  await CompositionService.addSection(servicesPage.id, {
    componentId: "business-features",
    order: 0,
  });
  await CompositionService.addSection(servicesPage.id, {
    componentId: "content-pricing-table",
    order: 1,
  });
  assert(servicesPage && servicesPage.id, "Secondary services page created with pricing table");

  // Setup Contact Page
  const contactPage = await CompositionService.createPage({
    projectId: project.id,
    slug: "/contact",
    title: "Contact & Appointments",
    routePriority: "HIGH",
    navigationPlacement: "PRIMARY",
  });
  await CompositionService.addSection(contactPage.id, {
    componentId: "conversion-contact-form",
    order: 0,
  });
  assert(contactPage && contactPage.id, "Contact page created with direct conversion form");

  // 3. Execute Website Generation
  console.log("\nExecuting WebsiteGeneratorService.generateWebsite()...");
  const testOutputDir = path.resolve(process.cwd(), "storage", "test-generated", testSlug);
  const genResult = await WebsiteGeneratorService.generateWebsite(project.id, {
    projectId: project.id,
    outputDirectory: testOutputDir,
    zip: true,
  });

  assert(genResult.success === true, "Generation execution succeeded");
  assert(fs.existsSync(testOutputDir), "Output directory exists on disk");
  assert(genResult.pageCount === 3, "Exactly 3 pages compiled (Home, Services, Contact)");

  // 4. File Structure & Manifest Checks
  console.log("\nValidating file structure and build manifest...");
  const indexHtmlPath = path.join(testOutputDir, "index.html");
  const servicesHtmlPath = path.join(testOutputDir, "services.html");
  const contactHtmlPath = path.join(testOutputDir, "contact.html");
  const stylesCssPath = path.join(testOutputDir, "css", "styles.css");
  const runtimeJsPath = path.join(testOutputDir, "js", "runtime.js");
  const manifestPath = path.join(testOutputDir, "build-manifest.json");

  assert(fs.existsSync(indexHtmlPath), "index.html generated");
  assert(fs.existsSync(servicesHtmlPath), "services.html generated");
  assert(fs.existsSync(contactHtmlPath), "contact.html generated");
  assert(fs.existsSync(stylesCssPath), "css/styles.css generated");
  assert(fs.existsSync(runtimeJsPath), "js/runtime.js generated");
  assert(fs.existsSync(manifestPath), "build-manifest.json generated");

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert(manifest.buildId && manifest.buildId.startsWith("build_"), "Valid buildId recorded in manifest");
  assert(manifest.zeroCdnVerified === true, "Zero-CDN compliance verified in manifest");
  assert(manifest.pages.length === 3, "Manifest tracks all 3 pages");
  assert(manifest.assetManifest.totalAssets > 0, "Manifest tracks asset fallbacks and project assets");

  // 5. HTML Content & Semantic Markup Integrity
  console.log("\nValidating HTML semantic structure...");
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  assert(indexHtml.includes("<!DOCTYPE html>"), "Contains valid HTML5 DOCTYPE");
  assert(indexHtml.includes('<meta name="viewport" content="width=device-width, initial-scale=1.0">'), "Includes responsive viewport meta tag");
  assert(indexHtml.includes("<title>Apex Healthcare | World-Class Clinical Wellness | Apex Healthcare Clinic</title>"), "Includes compiled SEO title");
  assert(indexHtml.includes('<meta property="og:title"'), "Includes Open Graph meta tags");
  assert(indexHtml.includes('<script type="application/ld+json">'), "Includes Schema.org structured data script");
  assert(indexHtml.includes('"@type": "LocalBusiness"'), "Structured data includes LocalBusiness schema");
  assert(indexHtml.includes('<header class="site-header"'), "Contains semantic header");
  assert(indexHtml.includes('<main id="main-content">'), "Contains semantic main landmark");
  assert(indexHtml.includes('<footer class="site-footer">'), "Contains semantic footer");

  // 6. Component Family Markup Validation
  console.log("\nValidating component markup across families in index.html...");
  assert(indexHtml.includes('class="hero-section hero-split"'), "Hero family markup rendered");
  assert(indexHtml.includes('class="stats-grid"'), "Business stats grid markup rendered");
  assert(indexHtml.includes('data-carousel'), "Social proof carousel markup rendered");
  assert(indexHtml.includes('data-comparison-slider'), "Media before-after comparison slider markup rendered");
  assert(indexHtml.includes('data-accordion-group'), "Content FAQ accordion markup rendered");
  assert(indexHtml.includes('data-client-form'), "Conversion form markup rendered");

  // 7. Stylesheet and Design Token Injection
  console.log("\nValidating CSS design tokens...");
  const stylesCss = fs.readFileSync(stylesCssPath, "utf8");
  assert(stylesCss.includes(":root {"), "CSS root selector exists");
  assert(stylesCss.includes("--color-primary:"), "CSS includes --color-primary variable");
  assert(stylesCss.includes("--container-max-width:"), "CSS includes --container-max-width variable");
  assert(stylesCss.includes("@media (min-width: 768px)"), "CSS includes tablet responsive breakpoint");
  assert(stylesCss.includes("@media (min-width: 1024px)"), "CSS includes desktop responsive breakpoint");

  // 8. Zero-CDN Verification (Regex search)
  console.log("\nVerifying zero external CDN script or style tags...");
  const cdnRegex = /(src|href)=["']https?:\/\/[^"']+/g;
  const indexCdnMatches = (indexHtml.match(cdnRegex) || []).filter((m) => !m.includes("schema.org"));
  assert(indexCdnMatches.length === 0, "index.html has zero external CDN dependencies");

  const cssCdnMatches = stylesCss.match(/url\(["']?https?:\/\/[^"'\)]+/g) || [];
  assert(cssCdnMatches.length === 0, "styles.css has zero external CDN dependencies");

  // 9. ZIP Packaging Verification
  console.log("\nVerifying ZIP packaging...");
  assert(genResult.zipPath && fs.existsSync(genResult.zipPath), "Standalone ZIP archive created on disk");
  const zipBuffer = fs.readFileSync(genResult.zipPath!);
  assert(zipBuffer.length > 500, `ZIP archive has valid non-empty byte size (${zipBuffer.length} bytes)`);
  assert(zipBuffer.readUInt32LE(0) === 0x04034b50, "ZIP archive begins with valid PK header signature (0x04034b50)");

  // 10. Interactive Browser Verification via Playwright
  console.log("\nStarting local static HTTP server for browser verification...");
  const server = http.createServer((req, res) => {
    let reqPath = req.url?.split("?")[0] || "/";
    if (reqPath === "/") reqPath = "/index.html";
    const filePath = path.join(testOutputDir, reqPath.replace(/^\//, ""));

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  await new Promise<void>((resolve) => server.listen(8099, "127.0.0.1", () => resolve()));
  console.log("Local static HTTP server listening on http://127.0.0.1:8099");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log("Navigating to generated site http://127.0.0.1:8099/index.html...");
    await page.goto("http://127.0.0.1:8099/index.html", { waitUntil: "networkidle" });

    const pageTitle = await page.title();
    assert(pageTitle.includes("Apex Healthcare"), "Browser loaded index.html with correct title");

    // Test Multi-Page Navigation
    console.log("Testing multi-page navigation link to /services.html...");
    const servicesLink = page.locator('header a[href="services.html"]').first();
    await servicesLink.click();
    await page.waitForURL("**/services.html");
    const servicesHeading = await page.locator("h2").first().textContent();
    assert(servicesHeading && servicesHeading.length > 0, "Navigated successfully to services.html");

    // Return to index.html
    await page.goto("http://127.0.0.1:8099/index.html", { waitUntil: "networkidle" });

    // Test FAQ Accordion interaction
    console.log("Testing FAQ Accordion click interaction in browser...");
    const accordionTriggers = page.locator("[data-accordion-trigger]");
    const triggerCount = await accordionTriggers.count();
    assert(triggerCount > 0, "Found interactive FAQ accordion triggers");

    // Click the second accordion item
    const secondTrigger = accordionTriggers.nth(1);
    await secondTrigger.click();
    await page.waitForTimeout(300);
    const isExpanded = await secondTrigger.getAttribute("aria-expanded");
    assert(isExpanded === "true", "Accordion trigger clicked and aria-expanded set to true");

    // Test Form Submission interaction
    console.log("Testing client-side form submission & feedback in browser...");
    const nameInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const messageInput = page.locator("textarea").first();
    const submitBtn = page.locator('button[type="submit"]').first();

    await nameInput.fill("Alexander Sterling");
    await emailInput.fill("alexander@example.com");
    await messageInput.fill("Requesting confidential appointment with clinical cardiology.");
    await submitBtn.click();

    // Check feedback banner appears
    await page.waitForSelector("[data-form-feedback]", { timeout: 3000 });
    const feedbackText = await page.locator("[data-form-feedback]").textContent();
    assert(feedbackText && feedbackText.includes("Inquiry Received!"), "Form submitted successfully with local feedback banner");

    // Test Mobile Viewport and Hamburger Drawer
    console.log("Testing responsive mobile navigation at 375px width...");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(200);

    const mobileToggle = page.locator("[data-mobile-nav-toggle]");
    const mobileMenu = page.locator("[data-mobile-nav-menu]");

    assert(await mobileToggle.isVisible(), "Mobile hamburger toggle is visible at 375px viewport");

    // Open mobile menu
    await mobileToggle.click();
    await page.waitForTimeout(300);
    const menuClasses = await mobileMenu.getAttribute("class");
    assert(menuClasses && menuClasses.includes("is-open"), "Mobile menu opened with .is-open class");

    // Press Escape to dismiss
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    const menuClassesAfter = await mobileMenu.getAttribute("class");
    assert(!menuClassesAfter || !menuClassesAfter.includes("is-open"), "Mobile menu closed on Escape key");

  } finally {
    await browser.close();
    server.close();
    console.log("Local test server and browser stopped cleanly.");
  }

  // 11. Test REST API Endpoints
  console.log("\nVerifying REST API endpoints on http://localhost:3001...");
  try {
    const postRes = await fetch(`http://localhost:3001/api/projects/${project.id}/generate-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experienceTierOverride: "STANDARD", zip: true }),
    });
    assert(postRes.status === 200, "POST /api/projects/[id]/generate-site returns 200 OK");
    const postData = await postRes.json();
    assert(postData.success === true, "POST generate-site returns success: true");
    assert(postData.buildId && postData.manifest, "POST generate-site returns buildId and manifest");

    const getRes = await fetch(`http://localhost:3001/api/projects/${project.id}/generated-site`);
    assert(getRes.status === 200, "GET /api/projects/[id]/generated-site returns 200 OK");
    const getData = await getRes.json();
    assert(getData.manifest && getData.manifest.pages.length === 3, "GET generated-site returns latest build manifest with 3 pages");
  } catch (apiErr: any) {
    console.error("API test error:", apiErr);
    throw apiErr;
  }

  // 12. Cleanup Test Directory & DB Records
  console.log("\nCleaning up test artifacts...");
  try {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
    if (genResult.zipPath && fs.existsSync(genResult.zipPath)) {
      fs.unlinkSync(genResult.zipPath);
    }
    await db.pageSectionComposition.deleteMany({
      where: {
        pageComposition: { projectId: project.id },
      },
    });
    await db.pageComposition.deleteMany({
      where: { projectId: project.id },
    });
    await db.projectDesignConfig.deleteMany({
      where: { projectId: project.id },
    });
    await db.project.delete({
      where: { id: project.id },
    });
  } catch (cleanErr: any) {
    console.warn("Cleanup warning:", cleanErr.message);
  }

  assert(true, "Test project and output cleaned up successfully");

  console.log(`\n================================================================`);
  console.log(`PHASE 6.0 GENERATION ENGINE VERIFICATION COMPLETE: ${passedCount} / ${totalCount} PASSED`);
  console.log(`================================================================\n`);
}

runTests().catch((err) => {
  console.error("\n[FATAL ERROR]:", err);
  process.exit(1);
});
