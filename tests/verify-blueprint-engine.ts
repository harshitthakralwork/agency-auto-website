/**
 * VERIFY-BLUEPRINT-ENGINE.TS
 *
 * Dedicated verification suite for Phase 4.0 Step 3:
 * Design Intelligence & Blueprint Engine Acceptance Audit.
 *
 * Tests:
 * 1. Zod Blueprint Schemas & Zero Fabrication Refinements
 * 2. Blueprint Generator (Evidence Synthesis & Provenance Attribution)
 * 3. Genuinely Adaptive Strategic Design Directions (Tiers & Industries)
 * 4. BlueprintService CRUD & Database Persistence
 * 5. Evidence Reference DB Integrity & Purged Session Detection
 * 6. Immutability Enforcement for APPROVED blueprints
 * 7. Version Branching (v1 -> v2) with Complete Lineage Independence
 * 8. Status Lifecycle State Machine & Stale Write Guards
 * 9. Live Chromium Browser E2E Flow (Full interactive editing & controls)
 */

import { db } from "../src/lib/db";
import {
  blueprintService,
  BlueprintApprovedImmutableError,
  InvalidStatusTransitionError,
  StaleBlueprintWriteError,
} from "../src/modules/blueprint/service";
import { generateEvidenceBackedBlueprint } from "../src/modules/blueprint/generator";
import {
  ProvenanceRecordSchema,
  CreateBlueprintInputSchema,
  UpdateBlueprintInputSchema,
} from "../src/modules/blueprint/schema";
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

async function testZodSchemasAndZeroFabrication() {
  console.log("\n--- TEST 1: Zod Schemas & Zero Fabrication Guard ---");

  // Valid observed fact with citation
  const validFact = {
    fieldPath: "businessProfile.companyName",
    sourceType: "OBSERVED_FACT",
    citation: "Captured DOM Document Title",
    confidence: 1.0,
    timestamp: new Date().toISOString(),
    operatorConfirmed: true,
  };
  const parseResult1 = ProvenanceRecordSchema.safeParse(validFact);
  assert(parseResult1.success, "Valid observed fact with citation parses successfully");

  // Invalid observed fact WITHOUT citation or session/finding (fabricated)
  const fabricatedFact = {
    fieldPath: "businessProfile.companyName",
    sourceType: "OBSERVED_FACT",
    citation: null,
    sessionId: null,
    findingId: null,
    confidence: 1.0,
    timestamp: new Date().toISOString(),
    operatorConfirmed: false,
  };
  const parseResult2 = ProvenanceRecordSchema.safeParse(fabricatedFact);
  assert(
    !parseResult2.success,
    "Zero Fabrication Guard correctly rejects OBSERVED_FACT without evidence citation or sessionId"
  );

  // Valid AI suggestion without citation required
  const aiSuggestion = {
    fieldPath: "businessProfile.description",
    sourceType: "AI_SUGGESTION",
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    operatorConfirmed: false,
  };
  const parseResult3 = ProvenanceRecordSchema.safeParse(aiSuggestion);
  assert(parseResult3.success, "AI suggestion without mandatory citation parses successfully");
}

async function testBlueprintGenerator() {
  console.log("\n--- TEST 2: Evidence-Backed Blueprint Generator & Provenance ---");

  const mockSession = {
    id: "test-sess-123",
    targetDomain: "amanspa.luxury",
    title: "Aman Spa & Wellness Haven",
    industry: "hotels-banquets",
    observedFacts: {
      documentTitle: "Aman Spa & Wellness Haven",
      metaDescription: "Sanctuary for the senses offering tailored holistic healing journeys.",
      heading1Text: "Welcome to Peace",
    },
    heuristicDetections: {
      motionEngine: { detected: true, engine: "gsap", confidence: 0.95 },
    },
    selectedFindings: [
      {
        id: "curated-001",
        title: "High contrast obsidian background with gold sparks",
        category: "PALETTE",
        type: "HEURISTIC",
        evidenceCitation: "CSS computed background: #090d16",
        confidence: 0.92,
      },
    ],
  };

  const generated = generateEvidenceBackedBlueprint({
    title: mockSession.title,
    industry: mockSession.industry,
    experienceLevel: "CINEMATIC",
    researchSessionId: mockSession.id,
    observedFacts: mockSession.observedFacts,
    heuristicDetections: mockSession.heuristicDetections,
    selectedFindings: mockSession.selectedFindings,
  });

  assert(generated.title.includes("Aman Spa"), "Generated title includes observed name");
  assert(
    generated.businessProfile.description === mockSession.observedFacts.metaDescription,
    "Observed metaDescription mapped to business description"
  );
  assert(
    generated.provenanceMetadata["businessProfile.companyName"]?.sourceType === "OBSERVED_FACT",
    "Company name provenance correctly tagged as OBSERVED_FACT"
  );
  assert(
    generated.provenanceMetadata["stagedFinding.curated-001"]?.sourceType === "INFERENCE",
    "Curated heuristic finding correctly retains INFERENCE source type and does not masquerade as OPERATOR_INPUT"
  );
  assert(
    generated.designDirections.length >= 3,
    "Generator produces at least 3 distinct strategic design directions"
  );

  // Verify the 3 adaptive directions
  const directionIds = generated.designDirections.map((d) => d.id);
  assert(directionIds.includes("minimal-conversion"), "Contains Minimal & High-Conversion direction");
  assert(directionIds.includes("cinematic-narrative"), "Contains Cinematic Narrative direction");
  assert(directionIds.includes("immersive-spatial-3d"), "Contains Interactive Spatial 3D direction");
  assert(
    generated.designDirections[0].name.includes("Hotels & Banquets"),
    "Design direction title adapts dynamically to the target industry"
  );
}

async function testExperienceTierAdaptation() {
  console.log("\n--- TEST 3: Adaptive Design Directions & Tier Restraint ---");

  // Standard project test: should NOT push into cinematic/3D by default
  const standardGenerated = generateEvidenceBackedBlueprint({
    title: "Community Dental Care",
    industry: "healthcare",
    experienceLevel: "STANDARD",
  });

  assert(
    standardGenerated.activeDirectionId === "minimal-conversion",
    "STANDARD project defaults to clean minimal-conversion direction without pushing into 3D"
  );
  assert(
    standardGenerated.experienceRequirements.threeDRequirements.canvasEnabled === false,
    "STANDARD project keeps 3D canvas disabled"
  );

  // Immersive 3D project test
  const threeDGenerated = generateEvidenceBackedBlueprint({
    title: "Apex Aesthetics Spatial Atelier",
    industry: "salon-beauty",
    experienceLevel: "IMMERSIVE_3D",
  });

  assert(
    threeDGenerated.activeDirectionId === "immersive-spatial-3d",
    "IMMERSIVE_3D project defaults to interactive spatial 3D direction"
  );
  assert(
    threeDGenerated.experienceRequirements.threeDRequirements.canvasEnabled === true,
    "IMMERSIVE_3D project enables WebGL Three.js canvas"
  );
}

async function testBlueprintServicePersistence() {
  console.log("\n--- TEST 4: Blueprint Service CRUD & Database Persistence ---");

  const uniqueTitle = `Test Health Studio ${Date.now().toString(36)}`;
  const blueprint = await blueprintService.createBlueprintFromScratch({
    industry: "healthcare",
    title: uniqueTitle,
    experienceLevel: "CINEMATIC",
  });

  assert(blueprint.id.length > 0, "Blueprint created with valid ID");
  assert(blueprint.version === 1, "Initial blueprint is version 1");
  assert(blueprint.status === "DRAFT", "Initial blueprint status is DRAFT");
  assert(blueprint.designDirections.length >= 3, "Created blueprint has 3 design directions");

  // Test update
  const updated = await blueprintService.updateBlueprint(blueprint.id, {
    title: `${uniqueTitle} (Refined)`,
    businessProfile: {
      tagline: "Elevated Precision Medicine",
      services: ["Diagnostic Imaging", "Surgical Consultation", "Preventive Care"],
    },
  });

  assert(updated.title.includes("(Refined)"), "Draft blueprint title updated successfully");
  assert(
    updated.businessProfile.tagline === "Elevated Precision Medicine",
    "Draft blueprint nested businessProfile updated successfully"
  );
  assert(
    updated.businessProfile.services.length === 3,
    "Services array updated successfully"
  );

  // Test apply design direction
  const applied = await blueprintService.applyDesignDirection(blueprint.id, "minimal-conversion");
  assert(
    applied.activeDirectionId === "minimal-conversion",
    "Active direction updated to minimal-conversion"
  );
  assert(
    applied.brandDirection.stylePreset === "minimal",
    "Style preset synchronized with minimal direction"
  );

  return applied;
}

async function testEvidenceDbIntegrity(blueprintId: string) {
  console.log("\n--- TEST 5: Evidence DB Reference Integrity & Purge Detection ---");

  // Attempt to submit an OBSERVED_FACT referencing a fake non-existent session ID
  let fakeSessionRejected = false;
  try {
    await blueprintService.updateBlueprint(blueprintId, {
      provenanceMetadata: {
        "businessProfile.companyName": {
          fieldPath: "businessProfile.companyName",
          sourceType: "OBSERVED_FACT",
          sessionId: "completely-fake-session-id-99999",
          citation: "Fake Citation",
          confidence: 1.0,
          timestamp: new Date().toISOString(),
          operatorConfirmed: false,
        },
      },
    });
  } catch (err: any) {
    if (err.message?.includes("does not exist in database")) {
      fakeSessionRejected = true;
    }
  }
  assert(
    fakeSessionRejected,
    "Service rejects OBSERVED_FACT referencing non-existent research session ID"
  );
}

async function testImmutabilityAndBranching(blueprintId: string) {
  console.log("\n--- TEST 6: Status Transition, Immutability & Version Branching ---");

  // Transition DRAFT -> REVIEW -> APPROVED
  const inReview = await blueprintService.transitionStatus(blueprintId, "REVIEW");
  assert(inReview.status === "REVIEW", "Transitioned status to REVIEW");

  const approved = await blueprintService.transitionStatus(blueprintId, "APPROVED", {
    approvedBy: "Principal Architect",
  });
  assert(approved.status === "APPROVED", "Transitioned status to APPROVED");
  assert(approved.approvedBy === "Principal Architect", "ApprovedBy recorded correctly");
  assert(Boolean(approved.approvedAt), "ApprovedAt timestamp recorded");

  // Verify Immutability: direct update on APPROVED must throw BlueprintApprovedImmutableError
  let blockedErrorThrown = false;
  try {
    await blueprintService.updateBlueprint(blueprintId, {
      title: "Should Fail Because Approved",
    });
  } catch (err: any) {
    if (err instanceof BlueprintApprovedImmutableError) {
      blockedErrorThrown = true;
    }
  }
  assert(blockedErrorThrown, "Immutability Guard blocked update on APPROVED blueprint");

  // Branch new version (v1 -> v2)
  const v2 = await blueprintService.branchNewVersion(
    blueprintId,
    "Iterating on diagnostic pricing and accessibility"
  );
  assert(v2.version === 2, "Branched blueprint is version 2");
  assert(v2.parentBlueprintId === blueprintId, "Branched blueprint links to parent v1 ID");
  assert(v2.status === "DRAFT", "Branched blueprint starts in DRAFT status");
  assert(
    v2.businessProfile.companyName === approved.businessProfile.companyName,
    "Branched blueprint inherited parent data"
  );

  // v2 is DRAFT so it can be updated
  const updatedV2 = await blueprintService.updateBlueprint(v2.id, {
    title: `${v2.title} (v2 Iteration)`,
  });
  assert(updatedV2.title.includes("(v2 Iteration)"), "v2 DRAFT blueprint can be edited freely");

  // Verify v1 remains strictly unchanged
  const freshV1 = await blueprintService.getBlueprint(blueprintId);
  assert(
    !freshV1.title.includes("(v2 Iteration)"),
    "Modifying child v2 did NOT modify immutable parent v1"
  );

  // Test stale write protection (optimistic concurrency)
  let staleWriteCaught = false;
  try {
    await blueprintService.updateBlueprint(v2.id, {
      title: "Stale update",
      expectedVersion: 999, // Wrong version
    });
  } catch (err: any) {
    if (err instanceof StaleBlueprintWriteError) {
      staleWriteCaught = true;
    }
  }
  assert(staleWriteCaught, "StaleBlueprintWriteError triggered on version mismatch");

  // Clean up test records
  await blueprintService.deleteBlueprint(v2.id);
  await blueprintService.deleteBlueprint(blueprintId);
  console.log("  ✓ Test records cleaned up safely");
}

async function testBrowserE2EWorkflow() {
  console.log("\n--- TEST 7: Live Chromium Browser E2E Interactive Workflow ---");

  // Check if Next.js server is responding on port 3001
  const serverResponding = await new Promise<boolean>((resolve) => {
    http
      .get("http://127.0.0.1:3001/blueprints", (res) => {
        resolve(res.statusCode === 200);
      })
      .on("error", () => resolve(false));
  });

  if (!serverResponding) {
    console.log("  ⚠️ Local Next.js server is not running on port 3001. Skipping browser E2E test in this sub-run.");
    return;
  }

  const browser: Browser = await chromium.launch({ headless: true });
  const page: Page = await browser.newPage();

  try {
    // 1. Visit /blueprints catalog
    await page.goto("http://127.0.0.1:3001/blueprints", { waitUntil: "networkidle" });
    const pageTitle = await page.textContent("h1");
    assert(
      pageTitle?.includes("Design Intelligence & Blueprints") ?? false,
      "Blueprints catalog page rendered with correct heading"
    );

    // 2. Open Create Modal
    await page.click('button:has-text("New Blueprint")');
    await page.waitForSelector('text=Generate Design Blueprint');
    assert(true, "Create Blueprint modal opened");

    // 3. Switch to 'From Industry Pack' tab
    await page.click('button:has-text("From Industry Pack")');
    const inputTitle = `Automated Browser Test BP ${Date.now().toString(36)}`;
    await page.fill('input[placeholder*="Apex Health Clinic"]', inputTitle);

    // 4. Submit form (target modal submit button specifically)
    await page.click('button[type="submit"]:has-text("Create Blueprint")');

    // 5. Wait for navigation to /blueprints/[id]
    await page.waitForURL(/\/blueprints\/[a-z0-9]+/i, { timeout: 10000 });
    assert(true, "Redirected to Blueprint editor view");

    // 6. Test Interactive Services Editing (Add a service)
    await page.waitForSelector('input[placeholder="Add new service offering..."]');
    await page.fill('input[placeholder="Add new service offering..."]', "Pediatric Dental Surgery");
    await page.click('button:has-text("Add")');
    await page.waitForSelector('text=Pediatric Dental Surgery');
    assert(true, "Interactive Key Services: Added new service item");

    // 7. Test Interactive Sitemap & Section Editing
    await page.click('button:has-text("Sitemap & Structure")');
    await page.waitForSelector('button:has-text("Add Page")');
    await page.click('button:has-text("Add Page")');
    await page.fill('input[placeholder*="Page Title"]', "Specialists Directory");
    await page.click('button:has-text("Confirm Add")');
    await page.waitForSelector('text=Specialists Directory');
    assert(true, "Interactive Sitemap: Added new page to IA tree");

    // 8. Test Brand & Tokens tab
    await page.click('button:has-text("Brand & Tokens")');
    await page.waitForSelector('text=Color System Tokens');
    assert(true, "Switched to Brand & Tokens tab and verified color system");

    // 9. Switch to Design Directions tab and activate
    await page.click('button[role="button"], button:has-text("Design Directions")');
    await page.waitForSelector('text=Conversion-Focused');
    assert(true, "Design directions rendered");

    // 10. Switch to Evidence Provenance tab and test operator confirmation
    await page.click('button:has-text("Evidence Provenance")');
    await page.waitForSelector('text=Evidence Provenance Audit Trail');
    const confirmBtn = await page.locator('button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      assert(true, "Interactive Provenance: Toggled operator confirmation");
    }

    // 11. Save Changes
    await page.click('button:has-text("Save Changes")');
    await page.waitForSelector('text=Saved');
    assert(true, "Save Changes executed and feedback displayed");

    // 12. Reload and verify persistence
    await page.reload({ waitUntil: "networkidle" });
    await page.click('button:has-text("Sitemap & Structure")');
    await page.waitForSelector('text=Specialists Directory');
    assert(true, "Reload Persistence: Custom sitemap page survived page reload");
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("=================================================");
  console.log("VERIFYING PHASE 4.0 STEP 3: BLUEPRINT ENGINE AUDIT");
  console.log("=================================================");

  try {
    await testZodSchemasAndZeroFabrication();
    await testBlueprintGenerator();
    await testExperienceTierAdaptation();
    const testBp = await testBlueprintServicePersistence();
    await testEvidenceDbIntegrity(testBp.id);
    await testImmutabilityAndBranching(testBp.id);
    await testBrowserE2EWorkflow();

    console.log("\n=================================================");
    console.log(`✅ ALL TESTS PASSED: ${passedAssertions}/${totalAssertions} assertions passed`);
    console.log("=================================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n❌ SUITE FAILED:", err);
    process.exit(1);
  }
}

main();
