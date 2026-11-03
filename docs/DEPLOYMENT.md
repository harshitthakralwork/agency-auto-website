# Agency Website Engine — Production Deployment & Hosting Guide

## Overview

The Agency Website Engine compiles completed website projects into **100% self-contained, air-gapped, zero-CDN static distribution packages**. Every stylesheet, script, font, image, vector fallback, and 3D mesh is bundled locally within the artifact.

Exported packages are completely independent of Node.js, Next.js, or external package registries at runtime, making them portable to any modern static hosting service, traditional web server, CDN, or air-gapped enterprise intranet.

---

## Package Structure

Each generated build directory (and standalone `.zip` archive) includes the following unified structure:

```
├── index.html                    # Homepage (Clean URL: /)
├── [page-slug].html              # Additional site pages (e.g., services.html, contact.html)
├── css/
│   └── styles.css                # Scoped stylesheet with CSS custom properties (design tokens)
├── js/
│   ├── runtime.js                # Zero-CDN interactive runtime (drawer, accordions, slider, modals)
│   ├── cinematic.js              # Optional GSAP scroll choreography (Cinematic & 3D tiers)
│   └── immersive-3d.js           # Optional Three.js WebGL scene orchestrator (3D tier)
├── vendor/                       # Local vendor libraries (Three.js JSM, GSAP, ScrollTrigger)
├── assets/
│   ├── images/                   # High-resolution optimized photos & deterministic SVG fallbacks
│   ├── models/                   # 3D GLB/GLTF assets
│   └── videos/                   # Video assets
├── build-manifest.json           # Build audit manifest (page routes, asset counts, zero-CDN status)
├── deploy.json                   # Structured machine-readable deployment configuration
├── vercel.json                   # Vercel-ready clean URL and cache routing rules
├── _headers                      # Netlify security headers & cache controls
├── _redirects                    # Netlify clean URL rewrites
├── .htaccess                     # Apache 2.4 mod_rewrite & mod_headers rules
├── nginx.conf.sample             # Nginx production server block template
└── DEPLOYMENT.md                 # Client-facing handoff and hosting manual
```

---

## 1. Local Testing & Offline Verification

Because every resource is bundled with relative paths and explicit import maps, the site can be validated locally in seconds without build tools:

### Using Python 3:
```bash
# In the exported directory:
python -m http.server 8080
# Open http://localhost:8080
```

### Using Node.js:
```bash
npx serve . -p 8080
```

### Air-gapped / Local Intranet:
Files can be hosted directly on private subnets with no internet gateway enabled. All WebGL shaders, Three.js modules, and GSAP animation sequences run locally from the `/vendor` folder.

---

## 2. Server Configuration Templates

### A. Nginx

The included `nginx.conf.sample` provides an optimized configuration for high-traffic Linux servers:

```nginx
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
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self';" always;

    # Clean URL routing (e.g. /services -> /services.html)
    location / {
        try_files $uri $uri/ $uri.html =404;
    }

    # Immutable static assets (1 year cache)
    location ~* \.(?:jpg|jpeg|gif|png|ico|svg|webp|glb|gltf|mp4|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Styles and scripts (1 day cache + stale-while-revalidate)
    location ~* \.(?:css|js)$ {
        expires 1d;
        add_header Cache-Control "public, max-age=86400, stale-while-revalidate=604800";
    }

    # HTML documents (always validate with server)
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }
}
```

### B. Apache HTTP Server 2.4

The included `.htaccess` file activates when `AllowOverride All` is permitted:
- Enables `mod_rewrite` to resolve extensionless URLs (`/about` to `/about.html`).
- Sets HTTP response headers via `mod_headers`.
- Enforces strict cache headers via `FilesMatch`.

### C. Netlify

Deploy by dragging and dropping the export folder or connecting Git repository:
- `_redirects` transparently serves `/contact` from `/contact.html` with an HTTP 200 rewrite.
- `_headers` injects strict security headers, disables MIME sniffing, and provides long-lived immutable cache directives for `/assets/*` and `/vendor/*`.

### D. Vercel

Run `vercel deploy` or import into Vercel dashboard:
- `vercel.json` provides `cleanUrls: true`.
- Global security headers and directory-specific cache policies are registered natively.

### E. AWS S3 + CloudFront

1. **S3 Bucket:** Create bucket with "Static website hosting" enabled. Set index document to `index.html` and error document to `index.html` (or `404.html`).
2. **CloudFront Distribution:**
   - Set S3 origin with Origin Access Control (OAC).
   - Configure Viewer Protocol Policy to "Redirect HTTP to HTTPS".
   - Use CloudFront Functions / Lambda@Edge or CloudFront error pages (403/404 -> `/index.html`) if extensionless routing is desired.
   - Set TTL: Min TTL 0, Max TTL 31536000, Default TTL 86400.

---

## 3. Zero-CDN Verification Checklist

Before shipping to clients or publishing live:
1. **Automated QA Audit:** Run `GET /api/projects/:id/qa-audit` or trigger the QA drawer from the preview toolbar. Ensure zero critical security issues.
2. **Network Tab Inspection:** Open Chrome DevTools Network tab during navigation. Ensure all requests resolve to the local origin; zero requests should initiate to external CDNs (`cdnjs`, `unpkg`, `cdn.jsdelivr.net`, `fonts.googleapis.com`).
3. **Responsive Breakpoints:** Test viewports at 375px (mobile), 768px (tablet), and 1280px+ (desktop).
4. **Form Interception:** Test contact and booking forms. The default runtime provides graceful toast notifications and client-side validation.
