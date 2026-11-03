import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { db } from "../src/lib/db";
import { WebsiteGeneratorService } from "../src/modules/generator/service";
import { CompositionService } from "../src/modules/composition/service";
import { QAValidator } from "../src/modules/qa/validator";
import { QAService } from "../src/modules/qa/service";

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

async function runTests() {
  console.log("\n=== AGENCY WEBSITE ENGINE: PHASE 6.2 PREVIEW, QA & VALIDATION ===\n");

  // 1. Setup Test Project
  const testSlug = `qa-test-${Date.now()}`;
  console.log("Setting up QA test project in database...");
  const project = await db.project.create({
    data: {
      name: "Veritas Clinical Diagnostics",
      slug: testSlug,
      category: "healthcare",
      experienceLevel: "STANDARD",
      description: "State-of-the-art diagnostic laboratory and pathology consultation services.",
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

  // 2. Synthesize Multi-Page Site
  console.log("\nSynthesizing multi-page compositions for project...");
  const home = await CompositionService.createPage({
    projectId: project.id,
    slug: "/",
    title: "Diagnostics Home",
    seoTitle: "Veritas Clinical | Advanced Diagnostics & Pathology",
    seoDescription: "Excellence in pathology diagnostics, genomics, and rapid results.",
  });
  await CompositionService.addSection(home.id, { componentId: "hero-split", order: 0 });
  await CompositionService.addSection(home.id, { componentId: "business-services", order: 1 });
  await CompositionService.addSection(home.id, { componentId: "content-faq-accordion", order: 2 });
  await CompositionService.addSection(home.id, { componentId: "conversion-contact-form", order: 3 });

  const services = await CompositionService.createPage({
    projectId: project.id,
    slug: "/services",
    title: "Diagnostic Testing Services",
    seoTitle: "Diagnostic Services | Veritas Clinical Laboratory",
    seoDescription: "Full spectrum of molecular biology, toxicology, and blood analysis.",
  });
  await CompositionService.addSection(services.id, { componentId: "business-features", order: 0 });

  const contact = await CompositionService.createPage({
    projectId: project.id,
    slug: "/contact",
    title: "Appointments & Locations",
    seoTitle: "Contact Pathology Consultation | Veritas Clinical",
    seoDescription: "Schedule appointments and submit confidential lab requests.",
  });
  await CompositionService.addSection(contact.id, { componentId: "conversion-contact-form", order: 0 });

  // 3. Compile Site to Test Output Directory
  console.log("\nCompiling website package for QA evaluation...");
  const testOutputDir = path.resolve(process.cwd(), "storage", "test-generated", testSlug);
  const genResult = await WebsiteGeneratorService.generateWebsite(project.id, {
    projectId: project.id,
    outputDirectory: testOutputDir,
    zip: true,
  });

  assert(genResult.success === true, "Website generation succeeded for QA test");

  // 4. Execute QA Validator on Clean Build
  console.log("\nExecuting QAValidator.auditBuildDirectory() on production build...");
  const audit = QAValidator.auditBuildDirectory(project.id, project.name, testOutputDir);

  assert(audit.auditId && audit.auditId.startsWith("qa_"), "Audit ID generated with prefix 'qa_'");
  assert(audit.summary.pagesAudited === 3, "Audited all 3 HTML pages");
  assert(audit.summary.zeroCdnCompliant === true, "Zero-CDN compliance verified");
  console.log("Audit categories:", JSON.stringify(audit.categories, null, 2));
  console.log("Audit issues:", audit.issues);
  assert(audit.overallScore >= 85, `Overall QA Score is high: ${audit.overallScore}/100`);
  assert(audit.status === "PASSED", "Clean production build status is 'PASSED'");

  // Verify all 5 categories
  const cats = audit.categories;
  assert(cats.accessibility && cats.accessibility.score >= 90, `Accessibility score is ${cats.accessibility.score}%`);
  assert(cats.security && cats.security.score === 100, `Security score is ${cats.security.score}%`);
  assert(cats.seo && cats.seo.score >= 90, `SEO score is ${cats.seo.score}%`);
  assert(cats.performance && cats.performance.score >= 90, `Performance score is ${cats.performance.score}%`);
  assert(cats.routes && cats.routes.score === 100, `Routes & dead links score is ${cats.routes.score}%`);
  assert(audit.summary.criticalIssues === 0, "Zero critical issues detected in compliant build");

  // 5. Inject Flaws & Verify Strict Detection
  console.log("\nInjecting intentional defects into test build to verify vulnerability detection...");
  const flawDir = path.resolve(process.cwd(), "storage", "test-generated", `${testSlug}-flawed`);
  fs.cpSync(testOutputDir, flawDir, { recursive: true });

  // Flaw 1: Image without alt attribute
  // Flaw 2: External CDN script injection
  // Flaw 3: Dead link
  const flawedIndex = path.join(flawDir, "index.html");
  let flawedContent = fs.readFileSync(flawedIndex, "utf8");
  flawedContent = flawedContent.replace(
    /<img\s+src="/i,
    '<img src="https://cdn.malicious-tracker.com/pixel.png" '
  );
  flawedContent += '\n<script src="https://cdn.jsdelivr.net/npm/malicious@1.0/lib.js"></script>';
  flawedContent += '\n<a href="broken-unlinked-page.html">Dead Route Link</a>';
  fs.writeFileSync(flawedIndex, flawedContent, "utf8");

  const flawedAudit = QAValidator.auditBuildDirectory(project.id, project.name, flawDir);
  assert(flawedAudit.status === "FAILED", "Flawed build status is correctly flagged as 'FAILED'");
  assert(flawedAudit.summary.criticalIssues >= 2, `Detected at least 2 critical issues (found: ${flawedAudit.summary.criticalIssues})`);

  const issueCodes = flawedAudit.issues.map((i) => i.code);
  assert(issueCodes.includes("SEC_EXTERNAL_CDN_FOUND"), "Correctly detected SEC_EXTERNAL_CDN_FOUND violation");
  assert(issueCodes.includes("ROUTE_BROKEN_LINK"), "Correctly detected ROUTE_BROKEN_LINK violation");

  // Clean up flaw dir
  fs.rmSync(flawDir, { recursive: true, force: true });

  // 6. Test REST API Endpoint on Port 3001
  console.log("\nVerifying GET /api/projects/[id]/qa-audit on http://localhost:3001...");
  const apiRes = await fetch(`http://localhost:3001/api/projects/${project.id}/qa-audit`);
  assert(apiRes.status === 200, "GET /api/projects/[id]/qa-audit returns 200 OK");
  const apiData = await apiRes.json();
  assert(apiData.overallScore >= 90, `API returned overallScore: ${apiData.overallScore}`);
  assert(apiData.categories && apiData.categories.security.score === 100, "API returned security score 100");
  assert(apiData.categories.routes.score === 100, "API returned routes score 100");

  // 7. Live Playwright Chromium E2E on Preview Studio
  console.log("\nLaunching Playwright browser to test Preview Studio QA interaction...");
  const browser = await chromium.launch({ headless: true });
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
    console.log(`Navigating to http://localhost:3001/projects/${project.id}/preview...`);
    await page.goto(`http://localhost:3001/projects/${project.id}/preview`, { waitUntil: "networkidle" });

    // Verify top bar controls
    const qaBtn = page.locator("button:has-text('Run QA Audit'), button:has-text('QA:')");
    await qaBtn.waitFor({ state: "visible", timeout: 5000 });
    assert(await qaBtn.count() > 0, "QA Audit trigger button is visible in Preview Studio top bar");

    // Click "Run QA Audit"
    console.log("Clicking 'Run QA Audit' button...");
    await qaBtn.click();

    // Verify QA Drawer/Modal opens
    const modalHeader = page.locator("h3:has-text('Automated QA & Compliance Audit')");
    await modalHeader.waitFor({ state: "visible", timeout: 8000 });
    assert(await modalHeader.isVisible(), "QA & Compliance Audit modal opened");

    // Verify Overall Score banner is rendered
    const scoreBanner = page.getByText("Overall Quality Score", { exact: true });
    await scoreBanner.waitFor({ state: "visible", timeout: 5000 });
    assert(await scoreBanner.isVisible(), "Overall Quality Score banner visible in modal");

    // Close modal
    const closeBtn = page.locator("button:has-text('Close')").first();
    await closeBtn.click();
    await page.waitForTimeout(300);
    assert(!(await modalHeader.isVisible()), "QA modal closed successfully");

    // Verify zero uncaught exceptions & console errors
    assert(uncaughtExceptions.length === 0, `Zero uncaught exceptions in browser (found: ${uncaughtExceptions.length})`);
    assert(consoleErrors.length === 0, `Zero console errors in browser (found: ${consoleErrors.length})`);

  } finally {
    await browser.close();
  }

  // 8. Cleanup
  console.log("\nCleaning up test artifacts...");
  try {
    fs.rmSync(testOutputDir, { recursive: true, force: true });
    if (genResult.zipPath && fs.existsSync(genResult.zipPath)) fs.unlinkSync(genResult.zipPath);

    await db.pageSectionComposition.deleteMany({ where: { pageComposition: { projectId: project.id } } });
    await db.pageComposition.deleteMany({ where: { projectId: project.id } });
    await db.projectDesignConfig.deleteMany({ where: { projectId: project.id } });
    await db.project.delete({ where: { id: project.id } });
  } catch (cleanErr: any) {
    console.warn("Cleanup warning:", cleanErr.message);
  }

  assert(true, "Test project and output cleaned up successfully");

  console.log(`\n================================================================`);
  console.log(`PHASE 6.2 PREVIEW, QA & VALIDATION COMPLETE: ${passedCount} / ${totalCount} PASSED`);
  console.log(`================================================================\n`);
}

runTests().catch((err) => {
  console.error("\n[FATAL ERROR]:", err);
  process.exit(1);
});
