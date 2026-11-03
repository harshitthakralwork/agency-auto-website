import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { resolveDesignState } from "../design/resolver";
import { getCategoryPack } from "../categories/registry";
import { CompositionService } from "../composition/service";
import { ContentAssetService } from "../content-asset/service";
import { AssetFallbackGenerator } from "../content-asset/fallback-generator";
import { SLOT_SPECIFICATIONS } from "../content-asset/slot-matcher";
import { HtmlCompiler } from "./html-compiler";
import { CssCompiler } from "./css-compiler";
import { JsBundler } from "./js-bundler";
import { ZipBundler } from "./zip-bundler";
import { CinematicIntegration } from "./cinematic-integration";
import { ImmersiveIntegration } from "./immersive-integration";
import { DeploymentManifestGenerator } from "../export/deployment-manifest";
import {
  GenerationOptions,
  GenerationResult,
  BuildManifest,
  GeneratedAssetRef,
  GeneratedPageMeta,
} from "./types";

export class WebsiteGeneratorService {
  /**
   * Compiles an entire composed project into a production-ready, zero-CDN static website package.
   */
  public static async generateWebsite(
    projectId: string,
    options: Partial<GenerationOptions> = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const buildId = `build_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // 1. Fetch project and related models
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        designConfig: true,
        assets: true,
        blueprints: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found`);
    }

    const latestBlueprint = project.blueprints[0];
    const experienceTier = options.experienceTierOverride || (project.experienceLevel as any) || "STANDARD";

    // 2. Ensure Page Compositions exist (synthesize from blueprint if needed)
    let pages = await CompositionService.getProjectCompositions(projectId);
    if (pages.length === 0) {
      if (latestBlueprint) {
        pages = await CompositionService.generateFromBlueprint(latestBlueprint.id, projectId);
      } else {
        // Create baseline default compositions
        const homePage = await CompositionService.createPage({
          projectId,
          slug: "/",
          title: "Home",
          routePriority: "HIGH",
          navigationPlacement: "PRIMARY",
        });
        await CompositionService.addSection(homePage.id, {
          componentId: experienceTier === "IMMERSIVE_3D" ? "hero-3d" : experienceTier === "CINEMATIC" ? "hero-cinematic" : "hero-split",
          order: 0,
        });
        await CompositionService.addSection(homePage.id, {
          componentId: "business-services",
          order: 1,
        });
        await CompositionService.addSection(homePage.id, {
          componentId: "conversion-contact-form",
          order: 2,
        });

        const servicesPage = await CompositionService.createPage({
          projectId,
          slug: "/services",
          title: "Services",
          routePriority: "MEDIUM",
          navigationPlacement: "PRIMARY",
        });
        await CompositionService.addSection(servicesPage.id, {
          componentId: "business-features",
          order: 0,
        });
        await CompositionService.addSection(servicesPage.id, {
          componentId: "content-faq-accordion",
          order: 1,
        });

        const contactPage = await CompositionService.createPage({
          projectId,
          slug: "/contact",
          title: "Contact",
          routePriority: "HIGH",
          navigationPlacement: "PRIMARY",
        });
        await CompositionService.addSection(contactPage.id, {
          componentId: "conversion-contact-form",
          order: 0,
        });

        pages = await CompositionService.getProjectCompositions(projectId);
      }
    }

    // 3. Enrich content copy from Blueprint & Research findings
    try {
      await ContentAssetService.enrichProjectCompositions(projectId);
      // Reload pages with enriched propsOverride
      pages = await CompositionService.getProjectCompositions(projectId);
    } catch (err: any) {
      warnings.push(`Content enrichment warning: ${err.message}`);
    }

    // 4. Resolve Design Tokens and Category Pack
    const categoryPack = getCategoryPack(project.category);
    const design = resolveDesignState(project.category, {
      ...project.designConfig,
      experienceLevel: experienceTier,
    });

    // 5. Prepare output directories
    const outputDir = options.outputDirectory
      ? path.resolve(/*turbopackIgnore: true*/ options.outputDirectory)
      : path.resolve(process.cwd(), "storage", "generated", projectId, buildId);

    const cssDir = path.join(outputDir, "css");
    const jsDir = path.join(outputDir, "js");
    const assetsDir = path.join(outputDir, "assets");
    const assetsImagesDir = path.join(assetsDir, "images");
    const assetsVideosDir = path.join(assetsDir, "videos");
    const assetsModelsDir = path.join(assetsDir, "models");

    fs.mkdirSync(cssDir, { recursive: true });
    fs.mkdirSync(jsDir, { recursive: true });
    fs.mkdirSync(assetsImagesDir, { recursive: true });
    fs.mkdirSync(assetsVideosDir, { recursive: true });
    fs.mkdirSync(assetsModelsDir, { recursive: true });

    // 6. Match and copy assets or write deterministic SVG fallbacks
    const assetMap: Record<string, string> = {};
    const generatedAssetRefs: GeneratedAssetRef[] = [];
    let copiedCount = 0;
    let fallbackCount = 0;

    // Standard slots to ensure available
    const standardSlots: Array<{ slot: string; type: "HERO_BACKGROUND" | "BEFORE_SLOT" | "AFTER_SLOT" | "GALLERY_1" | "GALLERY_2" | "GALLERY_3" | "CANVAS_HERO_SEQUENCE" | "THREE_D_HERO_MODEL" }> = [
      { slot: "HERO_BACKGROUND", type: "HERO_BACKGROUND" },
      { slot: "BEFORE_SLOT", type: "BEFORE_SLOT" },
      { slot: "AFTER_SLOT", type: "AFTER_SLOT" },
      { slot: "GALLERY_1", type: "GALLERY_1" },
      { slot: "GALLERY_2", type: "GALLERY_2" },
      { slot: "GALLERY_3", type: "GALLERY_3" },
      { slot: "CANVAS_HERO_SEQUENCE", type: "CANVAS_HERO_SEQUENCE" },
      { slot: "THREE_D_HERO_MODEL", type: "THREE_D_HERO_MODEL" },
    ];

    const publicDir = path.resolve(process.cwd(), "public");

    for (const item of standardSlots) {
      // Find matching asset in project.assets
      const matched = project.assets.find(
        (a) =>
          a.assetType === item.slot ||
          a.fileName.toLowerCase().includes(item.slot.toLowerCase())
      );

      if (matched) {
        const relSrc = matched.fileUrl.startsWith("/") ? matched.fileUrl.slice(1) : matched.fileUrl;
        const physicalSrc = path.join(publicDir, relSrc);

        if (fs.existsSync(physicalSrc)) {
          let destDir = assetsImagesDir;
          let relPath = `./assets/images/${matched.fileName}`;

          if (matched.assetType === "MODEL_3D" || matched.fileName.endsWith(".glb")) {
            destDir = assetsModelsDir;
            relPath = `./assets/models/${matched.fileName}`;
          } else if (matched.assetType === "VIDEO" || matched.fileName.endsWith(".mp4")) {
            destDir = assetsVideosDir;
            relPath = `./assets/videos/${matched.fileName}`;
          }

          const targetFile = path.join(destDir, matched.fileName);
          fs.copyFileSync(physicalSrc, targetFile);
          const stat = fs.statSync(targetFile);

          assetMap[item.slot] = relPath;
          generatedAssetRefs.push({
            slot: item.slot,
            fileName: matched.fileName,
            localPath: relPath,
            originalUrl: matched.fileUrl,
            assetType: matched.assetType,
            isFallback: false,
            fileSize: stat.size,
          });
          copiedCount++;
          continue;
        }
      }

      // Generate deterministic fallback
      const slotReq = SLOT_SPECIFICATIONS[item.type as keyof typeof SLOT_SPECIFICATIONS] || {
        slotName: item.slot,
        label: item.slot,
        aspectRatio: "16:9",
        recommendedWidth: 1200,
        recommendedHeight: 675,
        allowedTypes: ["IMAGE"],
        required: true,
      };
      const fallbackSvg = AssetFallbackGenerator.generateFallbackDataUri(
        slotReq,
        project.category,
        project.name
      );
      // Convert Data URI to pure SVG content and save locally
      const base64Index = fallbackSvg.indexOf("base64,");
      const fileName = `${item.slot.toLowerCase()}-fallback.svg`;
      const targetPath = path.join(assetsImagesDir, fileName);
      const relPath = `./assets/images/${fileName}`;

      if (base64Index !== -1) {
        const svgContent = Buffer.from(fallbackSvg.slice(base64Index + 7), "base64");
        fs.writeFileSync(targetPath, svgContent);
      } else {
        fs.writeFileSync(targetPath, fallbackSvg);
      }

      const stat = fs.statSync(targetPath);
      assetMap[item.slot] = relPath;
      generatedAssetRefs.push({
        slot: item.slot,
        fileName,
        localPath: relPath,
        assetType: "IMAGE_FALLBACK",
        isFallback: true,
        fileSize: stat.size,
      });
      fallbackCount++;
    }

    // 7. Compile CSS
    const compiledCss = CssCompiler.compileStylesheet(design);
    const cssPath = path.join(cssDir, "styles.css");
    fs.writeFileSync(cssPath, compiledCss, "utf8");

    // 8. Bundle Runtime JS and Vendor Scripts
    const runtimeJs = JsBundler.generateRuntimeJs();
    const runtimeJsPath = path.join(jsDir, "runtime.js");
    fs.writeFileSync(runtimeJsPath, runtimeJs, "utf8");

    const tierScripts: string[] = ["js/runtime.js"];
    const copiedVendors = JsBundler.copyVendors(outputDir, experienceTier);
    tierScripts.push(...copiedVendors);

    // Cinematic runtime
    if (experienceTier === "CINEMATIC" || experienceTier === "IMMERSIVE_3D") {
      const cinematicJs = CinematicIntegration.generateCinematicScript(design);
      const cinematicJsPath = path.join(jsDir, "cinematic.js");
      fs.writeFileSync(cinematicJsPath, cinematicJs, "utf8");
      tierScripts.push("js/cinematic.js");
    }

    // Immersive 3D runtime
    if (experienceTier === "IMMERSIVE_3D") {
      const modelPath = assetMap["THREE_D_HERO_MODEL"] || "";
      const immersiveJs = ImmersiveIntegration.generateImmersiveScript(design, modelPath);
      const immersiveJsPath = path.join(jsDir, "immersive-3d.js");
      fs.writeFileSync(immersiveJsPath, immersiveJs, "utf8");
      tierScripts.push("js/immersive-3d.js");
    }

    // 9. Compile All Pages into HTML files
    const generatedPagesMeta: GeneratedPageMeta[] = [];

    for (const page of pages) {
      const compiledHtml = HtmlCompiler.compilePage({
        page,
        allPages: pages,
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          category: project.category,
          description: project.description,
        },
        design,
        categoryPack,
        assetMap,
        experienceTier,
      });

      const fileName = page.slug === "/" ? "index.html" : `${page.slug.replace(/^\//, "")}.html`;
      const htmlPath = path.join(outputDir, fileName);
      fs.writeFileSync(htmlPath, compiledHtml, "utf8");

      generatedPagesMeta.push({
        slug: page.slug,
        title: page.title,
        fileName,
        filePath: fileName,
        sectionCount: page.sections.length,
        components: page.sections.map((s) => s.componentId),
        seoTitle: page.seoTitle || undefined,
        seoDescription: page.seoDescription || undefined,
      });
    }

    // 10. Verify Zero-CDN Dependencies
    let zeroCdnVerified = true;
    const checkZeroCdn = (filePath: string) => {
      const content = fs.readFileSync(filePath, "utf8");
      // Match script or link src/href containing http:// or https:// (ignoring schema.org in json-ld)
      const matches = content.match(/(src|href)=["']https?:\/\/[^"']+/g);
      if (matches) {
        zeroCdnVerified = false;
        warnings.push(`Zero-CDN Violation in ${path.basename(filePath)}: ${matches.join(", ")}`);
      }
    };

    generatedPagesMeta.forEach((p) => checkZeroCdn(path.join(outputDir, p.fileName)));
    checkZeroCdn(cssPath);
    checkZeroCdn(runtimeJsPath);

    // 11. Create Build Manifest
    const manifest: BuildManifest = {
      buildId,
      projectId: project.id,
      projectName: project.name,
      projectSlug: project.slug,
      category: project.category,
      designPreset: project.designConfig?.preset || "DEFAULT",
      experienceTier,
      pages: generatedPagesMeta,
      assetManifest: {
        totalAssets: generatedAssetRefs.length,
        copiedAssets: copiedCount,
        fallbackAssets: fallbackCount,
        assets: generatedAssetRefs,
      },
      styles: ["css/styles.css"],
      scripts: tierScripts,
      generatedAt: new Date().toISOString(),
      zeroCdnVerified,
      status: zeroCdnVerified ? "SUCCESS" : "WARNING",
      warnings,
    };

    const manifestPath = path.join(outputDir, "build-manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    // 12. Generate Production Deployment Package (Phase 6.3)
    try {
      DeploymentManifestGenerator.generateDeploymentPackage(outputDir, manifest);
    } catch (deployErr: any) {
      warnings.push(`Deployment package generation warning: ${deployErr.message}`);
    }

    // 13. Create ZIP archive if requested or by default
    let zipPath: string | undefined = undefined;
    if (options.zip !== false) {
      zipPath = path.join(outputDir, `../${project.slug || project.id}_website_${buildId}.zip`);
      ZipBundler.createZipFromDirectory(outputDir, zipPath);
    }

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      buildId,
      outputDirectory: outputDir,
      manifest,
      zipPath,
      pageCount: generatedPagesMeta.length,
      assetCount: generatedAssetRefs.length,
      durationMs,
      warnings,
    };
  }
}
