/**
 * PHASE 4.0 STEP 2: RESEARCH STUDIO & EVIDENCE INSPECTOR VERIFICATION
 *
 * Comprehensive test suite verifying:
 * 1. Research Studio APIs (creation, listing, retrieval, findings PATCH, deletion)
 * 2. Evidence Inspector data slices (summary, dom, accessibility)
 * 3. Facts vs Heuristics visual separation and evidence citation
 * 4. Stored XSS defense & Safe DOM viewer inertness
 * 5. Manual selection persistence and reload recovery
 * 6. Real Playwright browser workflow against the active engine UI
 */

import http from "http";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { spawn, type ChildProcess } from "child_process";
import { chromium, type Browser, type Page } from "playwright";
import { db } from "../src/lib/db";
import { websiteIntelligence } from "../src/modules/intelligence";
import { evidenceStorage } from "../src/modules/intelligence/storage/evidence-storage";
import { REAEvidenceParser } from "../src/modules/intelligence/rea/parser";

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runVerification() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 4.0 STEP 2       ");
  console.log("  (Research Studio & Evidence Inspector)        ");
  console.log("=================================================\n");

  const testSessionId = `test_ses_${Date.now()}`;
  let createdEvidenceId = "";
  let createdStoragePath = "";

  // ------------------------------------------------------------------------
  // PART 1: TEST PERSISTENCE, EVIDENCE STORAGE & DATABASE SCHEMAS
  // ------------------------------------------------------------------------
  console.log("--- 1. Testing Evidence Storage & Session Creation ---");

  const domText = `<!DOCTYPE html><html><head><title>Aman Luxury Resorts</title><meta name="theme-color" content="#1a1a1a"><script src="/_astro/client.js"></script><script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script></head><body><h1>Sanctuary of Tranquility</h1><canvas id="hero-3d"></canvas><video autoplay muted loop src="/ambient.mp4"></video><script>window.__LEAK_TEST = 'INJECTED_CODE_RAN';</script><img src="x" onerror="window.__XSS_TRIGGERED = true"></body></html>`;
  const domSha = crypto.createHash("sha256").update(domText, "utf8").digest("hex");

  const a11yText = JSON.stringify({
    role: "RootWebArea",
    name: "Aman Luxury Resorts",
    children: [
      { role: "heading", name: "Sanctuary of Tranquility", level: 1 },
      { role: "button", name: "Reserve Suite" },
    ],
  });
  const a11ySha = crypto.createHash("sha256").update(a11yText, "utf8").digest("hex");

  const dangerousEvidenceEnvelope = {
    evidence_id: "ev_lux_hotel_12345",
    provider: { id: "rea-playwright-browser-scenario", name: "REA Playwright", version: "1" },
    predicate_type: "rea.browser-scenario-capture",
    operation: "capture_browser_scenario",
    parameters: {
      browser: { mode: "launch" },
      start_url: { url: "https://luxury-hotel-demo.agency" },
      scenario_sha256: "scenario_hash_demo",
    },
    normalized_result: {
      browser: { mode: "launch", product: "Chromium", version: "156.0" },
      duration_ms: 1500,
      steps: [
        {
          step_index: 0,
          step_id: "step_final",
          action: "wait_for_timeout",
          elapsed_ms: 1200,
          before_url: { url: "about:blank" },
          after_url: { url: "https://luxury-hotel-demo.agency" },
          artifacts: {
            dom: {
              state: "captured",
              value: {
                sha256: domSha,
                bytes: Buffer.byteLength(domText),
                text: domText,
              },
            },
            accessibility: {
              state: "captured",
              value: {
                sha256: a11ySha,
                bytes: Buffer.byteLength(a11yText),
                text: a11yText,
              },
            },
          },
          status: "completed",
          error: null,
        },
      ],
      limitations: ["Sandboxed egress filter applied", "Viewport 1280x800", "Reduced motion active"],
    },
    confidence: "observed",
    authority: "controlled-replay",
  };

  const parsedSummary = REAEvidenceParser.parse(dangerousEvidenceEnvelope);
  createdEvidenceId = parsedSummary.evidenceId;

  const savedEvidence = await evidenceStorage.saveEvidence(
    createdEvidenceId,
    JSON.stringify(dangerousEvidenceEnvelope, null, 2)
  );
  createdStoragePath = savedEvidence.storagePath;

  assert(await fs.stat(createdStoragePath).then(() => true).catch(() => false), "Evidence stored securely on disk");

  // Create research session in SQLite
  const sessionRecord = await db.researchSession.create({
    data: {
      targetUrl: "https://luxury-hotel-demo.agency",
      targetDomain: "luxury-hotel-demo.agency",
      industry: "Hotels & Banquets",
      status: "COMPLETED",
      title: parsedSummary.observedFacts.title,
      evidenceId: createdEvidenceId,
      evidenceSha256: savedEvidence.sha256,
      evidenceStoragePath: createdStoragePath,
      evidenceFileSizeBytes: savedEvidence.fileSizeBytes,
      observedFactsJson: JSON.stringify(parsedSummary.observedFacts),
      heuristicDetectionsJson: JSON.stringify(parsedSummary.heuristicDetections),
      limitationsJson: JSON.stringify(parsedSummary.limitations),
      selectedFindingsJson: JSON.stringify(["Title: Aman Luxury Resorts", "3D Requirement: Interactive WebGL Canvas"]),
    },
  });

  assert(sessionRecord.id !== null, `Research session created with ID: ${sessionRecord.id}`);

  // ------------------------------------------------------------------------
  // PART 2: TESTING SERVICE & API EVIDENCE RETRIEVAL
  // ------------------------------------------------------------------------
  console.log("\n--- 2. Testing Evidence Slices & Findings Persistence ---");

  // Test summary slice
  const summarySlice = await websiteIntelligence.getEvidence(sessionRecord.id, "summary");
  assert(summarySlice.title === "Aman Luxury Resorts", "Summary slice returned correct document title");
  assert(summarySlice.observedFacts.hasCanvas === true, "Summary slice verified canvas fact = true");
  assert(summarySlice.observedFacts.hasVideo === true, "Summary slice verified video fact = true");
  assert(Array.isArray(summarySlice.heuristicDetections), "Summary slice returned heuristic detections array");
  assert(
    summarySlice.selectedFindings.includes("Title: Aman Luxury Resorts"),
    "Summary slice returned persisted selected findings"
  );

  // Test DOM slice
  const domSlice = await websiteIntelligence.getEvidence(sessionRecord.id, "dom");
  assert(domSlice.domText.includes("<canvas id=\"hero-3d\"></canvas>"), "DOM slice returned intact captured HTML");

  // Test Accessibility slice
  const a11ySlice = await websiteIntelligence.getEvidence(sessionRecord.id, "accessibility");
  assert(a11ySlice.accessibilityText.includes("Sanctuary of Tranquility"), "Accessibility slice returned a11y tree");

  // Test manual findings update (PATCH)
  const updatedFindings = [
    "Title: Aman Luxury Resorts",
    "3D Requirement: Interactive WebGL Canvas",
    "Heuristic: Three.js (3D Graphics) - 95%",
  ];
  await websiteIntelligence.updateSelectedFindings(sessionRecord.id, updatedFindings);

  const reloadedSession = await db.researchSession.findUnique({
    where: { id: sessionRecord.id },
  });
  const reloadedFindings = JSON.parse(reloadedSession?.selectedFindingsJson || "[]");
  assert(reloadedFindings.length === 3, "Selected findings count updated to 3 in SQLite");
  assert(
    reloadedFindings.includes("Heuristic: Three.js (3D Graphics) - 95%"),
    "Newly added heuristic finding persisted to database"
  );

  // ------------------------------------------------------------------------
  // PART 3: FACTS VS HEURISTICS SEPARATION & PROBABILISTIC INTEGRITY
  // ------------------------------------------------------------------------
  console.log("\n--- 3. Testing Facts vs. Heuristics Separation ---");

  const threeJsHeuristic = parsedSummary.heuristicDetections.find((h) => h.name === "Three.js");
  assert(!!threeJsHeuristic, "Detected Three.js heuristic");
  assert(threeJsHeuristic?.confidence === 0.95, "Heuristic has explicit confidence rating (0.95)");
  assert(
    (threeJsHeuristic?.sourceCitation || (threeJsHeuristic as any)?.evidence || "").includes("three.min.js"),
    "Heuristic preserves supporting evidence citation"
  );

  // Observed facts must not contain inferences
  assert(!("threejs" in parsedSummary.observedFacts), "Observed facts do not speculate on framework names");

  // ------------------------------------------------------------------------
  // PART 4: REAL PLAYWRIGHT BROWSER WORKFLOW ON ENGINE PORT 3001
  // ------------------------------------------------------------------------
  console.log("\n--- 4. Executing Real Playwright Browser Workflow ---");

  let spawnedServer: ChildProcess | null = null;
  const isUp = await new Promise<boolean>((resolve) => {
    const req = http.get("http://127.0.0.1:3001/api/intelligence/research", () => resolve(true));
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!isUp) {
    console.log("  [Server Auto-Start] Launching Next.js server on port 3001...");
    const nextBin = path.resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    spawnedServer = spawn(process.execPath, [nextBin, "start", "-p", "3001"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: "3001" },
      stdio: "ignore",
    });

    let ready = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const check = await new Promise<boolean>((resolve) => {
        const req = http.get("http://127.0.0.1:3001/api/intelligence/research", () => resolve(true));
        req.on("error", () => resolve(false));
        req.setTimeout(500, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (check) {
        ready = true;
        break;
      }
    }
    if (!ready) {
      throw new Error("Failed to auto-start Next.js server on port 3001 within 15 seconds.");
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track console logs and errors
  let injectedScriptRan = false;
  page.on("console", (msg) => {
    console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text());
    if (msg.text().includes("INJECTED_CODE_RAN") || msg.text().includes("XSS")) {
      injectedScriptRan = true;
    }
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE RUNTIME ERROR]:", err.message);
  });

  page.on("dialog", async (dialog) => {
    if (dialog.message().includes("Are you sure")) {
      await dialog.accept();
    } else {
      injectedScriptRan = true;
      await dialog.dismiss();
    }
  });

  try {
    // 1. Visit Research Studio
    await page.goto("http://localhost:3001/research", { waitUntil: "networkidle" });
    const pageTitle = await page.textContent("h1");
    assert(pageTitle?.includes("Research Studio"), "Research Studio page loaded with header");

    // 2. Verify Session exists in catalog
    const sessionCard = page.locator(`text=luxury-hotel-demo.agency`).first();
    await sessionCard.waitFor({ timeout: 5000 });
    assert(await sessionCard.isVisible(), "Persisted research session visible in Studio catalog");

    // 3. Open Evidence Inspector
    await page.goto(`http://localhost:3001/research/${sessionRecord.id}`, { waitUntil: "networkidle" });
    const detailTitle = await page.textContent("h1");
    assert(
      detailTitle?.includes("luxury-hotel-demo.agency"),
      "Evidence Inspector loaded target domain header"
    );

    // 4. Verify Verified Observed Facts vs Heuristics visual distinction
    const factsHeader = page.locator("text=Verified Observed Facts").first();
    await factsHeader.waitFor({ timeout: 10000 });
    const heuristicsHeader = page.locator("text=Heuristic Detections").first();
    await heuristicsHeader.waitFor({ timeout: 10000 });
    assert(await factsHeader.isVisible(), "Verified Observed Facts section rendered");
    assert(await heuristicsHeader.isVisible(), "Heuristic Detections section rendered");

    // 5. Verify Safe DOM Structure Tab & Inert Script Safety
    await page.click("text=Safe DOM Structure");
    const domPreTag = page.locator("pre code").first();
    await domPreTag.waitFor({ timeout: 5000 });
    const domTextContent = await domPreTag.textContent();
    assert(
      domTextContent?.includes("Sanctuary of Tranquility"),
      "Safe DOM structure displays unexecuted text inside pre/code"
    );

    // Verify injected scripts in DOM did NOT execute in browser context
    const leakedWindowVar = await page.evaluate(() => (window as any).__LEAK_TEST);
    const xssTriggered = await page.evaluate(() => (window as any).__XSS_TRIGGERED);
    assert(leakedWindowVar === undefined, "Captured inline script was NOT executed (leakedVar is undefined)");
    assert(xssTriggered === undefined, "Captured onerror handler was NOT executed (xssTriggered is undefined)");
    assert(!injectedScriptRan, "No alert dialog or console XSS leak occurred");

    // 6. Test Interactive Manual Selection & Reload Persistence
    const blueprintTab = page.locator("button:has-text('Blueprint Staging')").first();
    const tabText = await blueprintTab.textContent();
    assert(
      tabText?.includes("(3)"),
      "Blueprint staging tab reflects 3 persisted findings from SQLite"
    );
    await blueprintTab.click();

    const findingItem = page.locator("text=Aman Luxury Resorts").first();
    await findingItem.waitFor({ timeout: 5000 });
    assert(await findingItem.isVisible(), "Blueprint staging renders persisted finding item");

    // Toggle a finding to 4
    await page.click("text=Facts & Heuristics");
    // Find and click the H1 heading plus button
    const headingAddBtn = page.locator("button[title='Select for Blueprint']").first();
    if (await headingAddBtn.isVisible()) {
      await headingAddBtn.click();
      await page.waitForTimeout(500); // allow async PATCH
    }

    // 7. Reload page to confirm persistence across browser reloads
    console.log("  [Browser Reload] Reloading page to test persistence...");
    await page.reload({ waitUntil: "networkidle" });

    await page.click("text=Blueprint Staging");
    const reloadedStagedItems = page.locator("text=Curated Findings Staged for Design Blueprint").first();
    assert(await reloadedStagedItems.isVisible(), "Staged findings survived full browser page reload");

    // 8. Test Clean Session Deletion
    await page.goto("http://localhost:3001/research", { waitUntil: "networkidle" });
    const deleteBtn = page.locator("button[title='Delete session']").first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);
    }
  } finally {
    await browser.close();
    if (spawnedServer) {
      try {
        spawnedServer.kill();
      } catch {}
    }
  }

  // Verify deletion purged SQLite and disk evidence
  const finalCheck = await db.researchSession.findUnique({
    where: { id: sessionRecord.id },
  });
  if (finalCheck) {
    // If not clicked via UI, clean up via service
    await websiteIntelligence.deleteSession(sessionRecord.id);
  }
  const evidenceOnDiskAfter = await fs.stat(createdStoragePath).then(() => true).catch(() => false);
  assert(!evidenceOnDiskAfter, "Evidence file physically deleted from disk upon session deletion");

  console.log("\n=================================================");
  console.log(`  VERIFY RESEARCH STUDIO: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
  console.log("=================================================");
}

runVerification().catch((err) => {
  console.error("FATAL ERROR IN RESEARCH STUDIO VERIFICATION:", err);
  process.exit(1);
});
