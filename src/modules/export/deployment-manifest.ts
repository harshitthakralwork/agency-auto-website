import fs from "fs";
import path from "path";
import { BuildManifest } from "../generator/types";

export interface DeploymentConfig {
  projectName: string;
  projectSlug: string;
  buildId: string;
  experienceTier: string;
  category: string;
  generatedAt: string;
  routes: Array<{ path: string; file: string; title: string }>;
  securityHeaders: Record<string, string>;
  cacheRules: Array<{ glob: string; cacheControl: string }>;
  targetConfigs: {
    netlify: { cleanUrls: boolean };
    vercel: { cleanUrls: boolean };
    nginx: { rootDir: string };
    apache: { modRewrite: boolean };
  };
}

export class DeploymentManifestGenerator {
  /**
   * Generates production deployment manifests, configuration files (Vercel, Netlify, Nginx, Apache),
   * and comprehensive client handoff documentation inside the exported directory.
   */
  public static generateDeploymentPackage(
    outputDirectory: string,
    manifest: BuildManifest
  ): void {
    const outDir = path.resolve(outputDirectory);

    const routes = manifest.pages.map((p) => ({
      path: p.slug,
      file: p.fileName,
      title: p.title,
    }));

    const securityHeaders: Record<string, string> = {
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'self';",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    const cacheRules = [
      { glob: "/assets/**", cacheControl: "public, max-age=31536000, immutable" },
      { glob: "/vendor/**", cacheControl: "public, max-age=31536000, immutable" },
      { glob: "/css/**", cacheControl: "public, max-age=86400, stale-while-revalidate=604800" },
      { glob: "/js/**", cacheControl: "public, max-age=86400, stale-while-revalidate=604800" },
      { glob: "/*.html", cacheControl: "public, max-age=0, must-revalidate" },
    ];

    // 1. Write deploy.json
    const deployConfig: DeploymentConfig = {
      projectName: manifest.projectName,
      projectSlug: manifest.projectSlug,
      buildId: manifest.buildId,
      experienceTier: manifest.experienceTier,
      category: manifest.category,
      generatedAt: manifest.generatedAt,
      routes,
      securityHeaders,
      cacheRules,
      targetConfigs: {
        netlify: { cleanUrls: true },
        vercel: { cleanUrls: true },
        nginx: { rootDir: "/var/www/html" },
        apache: { modRewrite: true },
      },
    };

    fs.writeFileSync(
      path.join(outDir, "deploy.json"),
      JSON.stringify(deployConfig, null, 2),
      "utf8"
    );

    // 2. Write Vercel configuration (vercel.json)
    const vercelConfig = {
      cleanUrls: true,
      headers: [
        {
          source: "/(.*)",
          headers: Object.entries(securityHeaders).map(([key, value]) => ({ key, value })),
        },
        {
          source: "/(assets|vendor)/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
        },
      ],
    };

    fs.writeFileSync(
      path.join(outDir, "vercel.json"),
      JSON.stringify(vercelConfig, null, 2),
      "utf8"
    );

    // 3. Write Netlify headers and redirects (_headers, _redirects)
    let netlifyHeaders = "/*\n";
    Object.entries(securityHeaders).forEach(([k, v]) => {
      netlifyHeaders += `  ${k}: ${v}\n`;
    });
    netlifyHeaders += "\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n";
    netlifyHeaders += "/vendor/*\n  Cache-Control: public, max-age=31536000, immutable\n";

    fs.writeFileSync(path.join(outDir, "_headers"), netlifyHeaders, "utf8");

    let netlifyRedirects = "";
    routes.forEach((r) => {
      if (r.path !== "/") {
        const cleanPath = r.path.startsWith("/") ? r.path : `/${r.path}`;
        netlifyRedirects += `${cleanPath}  /${r.file}  200\n`;
      }
    });
    fs.writeFileSync(path.join(outDir, "_redirects"), netlifyRedirects, "utf8");

    // 4. Write Apache .htaccess
    const htaccess = `# Apache 2.4 Server Configuration for ${manifest.projectName}
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Clean URLs (drop .html)
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  
  <FilesMatch "\\.(html)$">
    Header set Cache-Control "max-age=0, must-revalidate"
  </FilesMatch>
  
  <FilesMatch "\\.(css|js)$">
    Header set Cache-Control "max-age=86400, public"
  </FilesMatch>

  <FilesMatch "\\.(jpg|jpeg|png|gif|svg|webp|glb|gltf|mp4)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
  </FilesMatch>
</IfModule>
`;
    fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess, "utf8");

    // 5. Write Nginx sample configuration
    const nginxConf = `# Nginx Server Block Configuration for ${manifest.projectName}
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;
    root /var/www/html;
    index index.html;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;" always;

    # Clean URL routing
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # Static Asset Caching
    location ~* \\.(?:css|js)$ {
        expires 1d;
        add_header Cache-Control "public, no-transform";
    }

    location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|webp|glb|gltf|mp4)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /robots.txt { log_not_found off; access_log off; }
    location = /favicon.ico { log_not_found off; access_log off; }
}
`;
    fs.writeFileSync(path.join(outDir, "nginx.conf.sample"), nginxConf, "utf8");

    // 6. Write Client-Facing DEPLOYMENT.md
    const clientDoc = `# Deployment & Hosting Manual — ${manifest.projectName}

This website package has been generated by the Agency Website Engine as a **zero-CDN, air-gapped, standalone static web application**.

## Package Summary
- **Project Name:** ${manifest.projectName}
- **Experience Tier:** ${manifest.experienceTier}
- **Category:** ${manifest.category}
- **Build ID:** \`${manifest.buildId}\`
- **Generated At:** ${manifest.generatedAt}
- **Zero-CDN Compliance:** Verified (100% local scripts, fonts, and stylesheets)

---

## 1. Local Testing & Verification
You can test this website locally on any workstation without installing node, npm, or build dependencies:

### Using Python (Native on Windows/Mac/Linux):
\`\`\`bash
# Run in the root of this folder
python -m http.server 8080
# Visit: http://localhost:8080
\`\`\`

### Using Node.js (npx):
\`\`\`bash
npx serve .
\`\`\`

---

## 2. Instant Static Cloud Hosting

### Netlify
1. Log into your Netlify dashboard.
2. Drag and drop this folder directly into the Netlify "Sites" area.
3. The included \`_headers\` and \`_redirects\` files are automatically recognized and apply clean URLs and security headers.

### Vercel
1. Install Vercel CLI (\`npm i -g vercel\`) or use the Vercel Web Dashboard.
2. Run \`vercel deploy\` inside this folder.
3. The included \`vercel.json\` will automatically configure clean URLs and immutable asset caching.

### Cloudflare Pages
1. Connect this folder via GitHub or direct ZIP upload in Cloudflare Pages.
2. Build command: Leave empty.
3. Output directory: \`.\` (Root).

### AWS S3 + CloudFront
1. Create an S3 Bucket configured for Static Website Hosting.
2. Upload all files maintaining directory structure (\`/css\`, \`/js\`, \`/assets\`, \`/vendor\`).
3. Connect an AWS CloudFront distribution pointing to the S3 bucket origin.
4. Set Default Root Object to \`index.html\`.

---

## 3. Traditional Web Servers

### Nginx
1. Copy all files into \`/var/www/html\`.
2. Inspect and adapt the provided \`nginx.conf.sample\` to your server block in \`/etc/nginx/sites-available/\`.
3. Test configuration: \`sudo nginx -t\`.
4. Reload Nginx: \`sudo systemctl reload nginx\`.

### Apache
1. Copy all files into \`/var/www/html\` or your virtual host directory.
2. Ensure \`mod_rewrite\` and \`mod_headers\` are enabled (\`a2enmod rewrite headers\`).
3. The included \`.htaccess\` automatically configures clean URLs and caching.

---

## 4. Technical File Structure
\`\`\`
.
├── index.html                # Home page
├── services.html             # Services catalog page
├── contact.html              # Inquiries and booking page
├── css/
│   └── styles.css            # Standalone stylesheet with design tokens
├── js/
│   ├── runtime.js            # Vanilla navigation, accordions & form logic
│   ├── cinematic.js          # GSAP scroll choreography (Cinematic tier)
│   └── immersive-3d.js       # Three.js spatial scene loader (3D tier)
├── vendor/                   # Local zero-CDN vendor libraries (Three.js, GSAP)
├── assets/
│   ├── images/               # High-resolution optimized imagery & SVG fallbacks
│   └── models/               # 3D GLB/GLTF spatial meshes
├── deploy.json               # Structured deployment manifest
├── vercel.json               # Vercel deployment configuration
├── _headers                  # Netlify security headers
├── _redirects                # Netlify routing rules
├── .htaccess                 # Apache rewrite and cache configuration
└── nginx.conf.sample         # Nginx server block configuration
\`\`\`

&copy; ${new Date().getFullYear()} ${manifest.projectName}. Produced with Agency Website Engine.
`;

    fs.writeFileSync(path.join(outDir, "DEPLOYMENT.md"), clientDoc, "utf8");
  }
}
