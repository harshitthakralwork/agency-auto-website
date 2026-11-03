/**
 * VERIFY-CONTENT-ASSET-INTELLIGENCE.TS
 *
 * Dedicated verification suite for Phase 5.2:
 * Content & Asset Intelligence.
 *
 * Tests:
 * 1. Missing Asset Fallback Generator (SVG tokens & dimensions)
 * 2. Asset Slot Matching Engine (Direct slot assignment, heuristics & fallbacks)
 * 3. Content Copy Synthesizer (Evidence/Blueprint to component copy slots)
 * 4. Provenance Attribution for Synthesized Copy Fields
 * 5. End-to-End Content & Asset Service Orchestration (Persistence in SQLite)
 */

import { db } from "../src/lib/db";
import { AssetFallbackGenerator } from "../src/modules/content-asset/fallback-generator";
import {
  AssetSlotMatcher,
  SLOT_SPECIFICATIONS,
  getComponentSlotRequirements,
} from "../src/modules/content-asset/slot-matcher";
import { ContentSynthesizer } from "../src/modules/content-asset/copy-synthesizer";
import { ContentAssetService } from "../src/modules/content-asset/service";
import { RegistryService } from "../src/modules/registry/service";
import { CompositionService } from "../src/modules/composition/service";

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

async function testFallbackGenerator() {
  console.log("\n--- TEST 1: Missing Asset Fallback Generator ---");

  const heroReq = SLOT_SPECIFICATIONS.HERO_BACKGROUND;
  const fallback = AssetFallbackGenerator.generateFallbackDataUri(
    heroReq,
    "healthcare",
    "Apex Clinical Center"
  );

  assert(fallback.startsWith("data:image/svg+xml;base64,"), "Fallback is a valid SVG data URI");

  const base64Part = fallback.replace("data:image/svg+xml;base64,", "");
  const decodedSvg = Buffer.from(base64Part, "base64").toString("utf-8");

  assert(decodedSvg.includes("SLOT: HERO_BACKGROUND"), "Decoded SVG contains slot name");
  assert(decodedSvg.includes("1920 × 1080"), "Decoded SVG contains recommended dimensions");
  assert(decodedSvg.includes("Apex Clinical Center"), "Decoded SVG contains project name");
  assert(decodedSvg.includes("16:9"), "Decoded SVG contains aspect ratio");
}

async function testSlotMatcher() {
  console.log("\n--- TEST 2: Asset Slot Matching Engine ---");

  const heroReq = SLOT_SPECIFICATIONS.HERO_BACKGROUND;

  // Case A: Direct assignment match
  const assetsDirect = [
    {
      id: "asset-1",
      fileName: "hero-clinic.webp",
      fileUrl: "/uploads/projects/p1/hero-clinic.webp",
      assetType: "IMAGE",
      assignedSlot: "HERO_BACKGROUND",
      mimeType: "image/webp",
    },
  ];

  const matchDirect = AssetSlotMatcher.matchSlot(heroReq, assetsDirect, "healthcare");
  assert(matchDirect.status === "MATCHED", "Slot matched via direct slot assignment");
  assert(matchDirect.assetId === "asset-1", "Matched correct asset ID");
  assert(matchDirect.assetUrl === "/uploads/projects/p1/hero-clinic.webp", "Matched correct asset URL");

  // Case B: Fallback generated when empty
  const matchEmpty = AssetSlotMatcher.matchSlot(heroReq, [], "healthcare");
  assert(matchEmpty.status === "FALLBACK_GENERATED", "Unassigned slot returns FALLBACK_GENERATED");
  assert(
    matchEmpty.fallbackSvgDataUri !== undefined && matchEmpty.fallbackSvgDataUri.length > 0,
    "Generated fallback SVG token for missing asset"
  );
}

async function testContentCopySynthesizer() {
  console.log("\n--- TEST 3: Content Copy Synthesizer ---");

  const heroSplit = RegistryService.getDefinitionById("hero-split")!;
  const context = {
    companyName: "Vance Aesthetic Medicine",
    tagline: "Restoring Natural Vitality & Facial Symmetry",
    description: "Premier cosmetic surgery and minimally invasive dermatology practice.",
    industry: "healthcare",
    targetAudience: "Discerning Aesthetic Patients",
    services: [
      "Precision Laser Resurfacing",
      "Facial Sculpting & Volume Restoration",
      "Cellular Skin Rejuvenation",
    ],
    usps: [
      "Board-Certified Plastic Surgeons",
      "Proprietary Rapid-Healing Protocols",
      "Private VIP Recovery Suite",
    ],
  };

  const { props, enrichmentResult } = ContentSynthesizer.enrichComponentCopy(heroSplit, context);

  assert(
    props.headline === "Vance Aesthetic Medicine: Restoring Natural Vitality & Facial Symmetry",
    "Synthesized headline combines company name and tagline"
  );
  assert(
    props.subheadline === "Premier cosmetic surgery and minimally invasive dermatology practice.",
    "Synthesized subheadline from blueprint description"
  );
  assert(
    enrichmentResult.provenanceCitations.length >= 2,
    `Recorded ${enrichmentResult.provenanceCitations.length} provenance citations for synthesized fields`
  );

  const headlineCite = enrichmentResult.provenanceCitations.find((c) => c.field === "headline");
  assert(headlineCite?.source === "BLUEPRINT_TAGLINE", "Headline citation correctly attributes blueprint tagline");

  // Test Business Services Synthesis
  const servicesDef = RegistryService.getDefinitionById("business-services")!;
  const servicesResult = ContentSynthesizer.enrichComponentCopy(servicesDef, context);
  const servicesList = servicesResult.props.servicesList as any[];

  assert(servicesList.length === 3, `Synthesized exactly 3 service cards from blueprint (found: ${servicesList.length})`);
  assert(servicesList[0].title === "Precision Laser Resurfacing", "First service card title matches blueprint");
}

async function testEndToEndContentAssetService() {
  console.log("\n--- TEST 4: End-to-End Content & Asset Service Orchestration ---");

  // 1. Create test project in SQLite
  const project = await db.project.create({
    data: {
      name: "St. Jude Premier Diagnostics",
      slug: "st-jude-premier-diagnostics",
      category: "healthcare",
      experienceLevel: "CINEMATIC",
      description: "Leading medical diagnostic and preventative health facility.",
      services: "Comprehensive Biometrics, Early Oncology Screening, Executive Health Scan",
    },
  });
  assert(project.id.length > 0, `Test project created: ${project.id}`);

  // 2. Create blueprint
  const blueprint = await db.websiteBlueprint.create({
    data: {
      projectId: project.id,
      title: "St. Jude Diagnostic Blueprint",
      slug: "st-jude-diagnostic-blueprint",
      industry: "healthcare",
      experienceLevel: "CINEMATIC",
      businessProfileJson: JSON.stringify({
        companyName: "St. Jude Premier Diagnostics",
        tagline: "Early Detection. Definitive Clarity.",
        description: "State-of-the-art MRI, CT, and genetic profiling suite.",
        services: ["Full Body MRI", "Genetic Biomarker Analysis", "Cardiovascular Screening"],
        usps: ["Same-Day Results", "Sub-Millimeter Imaging Resolution", "Board-Certified Radiologists"],
      }),
      sitemapJson: JSON.stringify([
        { id: "p1", title: "Home", slug: "/", routePriority: "HIGH", navigationPlacement: "PRIMARY" },
      ]),
    },
  });

  // 3. Generate page composition
  const pages = await CompositionService.generateFromBlueprint(blueprint.id, project.id);
  assert(pages.length >= 1, "Generated page composition for test project");

  // 4. Add a real project asset
  const asset = await db.projectAsset.create({
    data: {
      projectId: project.id,
      name: "Hero Clinic Front",
      fileName: "hero-clinic.webp",
      fileUrl: "/uploads/projects/st-jude/hero-clinic.webp",
      filePath: "storage/projects/st-jude/hero-clinic.webp",
      mimeType: "image/webp",
      fileSize: 420000,
      assignedSlot: "HERO_BACKGROUND",
    },
  });
  assert(asset.id.length > 0, `Uploaded asset created with slot HERO_BACKGROUND: ${asset.id}`);

  // 5. Run Content Enrichment
  const enrichResult = await ContentAssetService.enrichProjectCompositions(project.id);
  assert(enrichResult.enrichedSections.length > 0, `Enriched ${enrichResult.enrichedSections.length} section(s)`);

  // Verify section received synthesized headline
  const home = await CompositionService.getPageComposition(pages[0].id);
  const heroSec = home.sections.find((s) => s.componentId.startsWith("hero-"));
  assert(heroSec !== undefined, "Found hero section on home page");
  assert(
    typeof heroSec?.propsOverride.headline === "string",
    "Hero section propsOverride contains synthesized headline string"
  );

  // 6. Run Asset Matching & Slot Audit
  const audit = await ContentAssetService.auditAndMatchProjectAssetSlots(project.id);
  assert(audit.projectId === project.id, "Audit summary matches project ID");
  assert(audit.totalRequiredSlots >= 1, `Total required slots audited: ${audit.totalRequiredSlots}`);
  assert(audit.totalMatchedSlots >= 1, `Matched at least 1 real asset to required slot (${audit.totalMatchedSlots})`);

  // 7. Clean up SQLite test records
  await db.project.delete({ where: { id: project.id } });
  assert(true, "Cleaned up test project from SQLite");
}

async function runAllTests() {
  console.log("===============================================================");
  console.log("🧪 STARTING PHASE 5.2 CONTENT & ASSET INTELLIGENCE SUITE");
  console.log("===============================================================");

  const startTime = Date.now();

  try {
    await testFallbackGenerator();
    await testSlotMatcher();
    await testContentCopySynthesizer();
    await testEndToEndContentAssetService();

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
