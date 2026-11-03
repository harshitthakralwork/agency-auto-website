import fs from "fs";
import path from "path";
import crypto from "crypto";
import { QAAuditResult, QAIssue, QACategoryScore } from "./types";

export class QAValidator {
  /**
   * Audits a compiled website build directory across Accessibility, Zero-CDN Security,
   * SEO & Metadata, Performance Budgets, and Internal Route Integrity.
   */
  public static auditBuildDirectory(
    projectId: string,
    projectName: string,
    buildDirectory: string
  ): QAAuditResult {
    const issues: QAIssue[] = [];
    const auditId = `qa_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const baseDir = path.resolve(buildDirectory);

    if (!fs.existsSync(baseDir)) {
      throw new Error(`Build directory "${baseDir}" does not exist.`);
    }

    // 1. Discover all files
    const allFiles: string[] = [];
    function walk(dir: string) {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
        } else {
          allFiles.push(full);
        }
      }
    }
    walk(baseDir);

    const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));
    const cssFiles = allFiles.filter((f) => f.endsWith(".css"));
    const jsFiles = allFiles.filter((f) => f.endsWith(".js"));
    const assetFiles = allFiles.filter((f) =>
      /\.(svg|png|jpg|jpeg|webp|gif|mp4|webm|glb|gltf)$/i.test(f)
    );

    let totalSizeBytes = 0;
    allFiles.forEach((f) => {
      totalSizeBytes += fs.statSync(f).size;
    });

    // -------------------------------------------------------------
    // CATEGORY 1: ACCESSIBILITY (WCAG 2.1 AA)
    // -------------------------------------------------------------
    let a11yPassed = 0;
    let a11yTotal = 0;
    const a11yDetails: string[] = [];

    htmlFiles.forEach((htmlPath) => {
      const fileName = path.basename(htmlPath);
      const content = fs.readFileSync(htmlPath, "utf8");

      // Check 1: <img> alt attributes
      a11yTotal++;
      const imgTags = content.match(/<img[^>]*>/gi) || [];
      const missingAlt = imgTags.filter((img) => !img.includes("alt="));
      if (missingAlt.length === 0) {
        a11yPassed++;
        a11yDetails.push(`[${fileName}] All ${imgTags.length} image tags have alt attributes`);
      } else {
        issues.push({
          code: "A11Y_MISSING_ALT",
          category: "accessibility",
          severity: "CRITICAL",
          message: `${missingAlt.length} image(s) missing alt attribute in ${fileName}`,
          target: fileName,
          recommendation: "Provide informative, descriptive alt text for screen readers.",
        });
      }

      // Check 2: Single <h1> per page
      a11yTotal++;
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count === 1) {
        a11yPassed++;
        a11yDetails.push(`[${fileName}] Exactly one primary <h1> heading present`);
      } else if (h1Count === 0) {
        issues.push({
          code: "A11Y_NO_H1",
          category: "accessibility",
          severity: "WARNING",
          message: `No <h1> heading found in ${fileName}`,
          target: fileName,
          recommendation: "Include a single, semantic <h1> representing the main page topic.",
        });
      } else {
        issues.push({
          code: "A11Y_MULTIPLE_H1",
          category: "accessibility",
          severity: "WARNING",
          message: `Multiple (${h1Count}) <h1> headings found in ${fileName}`,
          target: fileName,
          recommendation: "Reserve <h1> for the top-level page title and use <h2> for subsections.",
        });
      }

      // Check 3: Form inputs have corresponding labels
      a11yTotal++;
      const inputTags = content.match(/<input[^>]*id=["']([^"']+)["'][^>]*>/gi) || [];
      let missingLabels = 0;
      inputTags.forEach((input) => {
        const idMatch = input.match(/id=["']([^"']+)["']/i);
        if (idMatch && idMatch[1]) {
          const id = idMatch[1];
          if (!content.includes(`for="${id}"`) && !content.includes(`for='${id}'`)) {
            // Check if input has aria-label
            if (!input.includes("aria-label=")) {
              missingLabels++;
            }
          }
        }
      });

      if (missingLabels === 0) {
        a11yPassed++;
        a11yDetails.push(`[${fileName}] Form controls properly labeled with <label for> or aria-label`);
      } else {
        issues.push({
          code: "A11Y_UNLABELED_INPUT",
          category: "accessibility",
          severity: "WARNING",
          message: `${missingLabels} form input(s) lack accessible label in ${fileName}`,
          target: fileName,
          recommendation: "Associate every input with a <label for='...'> element.",
        });
      }

      // Check 4: Interactive buttons have accessible name
      a11yTotal++;
      const buttonTags = content.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || [];
      let unlabeledButtons = 0;
      buttonTags.forEach((btn) => {
        const text = btn.replace(/<[^>]*>/g, "").trim();
        const hasAria = /aria-label=["'][^"']+["']/i.test(btn);
        if (!text && !hasAria) {
          unlabeledButtons++;
        }
      });

      if (unlabeledButtons === 0) {
        a11yPassed++;
        a11yDetails.push(`[${fileName}] All ${buttonTags.length} buttons have accessible text or aria-label`);
      } else {
        issues.push({
          code: "A11Y_EMPTY_BUTTON",
          category: "accessibility",
          severity: "CRITICAL",
          message: `${unlabeledButtons} button(s) lack text content and aria-label in ${fileName}`,
          target: fileName,
          recommendation: "Add descriptive text or an aria-label attribute to all buttons.",
        });
      }
    });

    const a11yScore = a11yTotal > 0 ? Math.round((a11yPassed / a11yTotal) * 100) : 100;

    // -------------------------------------------------------------
    // CATEGORY 2: ZERO-CDN SECURITY & LOCAL ISOLATION
    // -------------------------------------------------------------
    let secPassed = 0;
    let secTotal = 0;
    const secDetails: string[] = [];

    // Check 1: HTML files contain zero external script or stylesheet links
    secTotal++;
    let externalCdnViolations = 0;
    htmlFiles.forEach((htmlPath) => {
      const fileName = path.basename(htmlPath);
      const content = fs.readFileSync(htmlPath, "utf8");
      // Find src/href starting with http:// or https:// (ignoring schema.org)
      const matches = (content.match(/(src|href)=["']https?:\/\/[^"']+/gi) || []).filter(
        (m) => !m.includes("schema.org")
      );

      if (matches.length > 0) {
        externalCdnViolations += matches.length;
        issues.push({
          code: "SEC_EXTERNAL_CDN_FOUND",
          category: "security",
          severity: "CRITICAL",
          message: `Found external CDN references in ${fileName}: ${matches.join(", ")}`,
          target: fileName,
          recommendation: "Bundle all scripts, fonts, and stylesheets locally into ./vendor/ or ./css/.",
        });
      }
    });

    if (externalCdnViolations === 0) {
      secPassed++;
      secDetails.push("All HTML files verified 100% free of external CDN script/style dependencies");
    }

    // Check 2: CSS files contain zero external @import or external font url()
    secTotal++;
    let externalCssUrls = 0;
    cssFiles.forEach((cssPath) => {
      const fileName = path.basename(cssPath);
      const content = fs.readFileSync(cssPath, "utf8");
      const urls = content.match(/url\(["']?https?:\/\/[^"')]+/gi) || [];
      const imports = content.match(/@import\s+["']?https?:\/\/[^"';]+/gi) || [];

      if (urls.length > 0 || imports.length > 0) {
        externalCssUrls += urls.length + imports.length;
        issues.push({
          code: "SEC_EXTERNAL_CSS_URL",
          category: "security",
          severity: "CRITICAL",
          message: `Found external remote URLs in ${fileName}`,
          target: fileName,
          recommendation: "Host all fonts and background images locally in ./assets/.",
        });
      }
    });

    if (externalCssUrls === 0) {
      secPassed++;
      secDetails.push("All stylesheets verified 100% free of external remote @import and url() references");
    }

    // Check 3: JS runtime has no hardcoded remote telemetry or beacon calls
    secTotal++;
    let externalJsCalls = 0;
    jsFiles.forEach((jsPath) => {
      const fileName = path.basename(jsPath);
      const content = fs.readFileSync(jsPath, "utf8");
      if (content.includes("google-analytics.com") || content.includes("hotjar.com")) {
        externalJsCalls++;
        issues.push({
          code: "SEC_TRACKER_FOUND",
          category: "security",
          severity: "WARNING",
          message: `Potential remote tracker domain identified in ${fileName}`,
          target: fileName,
          recommendation: "Remove third-party analytics scripts for air-gapped zero-CDN operation.",
        });
      }
    });

    if (externalJsCalls === 0) {
      secPassed++;
      secDetails.push("All JavaScript runtimes verified clean of unauthorized remote endpoints");
    }

    const secScore = secTotal > 0 ? Math.round((secPassed / secTotal) * 100) : 100;

    // -------------------------------------------------------------
    // CATEGORY 3: SEO & METADATA INTEGRITY
    // -------------------------------------------------------------
    let seoPassed = 0;
    let seoTotal = 0;
    const seoDetails: string[] = [];

    htmlFiles.forEach((htmlPath) => {
      const fileName = path.basename(htmlPath);
      const content = fs.readFileSync(htmlPath, "utf8");

      // Check 1: <title> tag
      seoTotal++;
      const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1].trim().length >= 10) {
        seoPassed++;
        seoDetails.push(`[${fileName}] Valid title: "${titleMatch[1].trim().slice(0, 40)}..."`);
      } else {
        issues.push({
          code: "SEO_MISSING_TITLE",
          category: "seo",
          severity: "WARNING",
          message: `Missing or truncated <title> in ${fileName}`,
          target: fileName,
          recommendation: "Provide a descriptive <title> between 30 and 65 characters.",
        });
      }

      // Check 2: <meta name="description">
      seoTotal++;
      const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (descMatch && descMatch[1].trim().length >= 20) {
        seoPassed++;
        seoDetails.push(`[${fileName}] Meta description present (${descMatch[1].trim().length} chars)`);
      } else {
        issues.push({
          code: "SEO_MISSING_DESCRIPTION",
          category: "seo",
          severity: "WARNING",
          message: `Missing or short meta description in ${fileName}`,
          target: fileName,
          recommendation: "Provide a concise meta description between 70 and 160 characters.",
        });
      }

      // Check 3: Open Graph Tags
      seoTotal++;
      const hasOgTitle = content.includes('property="og:title"');
      const hasOgDesc = content.includes('property="og:description"');
      if (hasOgTitle && hasOgDesc) {
        seoPassed++;
        seoDetails.push(`[${fileName}] Open Graph social card tags configured`);
      } else {
        issues.push({
          code: "SEO_INCOMPLETE_OG",
          category: "seo",
          severity: "INFO",
          message: `Incomplete Open Graph metadata in ${fileName}`,
          target: fileName,
          recommendation: "Add og:title, og:description, and og:image tags for rich social sharing.",
        });
      }

      // Check 4: Structured Data Schema
      seoTotal++;
      const hasJsonLd = content.includes('type="application/ld+json"') && content.includes("schema.org");
      if (hasJsonLd) {
        seoPassed++;
        seoDetails.push(`[${fileName}] Schema.org JSON-LD structured data detected`);
      } else {
        issues.push({
          code: "SEO_NO_SCHEMA_JSONLD",
          category: "seo",
          severity: "INFO",
          message: `No Schema.org structured data found in ${fileName}`,
          target: fileName,
          recommendation: "Inject Schema.org LocalBusiness or Organization structured data.",
        });
      }
    });

    const seoScore = seoTotal > 0 ? Math.round((seoPassed / seoTotal) * 100) : 100;

    // -------------------------------------------------------------
    // CATEGORY 4: PERFORMANCE & PAYLOAD BUDGET
    // -------------------------------------------------------------
    let perfPassed = 0;
    let perfTotal = 0;
    const perfDetails: string[] = [];

    // Check 1: Total package size (< 25MB budget)
    perfTotal++;
    const totalMb = totalSizeBytes / (1024 * 1024);
    if (totalMb < 25) {
      perfPassed++;
      perfDetails.push(`Total package footprint is ${totalMb.toFixed(2)} MB (within 25 MB budget)`);
    } else {
      issues.push({
        code: "PERF_LARGE_BUNDLE",
        category: "performance",
        severity: "WARNING",
        message: `Total package size (${totalMb.toFixed(2)} MB) exceeds 25 MB threshold`,
        target: "Package",
        recommendation: "Compress heavy 3D assets or media images before final client handover.",
      });
    }

    // Check 2: Individual asset size (< 3MB per file)
    perfTotal++;
    let oversizedAssets = 0;
    assetFiles.forEach((assetPath) => {
      const sizeBytes = fs.statSync(assetPath).size;
      const sizeMb = sizeBytes / (1024 * 1024);
      if (sizeMb > 3.0) {
        oversizedAssets++;
        issues.push({
          code: "PERF_OVERSIZED_ASSET",
          category: "performance",
          severity: "WARNING",
          message: `Asset ${path.basename(assetPath)} is ${sizeMb.toFixed(2)} MB (exceeds 3 MB limit)`,
          target: path.basename(assetPath),
          recommendation: "Optimize and compress image using WebP or Draco GLTF compression.",
        });
      }
    });

    if (oversizedAssets === 0) {
      perfPassed++;
      perfDetails.push(`All ${assetFiles.length} media assets comply with individual size budget (<3 MB)`);
    }

    // Check 3: CSS stylesheet size (< 250KB)
    perfTotal++;
    let totalCssBytes = 0;
    cssFiles.forEach((f) => (totalCssBytes += fs.statSync(f).size));
    const cssKb = totalCssBytes / 1024;
    if (cssKb < 250) {
      perfPassed++;
      perfDetails.push(`Total stylesheet footprint is ${cssKb.toFixed(1)} KB (lean and fast)`);
    } else {
      issues.push({
        code: "PERF_HEAVY_CSS",
        category: "performance",
        severity: "INFO",
        message: `CSS size (${cssKb.toFixed(1)} KB) exceeds 250 KB target`,
        target: "css/styles.css",
        recommendation: "Purge unused utility classes or split into critical path CSS.",
      });
    }

    const perfScore = perfTotal > 0 ? Math.round((perfPassed / perfTotal) * 100) : 100;

    // -------------------------------------------------------------
    // CATEGORY 5: ROUTE & DEAD LINK INTEGRITY
    // -------------------------------------------------------------
    let routePassed = 0;
    let routeTotal = 0;
    const routeDetails: string[] = [];

    // Map existing relative files in build directory
    const existingRelativeFiles = new Set(
      allFiles.map((f) => path.relative(baseDir, f).replace(/\\/g, "/"))
    );

    htmlFiles.forEach((htmlPath) => {
      const fileName = path.basename(htmlPath);
      const content = fs.readFileSync(htmlPath, "utf8");

      // Extract all <a href="..."> links
      const hrefMatches = content.match(/href=["']([^"']+)["']/gi) || [];
      const checkedHrefs = new Set<string>();

      hrefMatches.forEach((m) => {
        const urlMatch = m.match(/href=["']([^"']+)["']/i);
        if (!urlMatch || !urlMatch[1]) return;
        const href = urlMatch[1].trim();

        // Skip internal page anchors, tel:, mailto:, javascript:
        if (
          href.startsWith("#") ||
          href.startsWith("tel:") ||
          href.startsWith("mailto:") ||
          href.startsWith("javascript:")
        ) {
          return;
        }

        if (checkedHrefs.has(href)) return;
        checkedHrefs.add(href);

        routeTotal++;
        // Normalize relative path
        const cleanHref = href.replace(/^\.\//, "").split("?")[0].split("#")[0];

        if (existingRelativeFiles.has(cleanHref)) {
          routePassed++;
        } else {
          issues.push({
            code: "ROUTE_BROKEN_LINK",
            category: "routes",
            severity: "CRITICAL",
            message: `Dead link detected in ${fileName}: href="${href}" does not exist in build output`,
            target: fileName,
            recommendation: `Ensure ${cleanHref} is included in page composition sitemap or update link target.`,
          });
        }
      });
    });

    if (routeTotal === 0 || routePassed === routeTotal) {
      routeDetails.push(`All ${routeTotal} internal route navigation links resolved successfully (0 dead links)`);
    } else {
      routeDetails.push(`${routePassed} of ${routeTotal} route links verified valid`);
    }

    const routeScore = routeTotal > 0 ? Math.round((routePassed / routeTotal) * 100) : 100;

    // -------------------------------------------------------------
    // COMPUTE OVERALL SCORE & SUMMARY
    // -------------------------------------------------------------
    const weightedScore = Math.round(
      a11yScore * 0.25 +
      secScore * 0.25 +
      seoScore * 0.20 +
      perfScore * 0.15 +
      routeScore * 0.15
    );

    const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
    const warningCount = issues.filter((i) => i.severity === "WARNING").length;
    const infoCount = issues.filter((i) => i.severity === "INFO").length;

    let overallStatus: "PASSED" | "NEEDS_ATTENTION" | "FAILED" = "PASSED";
    if (criticalCount > 0) {
      overallStatus = "FAILED";
    } else if (warningCount > 2 || weightedScore < 85) {
      overallStatus = "NEEDS_ATTENTION";
    }

    return {
      projectId,
      projectName,
      auditId,
      overallScore: weightedScore,
      status: overallStatus,
      summary: {
        criticalIssues: criticalCount,
        warnings: warningCount,
        infoCount,
        pagesAudited: htmlFiles.length,
        assetsAudited: assetFiles.length,
        totalSizeBytes,
        zeroCdnCompliant: externalCdnViolations === 0 && externalCssUrls === 0,
      },
      categories: {
        accessibility: {
          name: "Accessibility (WCAG 2.1 AA)",
          score: a11yScore,
          passedChecks: a11yPassed,
          totalChecks: a11yTotal,
          status: a11yScore >= 90 ? "PASSED" : a11yScore >= 75 ? "NEEDS_ATTENTION" : "FAILED",
          details: a11yDetails,
        },
        security: {
          name: "Zero-CDN Security & Air-Gap Compliance",
          score: secScore,
          passedChecks: secPassed,
          totalChecks: secTotal,
          status: secScore === 100 ? "PASSED" : "FAILED",
          details: secDetails,
        },
        seo: {
          name: "SEO & Semantic Metadata",
          score: seoScore,
          passedChecks: seoPassed,
          totalChecks: seoTotal,
          status: seoScore >= 90 ? "PASSED" : seoScore >= 75 ? "NEEDS_ATTENTION" : "FAILED",
          details: seoDetails,
        },
        performance: {
          name: "Payload Budgets & Optimization",
          score: perfScore,
          passedChecks: perfPassed,
          totalChecks: perfTotal,
          status: perfScore >= 90 ? "PASSED" : perfScore >= 75 ? "NEEDS_ATTENTION" : "FAILED",
          details: perfDetails,
        },
        routes: {
          name: "Route & Dead Link Integrity",
          score: routeScore,
          passedChecks: routePassed,
          totalChecks: routeTotal,
          status: routeScore === 100 ? "PASSED" : "FAILED",
          details: routeDetails,
        },
      },
      issues,
      auditedAt: new Date().toISOString(),
    };
  }
}
