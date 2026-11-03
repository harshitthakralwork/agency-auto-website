import fs from "fs";
import path from "path";
import http from "http";
import { execSync } from "child_process";
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

// Simple static file server for local unpacked verification
function startStaticServer(rootDir: string, port: number): Promise<http.Server> {
  const mimeMap: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url?.split("?")[0] || "/";
    let filePath = path.join(rootDir, reqUrl);

    // Clean URL resolution: if path does not exist and has no extension, try .html
    if (!fs.existsSync(filePath) && !path.extname(filePath)) {
      if (fs.existsSync(filePath + ".html")) {
        filePath = filePath + ".html";
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { "Content-Type": mimeMap[ext] || "text/plain" });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function runTests() {
  console.log("\n=== AGENCY WEBSITE ENGINE: PHASE 6.3 EXPORT & DEPLOYMENT VERIFICATION ===\n");

  const testSlug = `deploy-test-${Date.now()}`;
  console.log(`Setting up test project '${testSlug}' in database...`);

  // 1. Create Test Project
  const project = await db.project.create({
    data: {
      name: "Apex Industrial Robotics",
      slug: testSlug,
      category: "technology",
      experienceLevel: "CINEMATIC",
      description: "Advanced autonomous robotic systems and manufacturing intelligence platforms.",
      designConfig: {
        create: {
          preset: "cinematic",
          primaryColor: "#0284c7",
          secondaryColor: "#0f172a",
          accentColor: "#38bdf8",
          backgroundColor: "#0b0f17",
          surfaceColor: "#1e293b",
          textColor: "#f8fafc",
          mutedTextColor: "#94a3b8",
          headingFont: "Inter",
          bodyFont: "Inter",
          baseFontSize: "16px",
          layoutStyle: "modern-contained",
          borderRadius: "8px",
          containerWidth: "1280px",
          animationIntensity: "medium",
          enableCanvasFx: false,
          threeDPreferences: JSON.stringify({}),
          mediaPreferences: JSON.stringify({}),
          sectionsConfigJson: JSON.stringify([]),
          responsiveSettings: JSON.stringify({}),
        },
      },
    },
  });

  try {
    // 2. Compose Pages: Home (/), Solutions (/solutions), Contact (/contact)
    console.log("Composing multi-page tree...");
    const homePage = await CompositionService.createPage({
      projectId: project.id,
      title: "Home",
      slug: "/",
      seoTitle: "Apex Robotics — Autonomous Manufacturing Systems",
      seoDescription: "Industrial robotic automation systems designed for aerospace and automotive manufacturing.",
    });

    await CompositionService.addSection(homePage.id, {
      componentId: "hero_fullscreen_visual",
      order: 0,
      propsOverride: {
        headline: "Robotics Reimagined",
        subheadline: "Autonomous high-precision industrial robotic cells.",
        ctaText: "Explore Platforms",
        ctaUrl: "/solutions",
      },
    });

    await CompositionService.addSection(homePage.id, {
      componentId: "social_proof_metric_counter",
      order: 1,
      propsOverride: {
        title: "Proven Production Metrics",
        metrics: [
          { value: "99.98%", label: "System Uptime" },
          { value: "450+", label: "Robots Deployed" },
          { value: "4x", label: "Throughput Multiplier" },
        ],
      },
    });

    const solutionsPage = await CompositionService.createPage({
      projectId: project.id,
      title: "Solutions",
      slug: "/solutions",
      seoTitle: "Automation Solutions — Apex Robotics",
      seoDescription: "Turnkey robotic fabrication cells and adaptive machine tending systems.",
    });

    await CompositionService.addSection(solutionsPage.id, {
      componentId: "business_feature_matrix",
      order: 0,
      propsOverride: {
        headline: "Robotic Automation Capabilities",
        description: "Modular cell designs for machining, assembly, welding, and quality inspection.",
      },
    });

    const contactPage = await CompositionService.createPage({
      projectId: project.id,
      title: "Contact",
      slug: "/contact",
      seoTitle: "Inquire & Consult — Apex Robotics",
      seoDescription: "Request technical engineering consultations and cell cycle time estimations.",
    });

    await CompositionService.addSection(contactPage.id, {
      componentId: "conversion_appointment_scheduler",
      order: 0,
      propsOverride: {
        headline: "Schedule Engineering Consultation",
        subheadline: "Meet with our robotics applications team.",
      },
    });

    // 3. Generate Complete Website & Deployment Package
    console.log("\nGenerating complete website package with deployment configs and ZIP...");
    const genResult = await WebsiteGeneratorService.generateWebsite(project.id, { zip: true });

    assert(genResult.success === true, "Website generation returned success: true");
    assert(Boolean(genResult.outputDirectory), "Output directory path returned");
    assert(fs.existsSync(genResult.outputDirectory), "Output directory exists on disk");
    assert(Boolean(genResult.zipPath), "ZIP archive path returned");
    assert(fs.existsSync(genResult.zipPath!), "ZIP archive file exists on filesystem");

    const zipStat = fs.statSync(genResult.zipPath!);
    assert(zipStat.size > 5000, `ZIP archive has non-trivial size (${zipStat.size} bytes)`);

    const outDir = genResult.outputDirectory;

    // 4. Verify deploy.json Manifest
    console.log("\nVerifying deploy.json manifest...");
    const deployJsonPath = path.join(outDir, "deploy.json");
    assert(fs.existsSync(deployJsonPath), "deploy.json file exists in output directory");

    const deployConfig = JSON.parse(fs.readFileSync(deployJsonPath, "utf8"));
    assert(deployConfig.projectName === "Apex Industrial Robotics", "deploy.json contains correct projectName");
    assert(deployConfig.experienceTier === "CINEMATIC", "deploy.json contains CINEMATIC experience tier");
    assert(Array.isArray(deployConfig.routes) && deployConfig.routes.length >= 3, "deploy.json routes array lists all 3 pages");
    assert(deployConfig.securityHeaders["Content-Security-Policy"]?.includes("default-src 'self'"), "deploy.json contains strict CSP");
    assert(deployConfig.securityHeaders["X-Content-Type-Options"] === "nosniff", "deploy.json enforces nosniff header");
    assert(Array.isArray(deployConfig.cacheRules) && deployConfig.cacheRules.length >= 4, "deploy.json contains structured cacheRules");
    assert(deployConfig.targetConfigs?.vercel?.cleanUrls === true, "deploy.json targetConfigs specifies Vercel cleanUrls");
    assert(deployConfig.targetConfigs?.apache?.modRewrite === true, "deploy.json targetConfigs specifies Apache modRewrite");

    // 5. Verify Vercel Configuration (vercel.json)
    console.log("\nVerifying vercel.json...");
    const vercelJsonPath = path.join(outDir, "vercel.json");
    assert(fs.existsSync(vercelJsonPath), "vercel.json exists");
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));
    assert(vercelConfig.cleanUrls === true, "vercel.json enables cleanUrls: true");
    assert(Array.isArray(vercelConfig.headers) && vercelConfig.headers.length >= 2, "vercel.json configures security & cache headers");

    // 6. Verify Netlify Configuration (_headers, _redirects)
    console.log("\nVerifying Netlify _headers and _redirects...");
    const netlifyHeadersPath = path.join(outDir, "_headers");
    assert(fs.existsSync(netlifyHeadersPath), "_headers file exists");
    const headersContent = fs.readFileSync(netlifyHeadersPath, "utf8");
    assert(headersContent.includes("Content-Security-Policy: default-src 'self'"), "_headers specifies CSP");
    assert(headersContent.includes("X-Frame-Options: SAMEORIGIN"), "_headers specifies X-Frame-Options");
    assert(headersContent.includes("immutable"), "_headers specifies immutable cache for static assets");

    const netlifyRedirectsPath = path.join(outDir, "_redirects");
    assert(fs.existsSync(netlifyRedirectsPath), "_redirects file exists");
    const redirectsContent = fs.readFileSync(netlifyRedirectsPath, "utf8");
    assert(redirectsContent.includes("/solutions  /solutions.html  200"), "_redirects has clean URL rewrite for /solutions");
    assert(redirectsContent.includes("/contact  /contact.html  200"), "_redirects has clean URL rewrite for /contact");

    // 7. Verify Apache .htaccess & Nginx Server Block
    console.log("\nVerifying .htaccess and nginx.conf.sample...");
    const htaccessPath = path.join(outDir, ".htaccess");
    assert(fs.existsSync(htaccessPath), ".htaccess file exists");
    const htaccessContent = fs.readFileSync(htaccessPath, "utf8");
    assert(htaccessContent.includes("RewriteEngine On"), ".htaccess enables RewriteEngine");
    assert(htaccessContent.includes("RewriteRule ^(.*)$ $1.html [L]"), ".htaccess enables clean URL rewriting");
    assert(htaccessContent.includes("Header set X-Content-Type-Options \"nosniff\""), ".htaccess sets nosniff header");

    const nginxPath = path.join(outDir, "nginx.conf.sample");
    assert(fs.existsSync(nginxPath), "nginx.conf.sample file exists");
    const nginxContent = fs.readFileSync(nginxPath, "utf8");
    assert(nginxContent.includes("try_files $uri $uri/ $uri.html =404;"), "nginx.conf.sample specifies clean URL try_files directive");
    assert(nginxContent.includes("add_header X-Content-Type-Options \"nosniff\""), "nginx.conf.sample specifies nosniff header");

    // 8. Verify Client Handoff Documentation (DEPLOYMENT.md)
    console.log("\nVerifying DEPLOYMENT.md...");
    const clientDocPath = path.join(outDir, "DEPLOYMENT.md");
    assert(fs.existsSync(clientDocPath), "DEPLOYMENT.md file exists");
    const docContent = fs.readFileSync(clientDocPath, "utf8");
    assert(docContent.includes("Deployment & Hosting Manual"), "DEPLOYMENT.md has main heading");
    assert(docContent.toLowerCase().includes("zero-cdn, air-gapped, standalone static web application"), "DEPLOYMENT.md highlights zero-CDN guarantee");
    assert(docContent.includes("Netlify") && docContent.includes("Vercel") && docContent.includes("Nginx"), "DEPLOYMENT.md details multiple hosting targets");

    // 9. Real ZIP Extraction & Integrity Verification
    console.log("\nExtracting exported ZIP archive into isolated temporary directory...");
    const extractDir = path.resolve(process.cwd(), "storage", "test-extract", testSlug);
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(extractDir, { recursive: true });

    // Use PowerShell Expand-Archive to test native OS extraction
    const zipAbsPath = path.resolve(genResult.zipPath!);
    execSync(`powershell -Command "Expand-Archive -Path '${zipAbsPath}' -DestinationPath '${extractDir}' -Force"`);

    assert(fs.existsSync(path.join(extractDir, "index.html")), "Extracted ZIP contains index.html");
    assert(fs.existsSync(path.join(extractDir, "solutions.html")), "Extracted ZIP contains solutions.html");
    assert(fs.existsSync(path.join(extractDir, "contact.html")), "Extracted ZIP contains contact.html");
    assert(fs.existsSync(path.join(extractDir, "css", "styles.css")), "Extracted ZIP contains css/styles.css");
    assert(fs.existsSync(path.join(extractDir, "js", "runtime.js")), "Extracted ZIP contains js/runtime.js");
    assert(fs.existsSync(path.join(extractDir, "js", "cinematic.js")), "Extracted ZIP contains js/cinematic.js");
    assert(fs.existsSync(path.join(extractDir, "deploy.json")), "Extracted ZIP contains deploy.json");
    assert(fs.existsSync(path.join(extractDir, "DEPLOYMENT.md")), "Extracted ZIP contains DEPLOYMENT.md");
    assert(fs.existsSync(path.join(extractDir, "vercel.json")), "Extracted ZIP contains vercel.json");
    assert(fs.existsSync(path.join(extractDir, "_headers")), "Extracted ZIP contains _headers");
    assert(fs.existsSync(path.join(extractDir, "_redirects")), "Extracted ZIP contains _redirects");
    assert(fs.existsSync(path.join(extractDir, ".htaccess")), "Extracted ZIP contains .htaccess");
    assert(fs.existsSync(path.join(extractDir, "nginx.conf.sample")), "Extracted ZIP contains nginx.conf.sample");

    // 10. Standalone Browser Verification of Unpacked Site
    console.log("\nStarting local HTTP server for extracted website on port 3099...");
    const server = await startStaticServer(extractDir, 3099);

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const networkRequests: string[] = [];
    page.on("request", (req) => {
      networkRequests.push(req.url());
    });

    console.log("Navigating to http://localhost:3099/ in headless Chromium...");
    const response = await page.goto("http://localhost:3099/", { waitUntil: "networkidle" });
    assert(response?.status() === 200, "Unpacked index.html loads with HTTP status 200");

    const pageTitle = await page.title();
    assert(pageTitle.includes("Apex"), `Page title reflects project metadata: '${pageTitle}'`);

    const hasH1 = await page.locator("h1").first().isVisible();
    assert(hasH1, "Rendered index.html contains visible <h1> element");

    // Verify 100% Zero External Requests
    console.log(`Checking ${networkRequests.length} browser requests for external CDN references...`);
    const externalRequests = networkRequests.filter((url) => !url.startsWith("http://localhost:3099"));
    assert(
      externalRequests.length === 0,
      `Zero external CDN requests made by real browser (Actual: ${externalRequests.length} external: [${externalRequests.join(", ")}])`
    );

    // Test Clean URL Routing to /solutions
    console.log("Testing Clean URL navigation to http://localhost:3099/solutions...");
    const solutionsResp = await page.goto("http://localhost:3099/solutions", { waitUntil: "networkidle" });
    assert(solutionsResp?.status() === 200, "Clean URL /solutions resolves to /solutions.html with HTTP status 200");

    const solutionsH1 = await page.locator("h1").first().textContent();
    assert(Boolean(solutionsH1), `Solutions page contains heading: '${solutionsH1}'`);

    await browser.close();
    server.close();

    // Cleanup extracted temp directory
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log("\n========================================================");
    console.log(`PHASE 6.3 VERIFICATION SUCCESSFUL: ${passedCount} / ${totalCount} ASSERTIONS PASSED (100%)`);
    console.log("========================================================\n");
  } finally {
    // Cleanup project in DB
    try {
      await db.pageComposition.deleteMany({ where: { projectId: project.id } });
      await db.projectDesignConfig.deleteMany({ where: { projectId: project.id } });
      await db.project.delete({ where: { id: project.id } });
    } catch {
      // Ignored
    }
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
