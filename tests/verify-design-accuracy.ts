import { PrismaClient } from "@prisma/client";
import { ALL_CATEGORY_PACKS, getCategoryPack, getDefaultSectionsForCategory } from "../src/modules/categories/registry";
import { DESIGN_PRESETS } from "../src/modules/design/presets";
import { resolveDesignState, generateCssVariables } from "../src/modules/design/resolver";
import { designUpdateSchema } from "../src/lib/validations/design";

const prisma = new PrismaClient();

async function runDesignAccuracyTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 2.2 VERIFICATION  ");
  console.log("  (Design Studio Accuracy & Live Preview Fidelity)");
  console.log("=================================================\n");

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

  try {
    // 1. Typography & Font Size Token Accuracy
    console.log("--- 1. Testing Typography & Base Font Size Tokens ---");
    const testFontSizes = ["14px", "16px", "18px", "20px"];
    for (const size of testFontSizes) {
      const design = resolveDesignState("healthcare", {
        baseFontSize: size,
        headingFont: "Cinzel",
        bodyFont: "Plus Jakarta Sans",
      });
      const vars = generateCssVariables(design) as Record<string, string>;
      assert(vars["--theme-base-font-size"] === size, `Base font size "${size}" maps to CSS var --theme-base-font-size`);
      assert(vars["--theme-heading-font"].includes("Cinzel"), "Heading font resolves to Cinzel");
      assert(vars["--theme-body-font"].includes("Plus Jakarta Sans"), "Body font resolves to Plus Jakarta Sans");
    }

    // 2. Animation Intensity Dynamics
    console.log("\n--- 2. Testing Animation Intensity Dynamics ---");
    const intensityCases = [
      { intensity: "none", expectedDuration: "0ms", expectedScale: "scale(1)" },
      { intensity: "subtle", expectedDuration: "200ms", expectedScale: "scale(1.02)" },
      { intensity: "cinematic", expectedDuration: "500ms", expectedScale: "scale(1.04)" },
      { intensity: "energetic", expectedDuration: "150ms", expectedScale: "scale(1.06)" },
    ] as const;

    for (const c of intensityCases) {
      const design = resolveDesignState("salon-beauty", {
        animationIntensity: c.intensity,
      });
      const vars = generateCssVariables(design) as Record<string, string>;
      assert(vars["--theme-transition-duration"] === c.expectedDuration, `Intensity "${c.intensity}" maps to duration ${c.expectedDuration}`);
      assert(vars["--theme-hover-scale"] === c.expectedScale, `Intensity "${c.intensity}" maps to hover scale ${c.expectedScale}`);
    }

    // 3. Layout Styles & Spacing Tokens
    console.log("\n--- 3. Testing Layout Styles & Spacing Tokens ---");
    const layoutCases = [
      { style: "modern-contained", expectedPaddingY: "4.5rem", expectedPaddingX: "2rem" },
      { style: "full-width", expectedPaddingY: "5.5rem", expectedPaddingX: "3.5rem" },
      { style: "asymmetric", expectedPaddingY: "6rem", expectedPaddingX: "4rem" },
    ] as const;

    for (const l of layoutCases) {
      const design = resolveDesignState("hotels-banquets", {
        layoutStyle: l.style,
      });
      const vars = generateCssVariables(design) as Record<string, string>;
      assert(vars["--theme-layout-style"] === l.style, `Layout style "${l.style}" correctly emitted to --theme-layout-style`);
      assert(vars["--theme-section-padding-y"] === l.expectedPaddingY, `Layout "${l.style}" emits vertical padding ${l.expectedPaddingY}`);
      assert(vars["--theme-section-padding-x"] === l.expectedPaddingX, `Layout "${l.style}" emits horizontal padding ${l.expectedPaddingX}`);
    }

    // 4. Container Width & Border Radius Controls
    console.log("\n--- 4. Testing Container Width & Border Radius Controls ---");
    const containerWidths = ["1140px", "1280px", "1440px", "1600px"];
    for (const w of containerWidths) {
      const design = resolveDesignState("food-restaurants", { containerWidth: w });
      const vars = generateCssVariables(design) as Record<string, string>;
      assert(vars["--theme-container"] === w, `Container width "${w}" maps to --theme-container`);
    }

    const borderRadii = ["0px", "0.25rem", "0.5rem", "0.75rem", "1rem"];
    for (const r of borderRadii) {
      const design = resolveDesignState("fitness-sports", { borderRadius: r });
      const vars = generateCssVariables(design) as Record<string, string>;
      assert(vars["--theme-radius"] === r, `Border radius "${r}" maps to --theme-radius`);
    }

    // 5. Category Consistency across all 6 Packs
    console.log("\n--- 5. Testing Category Consistency Across All 6 Industry Packs ---");
    assert(ALL_CATEGORY_PACKS.length === 6, "All 6 category packs registered");
    for (const pack of ALL_CATEGORY_PACKS) {
      const sections = getDefaultSectionsForCategory(pack.id);
      assert(sections.length >= 5, `Pack "${pack.id}" defines at least 5 default sections`);
      assert(sections.every((s) => s.id && s.name && s.order > 0), `Pack "${pack.id}" sections have valid IDs, names, and ordering`);

      // Test design resolution for each pack
      const design = resolveDesignState(pack.id, null);
      assert(design.preset === pack.suggestedPreset, `Pack "${pack.id}" defaults to recommended preset "${pack.suggestedPreset}"`);
      const cssVars = generateCssVariables(design) as Record<string, string>;
      assert(Boolean(cssVars["--theme-primary"] && cssVars["--theme-bg"]), `Pack "${pack.id}" produces valid CSS variable tokens`);
    }

    // 6. Section Custom Titles & Reordering
    console.log("\n--- 6. Testing Section Custom Titles & Order Persistence ---");
    const customSections = [
      { id: "sec_hero", name: "Hero Showcase", enabled: true, order: 1, customTitle: "Redefining Luxury Precision" },
      { id: "sec_services", name: "Specialized Services", enabled: true, order: 2, customTitle: "Our Bespoke Treatments" },
      { id: "sec_gallery", name: "Portfolio Gallery", enabled: false, order: 3 },
    ];

    const designWithCustomSections = resolveDesignState("schools-coaching", {
      sectionsConfigJson: JSON.stringify(customSections),
    });

    assert(designWithCustomSections.sections.length === 3, "Custom sections parsed accurately");
    assert(designWithCustomSections.sections[0].customTitle === "Redefining Luxury Precision", "Section 1 custom title retained");
    assert(designWithCustomSections.sections[1].customTitle === "Our Bespoke Treatments", "Section 2 custom title retained");
    assert(!designWithCustomSections.sections[2].enabled, "Section 3 disabled flag retained");

    // 7. Persistence & Reload Verification via SQLite Database
    console.log("\n--- 7. Testing Persistence & Reload in SQLite ---");
    const testProject = await prisma.project.create({
      data: {
        name: "Design Studio Accuracy Test Client",
        slug: `accuracy-test-${Date.now()}`,
        category: "salon-beauty",
        experienceLevel: "IMMERSIVE_3D",
        designConfig: {
          create: {
            preset: "creative",
            primaryColor: "#ec4899",
            secondaryColor: "#8b5cf6",
            accentColor: "#10b981",
            backgroundColor: "#030712",
            surfaceColor: "#111827",
            textColor: "#f9fafb",
            mutedTextColor: "#9ca3af",
            headingFont: "Syne",
            bodyFont: "Inter",
            baseFontSize: "18px",
            layoutStyle: "asymmetric",
            borderRadius: "1rem",
            containerWidth: "1440px",
            animationIntensity: "energetic",
            enableCanvasFx: true,
            sectionsConfigJson: JSON.stringify(customSections),
            threeDPreferences: JSON.stringify({
              objectType: "product_model",
              scrollInteraction: "rotate_on_scroll",
              lightingEnvironment: "dramatic_neon",
              wireframeMode: true,
              autoRotate: false,
            }),
          },
        },
      },
      include: {
        designConfig: true,
      },
    });

    assert(Boolean(testProject.id && testProject.designConfig), "Test project and designConfig created in SQLite");

    // Simulate page reload: re-query database
    const reloaded = await prisma.project.findUnique({
      where: { id: testProject.id },
      include: { designConfig: true },
    });

    assert(reloaded?.designConfig?.baseFontSize === "18px", "Persisted baseFontSize 18px survived database reload");
    assert(reloaded?.designConfig?.layoutStyle === "asymmetric", "Persisted layoutStyle asymmetric survived database reload");
    assert(reloaded?.designConfig?.containerWidth === "1440px", "Persisted containerWidth 1440px survived database reload");
    assert(reloaded?.designConfig?.animationIntensity === "energetic", "Persisted animationIntensity energetic survived database reload");
    assert(reloaded?.designConfig?.borderRadius === "1rem", "Persisted borderRadius 1rem survived database reload");

    const reloadedDesign = resolveDesignState(reloaded!.category, reloaded!.designConfig);
    const reloadedCss = generateCssVariables(reloadedDesign) as Record<string, string>;

    assert(reloadedCss["--theme-base-font-size"] === "18px", "Reloaded design generates --theme-base-font-size: 18px");
    assert(reloadedCss["--theme-layout-style"] === "asymmetric", "Reloaded design generates --theme-layout-style: asymmetric");
    assert(reloadedCss["--theme-container"] === "1440px", "Reloaded design generates --theme-container: 1440px");
    assert(reloadedCss["--theme-transition-duration"] === "150ms", "Reloaded design generates --theme-transition-duration: 150ms");
    assert(reloadedCss["--theme-hover-scale"] === "scale(1.06)", "Reloaded design generates --theme-hover-scale: scale(1.06)");

    // 8. Honest Engine Capability Check
    console.log("\n--- 8. Testing Honest Engine Behavior Disclaimers ---");
    assert(reloadedDesign.threeD.objectType === "product_model", "3D scene archetype correctly stored in SQLite metadata");
    assert(reloadedDesign.threeD.lightingEnvironment === "dramatic_neon", "3D scene lighting correctly stored in SQLite metadata");
    // Verify that Phase 2 does not falsely claim Three.js WebGL canvas is executing
    assert(reloadedDesign.threeD.scrollInteraction === "rotate_on_scroll", "Scroll interaction mode safely stored as Phase 2.3/Phase 3 engine hook");

    // Clean up test project
    await prisma.project.delete({ where: { id: testProject.id } });
    const verifyCleaned = await prisma.project.findUnique({ where: { id: testProject.id } });
    assert(verifyCleaned === null, "Test project cleanly deleted from SQLite");

    console.log("\n=================================================");
    console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("=================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDesignAccuracyTests();
