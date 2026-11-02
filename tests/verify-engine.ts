import { PrismaClient } from "@prisma/client";
import { ALL_CATEGORY_PACKS, getCategoryPack, getDefaultSectionsForCategory } from "../src/modules/categories/registry";
import { DESIGN_PRESETS } from "../src/modules/design/presets";
import { resolveDesignState, generateCssVariables } from "../src/modules/design/resolver";
import { projectCreateSchema, projectUpdateSchema } from "../src/lib/validations/project";
import { designUpdateSchema } from "../src/lib/validations/design";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 1 VERIFICATION   ");
  console.log("=================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  // 1. Verify Category Packs
  console.log("\n--- 1. Testing Category Engine (6 Industry Packs) ---");
  assert(ALL_CATEGORY_PACKS.length === 6, "All 6 industry packs are registered");

  const expectedCategories = [
    "healthcare",
    "hotels-banquets",
    "schools-coaching",
    "food-restaurants",
    "fitness-sports",
    "salon-beauty",
  ];

  for (const catId of expectedCategories) {
    const pack = getCategoryPack(catId);
    assert(pack.id === catId, `Pack '${catId}' resolves correctly with title "${pack.title}"`);
    assert(pack.recommendedPages.length >= 5, `Pack '${catId}' has at least 5 recommended pages`);
    assert(pack.recommendedSections.length >= 5, `Pack '${catId}' has at least 5 recommended sections`);
    assert(pack.keyFeatures.length >= 5, `Pack '${catId}' has at least 5 domain features`);
  }

  // 2. Verify Design Presets
  console.log("\n--- 2. Testing Design Engine (5 Presets) ---");
  const expectedPresets = ["cinematic", "minimal", "luxury", "creative", "corporate"];
  assert(Object.keys(DESIGN_PRESETS).length === 5, "All 5 design presets are registered");

  for (const presetId of expectedPresets) {
    const preset = DESIGN_PRESETS[presetId as keyof typeof DESIGN_PRESETS];
    assert(preset.id === presetId, `Preset '${presetId}' resolves correctly`);
    assert(preset.colors.primary.startsWith("#"), `Preset '${presetId}' has valid primary hex color`);
    assert(preset.typography.headingFont.length > 0, `Preset '${presetId}' has heading font defined`);
    assert(preset.layout.borderRadius.length > 0, `Preset '${presetId}' has border radius defined`);
  }

  // 3. Database Persistence & CRUD Testing
  console.log("\n--- 3. Testing SQLite Database & Project CRUD Operations ---");

  // Clean test database
  await prisma.projectDesignConfig.deleteMany({});
  await prisma.project.deleteMany({});

  const initialCount = await prisma.project.count();
  assert(initialCount === 0, "Database starts clean for automated testing");

  // Create 6 realistic agency projects
  const testProjectsData = [
    {
      name: "Apex Health & Dental Clinic",
      category: "healthcare",
      location: "Chicago, IL",
      description: "Premier multispecialty clinic providing advanced diagnostics and patient-first dentistry.",
      services: "Preventive Care, Cosmetic Dentistry, Orthodontics, Oral Surgery",
      targetAudience: "Families and working professionals in the greater Chicago area",
      status: "DRAFT",
      preset: "corporate",
    },
    {
      name: "The Grand Heritage Resort & Banquets",
      category: "hotels-banquets",
      location: "Aspen, CO",
      description: "Atmospheric alpine resort featuring luxury presidential suites and crystal ballrooms.",
      services: "Executive Suites, Wedding Banquets, Alpine Spa, Fine Dining",
      targetAudience: "Luxury vacationers and couples planning destination weddings",
      status: "IN_PROGRESS",
      preset: "luxury",
    },
    {
      name: "Horizon Academy of Advanced Sciences",
      category: "schools-coaching",
      location: "Boston, MA",
      description: "Accredited college-preparatory academy fostering scientific inquiry and academic excellence.",
      services: "STEM Honors, Board Exam Prep, Olympiad Coaching, College Counseling",
      targetAudience: "High-achieving secondary school students and college applicants",
      status: "DRAFT",
      preset: "corporate",
    },
    {
      name: "L'Atelier Charcoal & Woodfire",
      category: "food-restaurants",
      location: "San Francisco, CA",
      description: "Michelin-recognized seasonal bistro celebrating heritage produce and open woodfire alchemy.",
      services: "Seasonal Tasting Menus, Chef's Table, Sommelier Pairings, Private Buyouts",
      targetAudience: "Discerning gastronomes and food critics",
      status: "READY_FOR_REVIEW",
      preset: "cinematic",
    },
    {
      name: "IronCore Athletic Club",
      category: "fitness-sports",
      location: "Austin, TX",
      description: "Elite performance gym equipped with Olympic lifting turf, recovery sauna, and private coaching.",
      services: "Powerlifting, HIIT Conditioning, 1-on-1 Coaching, Sports Massage",
      targetAudience: "Athletes, lifters, and committed fitness enthusiasts",
      status: "IN_PROGRESS",
      preset: "cinematic",
    },
    {
      name: "Lumière Aesthetics & Hair Atelier",
      category: "salon-beauty",
      location: "New York, NY",
      description: "Editorial hair salon and aesthetic spa specializing in French balayage and clinical skincare.",
      services: "French Balayage, Precision Haircuts, Hydrafacials, Brow Architecture",
      targetAudience: "Discerning clientele seeking runway-level hair and skincare refinement",
      status: "DRAFT",
      preset: "minimal",
    },
  ];

  for (const item of testProjectsData) {
    // Validate with Zod first
    const zodValidation = projectCreateSchema.safeParse(item);
    assert(zodValidation.success, `Zod validation succeeds for project '${item.name}'`);

    const preset = DESIGN_PRESETS[item.preset as keyof typeof DESIGN_PRESETS];
    const defaultSections = getDefaultSectionsForCategory(item.category);

    const created = await prisma.project.create({
      data: {
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: item.category,
        location: item.location,
        description: item.description,
        services: item.services,
        targetAudience: item.targetAudience,
        status: item.status,
        designConfig: {
          create: {
            preset: preset.id,
            primaryColor: preset.colors.primary,
            secondaryColor: preset.colors.secondary,
            accentColor: preset.colors.accent,
            backgroundColor: preset.colors.background,
            surfaceColor: preset.colors.surface,
            textColor: preset.colors.text,
            mutedTextColor: preset.colors.mutedText,
            headingFont: preset.typography.headingFont,
            bodyFont: preset.typography.bodyFont,
            baseFontSize: preset.typography.baseFontSize,
            layoutStyle: preset.layout.layoutStyle,
            borderRadius: preset.layout.borderRadius,
            containerWidth: preset.layout.containerWidth,
            animationIntensity: preset.animation.animationIntensity,
            enableCanvasFx: preset.animation.enableCanvasFx,
            sectionsConfigJson: JSON.stringify(defaultSections),
          },
        },
      },
      include: { designConfig: true },
    });

    assert(created.id.length > 0, `Project '${item.name}' stored persistently in SQLite`);
    assert(created.designConfig !== null, `ProjectDesignConfig 1:1 relation created for '${item.name}'`);
  }

  const storedCount = await prisma.project.count();
  assert(storedCount === 6, "All 6 projects are persistently stored in SQLite");

  // 4. Update Project Metadata
  console.log("\n--- 4. Testing Project Updates & Design Customization ---");
  const dentalProject = await prisma.project.findFirst({
    where: { category: "healthcare" },
    include: { designConfig: true },
  });

  assert(dentalProject !== null, "Found dental project for update test");
  if (dentalProject) {
    // Test Zod update validation
    const updateZod = projectUpdateSchema.safeParse({
      status: "IN_PROGRESS",
      description: "Updated dental description with 24/7 emergency triage service.",
    });
    assert(updateZod.success, "Project update passes Zod schema validation");

    const updated = await prisma.project.update({
      where: { id: dentalProject.id },
      data: updateZod.data,
      include: { designConfig: true },
    });

    assert(updated.status === "IN_PROGRESS", "Project status updated to IN_PROGRESS");
    assert(
      updated.description?.includes("24/7 emergency triage") || false,
      "Project description successfully updated"
    );

    // Test Design Configuration Custom Tokens
    const customDesignInput = {
      preset: "custom",
      primaryColor: "#059669", // custom emerald
      secondaryColor: "#0284c7",
      accentColor: "#f59e0b",
      backgroundColor: "#f0fdf4",
      surfaceColor: "#ffffff",
      textColor: "#064e3b",
      mutedTextColor: "#047857",
      headingFont: "Plus Jakarta Sans",
      bodyFont: "Inter",
      baseFontSize: "16px",
      layoutStyle: "modern-contained" as const,
      borderRadius: "0.75rem",
      containerWidth: "1280px",
      animationIntensity: "subtle" as const,
      enableCanvasFx: false,
      sections: [
        { id: "emergency_banner", name: "Emergency Alert", enabled: true, order: 1 },
        { id: "hero_appointment", name: "Appointment Hero", enabled: true, order: 2 },
      ],
    };

    const designZod = designUpdateSchema.safeParse(customDesignInput);
    assert(designZod.success, "Custom design tokens pass Zod validation");

    const updatedDesign = await prisma.projectDesignConfig.update({
      where: { projectId: dentalProject.id },
      data: {
        preset: customDesignInput.preset,
        primaryColor: customDesignInput.primaryColor,
        secondaryColor: customDesignInput.secondaryColor,
        accentColor: customDesignInput.accentColor,
        backgroundColor: customDesignInput.backgroundColor,
        surfaceColor: customDesignInput.surfaceColor,
        textColor: customDesignInput.textColor,
        mutedTextColor: customDesignInput.mutedTextColor,
        headingFont: customDesignInput.headingFont,
        bodyFont: customDesignInput.bodyFont,
        borderRadius: customDesignInput.borderRadius,
        sectionsConfigJson: JSON.stringify(customDesignInput.sections),
      },
    });

    assert(updatedDesign.primaryColor === "#059669", "Custom primary color persisted");
    assert(updatedDesign.headingFont === "Plus Jakarta Sans", "Custom heading font persisted");

    // Test Resolver and CSS variables generation
    const resolvedState = resolveDesignState("healthcare", updatedDesign);
    assert(resolvedState.colors.primary === "#059669", "Resolver correctly reads custom primary color");
    assert(resolvedState.typography.headingFont === "Plus Jakarta Sans", "Resolver correctly reads heading font");

    const cssVars = generateCssVariables(resolvedState);
    assert(
      (cssVars as Record<string, string>)["--theme-primary"] === "#059669",
      "CSS Variable '--theme-primary' properly generated for Live Preview"
    );
  }

  // 5. Test Cascade Deletion with a temporary project
  console.log("\n--- 5. Testing Cascade Deletion Confirmation ---");
  const tempProject = await prisma.project.create({
    data: {
      name: "Temporary Demo Project",
      slug: "temporary-demo-project",
      category: "healthcare",
      status: "DRAFT",
      designConfig: {
        create: {
          preset: "cinematic",
          primaryColor: "#000000",
        },
      },
    },
    include: { designConfig: true },
  });

  assert(tempProject.id.length > 0, "Created temporary project for deletion testing");
  const tempDesignId = tempProject.designConfig?.id;

  // Delete project
  await prisma.project.delete({ where: { id: tempProject.id } });

  const checkProject = await prisma.project.findUnique({ where: { id: tempProject.id } });
  assert(checkProject === null, "Project successfully deleted from SQLite");

  const checkDesign = await prisma.projectDesignConfig.findUnique({ where: { id: tempDesignId } });
  assert(checkDesign === null, "Linked ProjectDesignConfig automatically cascade deleted");

  // Verify final count
  const finalCount = await prisma.project.count();
  assert(finalCount === 6, "All 6 production client projects remain safely intact in SQLite");

  console.log("\n=================================================");
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!  `);
  console.log("=================================================\n");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
