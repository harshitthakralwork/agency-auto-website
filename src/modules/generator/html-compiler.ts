import { PageCompositionData, PageSectionCompositionData } from "../composition/types";
import { ProjectDesignState } from "../design/types";
import { CategoryPack } from "../categories/types";
import { GeneratedPageMeta } from "./types";

export interface HtmlCompilerContext {
  page: PageCompositionData;
  allPages: PageCompositionData[];
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description?: string | null;
  };
  design: ProjectDesignState;
  categoryPack: CategoryPack;
  assetMap: Record<string, string>;
  experienceTier: "STANDARD" | "CINEMATIC" | "IMMERSIVE_3D";
}

export class HtmlCompiler {
  /**
   * Helper to escape HTML characters
   */
  private static escape(str: unknown): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Resolves an asset URL for a slot, falling back to a deterministic default
   */
  private static resolveAsset(assetMap: Record<string, string>, slot: string, fallback: string): string {
    return assetMap[slot] || fallback;
  }

  /**
   * Compiles a single PageComposition into a complete, accessible, semantic HTML5 document.
   */
  public static compilePage(context: HtmlCompilerContext): string {
    const { page, allPages, project, categoryPack, assetMap, experienceTier } = context;

    const pageTitle = page.seoTitle || page.title;
    const pageDesc = page.seoDescription || project.description || `${project.name} - Premier ${categoryPack.title} solutions.`;
    const canonicalSlug = page.slug === "/" ? "index.html" : `${page.slug.replace(/^\//, "")}.html`;

    // 1. Navigation items
    const navItems = allPages
      .filter((p) => p.navigationPlacement !== "HIDDEN")
      .map((p) => {
        const href = p.slug === "/" ? "index.html" : `${p.slug.replace(/^\//, "")}.html`;
        const isActive = p.id === page.id;
        return {
          title: p.title,
          href,
          isActive,
        };
      });

    // 2. Compile Sections
    const sectionHtmls = page.sections
      .filter((s) => s.enabled)
      .map((section) => this.renderSection(section, context))
      .join("\n\n");

    // 3. Structured Data JSON-LD
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": project.name,
      "description": pageDesc,
      "url": `./${canonicalSlug}`,
      "category": categoryPack.title,
    };

    // 4. Vendor Scripts
    let vendorScripts = "";
    if (experienceTier === "CINEMATIC" || experienceTier === "IMMERSIVE_3D") {
      vendorScripts += `  <script src="./vendor/gsap.min.js"></script>\n  <script src="./vendor/ScrollTrigger.min.js"></script>\n`;
    }
    if (experienceTier === "IMMERSIVE_3D") {
      vendorScripts += `  <script type="module" src="./vendor/three.module.js"></script>\n`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escape(pageTitle)} | ${this.escape(project.name)}</title>
  <meta name="description" content="${this.escape(pageDesc)}">
  
  <!-- Open Graph / Meta -->
  <meta property="og:title" content="${this.escape(pageTitle)}">
  <meta property="og:description" content="${this.escape(pageDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="./${canonicalSlug}">
  
  <!-- Canonical -->
  <link rel="canonical" href="./${canonicalSlug}">

  <!-- Unified Standalone Stylesheet -->
  <link rel="stylesheet" href="./css/styles.css">

  <!-- Structured Data Schema -->
  <script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body>
  <!-- Header / Navigation -->
  <header class="site-header" data-site-header>
    <div class="container nav-container">
      <a href="index.html" class="site-logo">
        <span>●</span> ${this.escape(project.name)}
      </a>

      <!-- Desktop Nav -->
      <ul class="nav-links-desktop">
${navItems
  .map(
    (item) =>
      `        <li><a href="${item.href}" class="nav-link${item.isActive ? " active" : ""}">${this.escape(item.title)}</a></li>`
  )
  .join("\n")}
      </ul>

      <div class="nav-actions-desktop">
        <a href="contact.html" class="btn btn-primary">Book Consultation</a>
      </div>

      <!-- Mobile Hamburger Button -->
      <button class="nav-mobile-toggle" data-mobile-nav-toggle aria-label="Toggle Navigation" aria-expanded="false" aria-controls="mobile-nav">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <!-- Mobile Nav Overlay & Drawer -->
  <div class="mobile-nav-overlay" data-mobile-nav-overlay></div>
  <aside id="mobile-nav" class="mobile-nav-menu" data-mobile-nav-menu aria-label="Mobile Navigation">
    <ul class="mobile-nav-links">
${navItems
  .map(
    (item) =>
      `      <li><a href="${item.href}">${this.escape(item.title)}</a></li>`
  )
  .join("\n")}
    </ul>
    <div style="margin-top: auto;">
      <a href="contact.html" class="btn btn-primary" style="width: 100%;">Book Consultation</a>
    </div>
  </aside>

  <!-- Main Content -->
  <main id="main-content">
${sectionHtmls}
  </main>

  <!-- Site Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="site-logo">
            <span>●</span> ${this.escape(project.name)}
          </a>
          <p>${this.escape(pageDesc)}</p>
          <div style="margin-top: 1rem;">
            <span class="badge">${this.escape(categoryPack.title)}</span>
          </div>
        </div>

        <div class="footer-col">
          <h4>Navigation</h4>
          <ul class="footer-links">
${navItems
  .map((item) => `            <li><a href="${item.href}">${this.escape(item.title)}</a></li>`)
  .join("\n")}
          </ul>
        </div>

        <div class="footer-col">
          <h4>Client Support</h4>
          <ul class="footer-links">
            <li><a href="contact.html">Inquiry & Appointments</a></li>
            <li><a href="about.html">Accreditations</a></li>
            <li><a href="services.html">Service Catalog</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Operating Hours</h4>
          <p style="font-size: 0.9rem; color: color-mix(in srgb, var(--color-foreground, #0f172a) 70%, transparent); line-height: 1.6;">
            Mon - Fri: 8:00 AM - 7:00 PM<br>
            Sat: 9:00 AM - 5:00 PM<br>
            Sun: By Appointment
          </p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} ${this.escape(project.name)}. All rights reserved.</p>
        <div style="display: flex; gap: 1.5rem;">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Accessibility</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- Runtime Client JavaScript (Zero CDN) -->
${vendorScripts}  <script src="./js/runtime.js"></script>
</body>
</html>
`;
  }

  /**
   * Dispatches and renders a single PageSectionComposition into semantic HTML.
   */
  private static renderSection(
    section: PageSectionCompositionData,
    context: HtmlCompilerContext
  ): string {
    const compId = section.componentId;
    const props = section.propsOverride || {};
    const { categoryPack, assetMap, project } = context;

    // Default fallbacks from Category
    const headline = String(props.headline || section.customName || `${categoryPack.title} Excellence`);
    const subheadline = String(props.subheadline || props.description || `Delivering precision, craftsmanship, and tailored outcomes for discerning clients.`);
    const ctaText = String(props.ctaText || "Get Started");
    const ctaSecondary = String(props.secondaryCtaText || "Learn More");

    // 1. HERO FAMILY
    if (compId.startsWith("hero-")) {
      const heroImage = this.resolveAsset(
        assetMap,
        "HERO_BACKGROUND",
        "./assets/images/hero-fallback.svg"
      );

      if (compId === "hero-centered") {
        return `    <section class="hero-section hero-centered" id="${section.id}">
      <div class="container">
        <div class="hero-content">
          <span class="badge">${this.escape(categoryPack.title)}</span>
          <h1>${this.escape(headline)}</h1>
          <p class="subtitle">${this.escape(subheadline)}</p>
          <div class="hero-actions">
            <a href="contact.html" class="btn btn-primary">${this.escape(ctaText)}</a>
            <a href="services.html" class="btn btn-secondary">${this.escape(ctaSecondary)}</a>
          </div>
        </div>
        <div class="hero-media-wrapper" style="margin-top: 3rem;">
          <img src="${heroImage}" alt="${this.escape(headline)}" loading="lazy">
        </div>
      </div>
    </section>`;
      }

      // Default hero (hero-split, hero-editorial, hero-video, hero-cinematic, hero-3d)
      return `    <section class="hero-section hero-split" id="${section.id}">
      <div class="container">
        <div class="hero-grid">
          <div class="hero-content">
            <span class="badge">${this.escape(categoryPack.title)}</span>
            <h1>${this.escape(headline)}</h1>
            <p class="subtitle">${this.escape(subheadline)}</p>
            <div class="hero-actions">
              <a href="contact.html" class="btn btn-primary">${this.escape(ctaText)}</a>
              <a href="services.html" class="btn btn-secondary">${this.escape(ctaSecondary)}</a>
            </div>
          </div>
          <div class="hero-media-wrapper">
            <img src="${heroImage}" alt="${this.escape(headline)}" loading="lazy">
          </div>
        </div>
      </div>
    </section>`;
    }

    // 2. BUSINESS FAMILY
    if (compId.startsWith("business-")) {
      if (compId === "business-stats") {
        const stats = Array.isArray(props.stats) && props.stats.length > 0
          ? props.stats
          : [
              { value: "99.8%", label: "Satisfaction Rate" },
              { value: "15+ Years", label: "Industry Leadership" },
              { value: "2,400+", label: "Successful Deliveries" },
              { value: "24/7", label: "Dedicated Support" },
            ];

        return `    <section class="business-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Performance</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="stats-grid">
${stats
  .map(
    (s: any) => `          <div class="stat-item">
            <div class="stat-value">${this.escape(s.value)}</div>
            <div class="stat-label">${this.escape(s.label)}</div>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>`;
      }

      // Services or Features Grid
      const items = Array.isArray(props.items) && props.items.length > 0
        ? props.items
        : [
            { title: "Strategic Precision", description: "Tailored methodologies configured around clinical and institutional goals." },
            { title: "Rapid Execution", description: "Engineered workflows ensuring immediate responsiveness and zero downtime." },
            { title: "Comprehensive Assurance", description: "Rigorous standards verified against industry benchmarks and certifications." },
          ];

      return `    <section class="business-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Capabilities</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="grid-cards cols-3">
${items
  .map(
    (item: any, i: number) => `          <div class="card">
            <div class="card-icon">0${i + 1}</div>
            <h3>${this.escape(item.title)}</h3>
            <p>${this.escape(item.description)}</p>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>`;
    }

    // 3. CONVERSION FAMILY
    if (compId.startsWith("conversion-")) {
      return `    <section class="conversion-section" id="${section.id}">
      <div class="container">
        <div class="conversion-box">
          <div class="section-header" style="margin-bottom: 2rem;">
            <span class="badge">Inquiry</span>
            <h2>${this.escape(headline)}</h2>
            <p>${this.escape(subheadline)}</p>
          </div>
          <form class="form-grid two-col" data-client-form>
            <div class="form-group">
              <label class="form-label" for="form-name-${section.id}">Full Name</label>
              <input type="text" id="form-name-${section.id}" class="form-input" required placeholder="Jane Doe">
            </div>
            <div class="form-group">
              <label class="form-label" for="form-email-${section.id}">Email Address</label>
              <input type="email" id="form-email-${section.id}" class="form-input" required placeholder="jane@example.com">
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label class="form-label" for="form-notes-${section.id}">Requirements / Message</label>
              <textarea id="form-notes-${section.id}" class="form-textarea" required placeholder="Describe your objectives..."></textarea>
            </div>
            <div style="grid-column: 1 / -1; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">${this.escape(ctaText)}</button>
            </div>
          </form>
        </div>
      </div>
    </section>`;
    }

    // 4. SOCIAL PROOF FAMILY
    if (compId.startsWith("social-proof-")) {
      const testimonials = Array.isArray(props.testimonials) && props.testimonials.length > 0
        ? props.testimonials
        : [
            { name: "Dr. Arthur Vance", role: "Executive Director", quote: "The caliber of execution exceeded every benchmark we established." },
            { name: "Eleanor Sterling", role: "Managing Principal", quote: "Immediate improvement in retention, client trust, and presentation quality." },
            { name: "Marcus Thorne", role: "Head of Operations", quote: "Seamless onboarding, flawless design integration, and exceptional velocity." },
          ];

      if (compId.includes("carousel")) {
        return `    <section class="social-proof-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Endorsements</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="carousel-container" data-carousel data-auto-play="6000">
          <div class="carousel-track" data-carousel-track>
${testimonials
  .map(
    (t: any) => `            <div class="carousel-slide" data-carousel-slide>
              <div class="review-card" style="max-width: 680px; margin: 0 auto; text-align: center;">
                <div class="stars">★★★★★</div>
                <p style="font-size: 1.15rem; font-style: italic; line-height: 1.7;">"${this.escape(t.quote)}"</p>
                <div style="margin-top: 1rem;">
                  <div class="author-name">${this.escape(t.name)}</div>
                  <div class="author-role">${this.escape(t.role)}</div>
                </div>
              </div>
            </div>`
  )
  .join("\n")}
          </div>
          <div class="carousel-controls">
            <button class="carousel-btn" data-carousel-prev aria-label="Previous Slide">‹</button>
            <div class="carousel-dots" data-carousel-dots></div>
            <button class="carousel-btn" data-carousel-next aria-label="Next Slide">›</button>
          </div>
        </div>
      </div>
    </section>`;
      }

      // Default Reviews Grid
      return `    <section class="social-proof-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Reputation</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="reviews-grid">
${testimonials
  .map(
    (t: any) => `          <div class="review-card">
            <div class="stars">★★★★★</div>
            <p>"${this.escape(t.quote)}"</p>
            <div class="author-meta">
              <div>
                <div class="author-name">${this.escape(t.name)}</div>
                <div class="author-role">${this.escape(t.role)}</div>
              </div>
            </div>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>`;
    }

    // 5. MEDIA FAMILY
    if (compId.startsWith("media-")) {
      if (compId === "media-before-after-slider") {
        const beforeImg = this.resolveAsset(assetMap, "BEFORE_SLOT", "./assets/images/before-fallback.svg");
        const afterImg = this.resolveAsset(assetMap, "AFTER_SLOT", "./assets/images/after-fallback.svg");

        return `    <section class="media-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Transformation</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="before-after-container" data-comparison-slider>
          <img class="before-after-after-image" src="${afterImg}" alt="After transformation">
          <div class="before-after-clip-layer" data-slider-clip>
            <img class="before-after-before-image" src="${beforeImg}" alt="Before transformation">
          </div>
          <div class="before-after-handle" data-slider-handle></div>
          <input type="range" min="0" max="100" value="50" class="sr-only" data-slider-range aria-label="Slide to compare transformation" style="position: absolute; opacity: 0; pointer-events: none;">
        </div>
      </div>
    </section>`;
      }

      // Gallery grid
      const galleryImages = [
        this.resolveAsset(assetMap, "GALLERY_1", "./assets/images/gallery-fallback-1.svg"),
        this.resolveAsset(assetMap, "GALLERY_2", "./assets/images/gallery-fallback-2.svg"),
        this.resolveAsset(assetMap, "GALLERY_3", "./assets/images/gallery-fallback-3.svg"),
      ];

      return `    <section class="media-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Visual Portfolio</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="gallery-grid">
${galleryImages
  .map(
    (src, i) => `          <div class="gallery-item">
            <img src="${src}" alt="Gallery item ${i + 1}" loading="lazy">
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>`;
    }

    // 6. CONTENT FAMILY
    if (compId.startsWith("content-")) {
      if (compId === "content-faq-accordion") {
        const faqs = Array.isArray(props.faqs) && props.faqs.length > 0
          ? props.faqs
          : [
              { question: "What is the typical project timeline?", answer: "Most engagements are completed within 4 to 8 weeks depending on scope, assets, and regulatory specifications." },
              { question: "Are services fully customized?", answer: "Yes. Every architecture, visual system, and workflow is specifically tailored to your organization." },
              { question: "What compliance standards are maintained?", answer: "We enforce strict adherence to SOC 2, HIPAA, WCAG accessibility, and zero-CDN security requirements." },
            ];

        return `    <section class="content-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Knowledge</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="accordion-group" data-accordion-group>
${faqs
  .map(
    (f: any, i: number) => `          <div class="accordion-item${i === 0 ? " is-open" : ""}" data-accordion-item>
            <button type="button" class="accordion-trigger" data-accordion-trigger aria-expanded="${i === 0 ? "true" : "false"}">
              <span>${this.escape(f.question)}</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-panel" data-accordion-panel${i === 0 ? ' style="max-height: 200px;"' : ""}>
              <div class="accordion-content">
                ${this.escape(f.answer)}
              </div>
            </div>
          </div>`
  )
  .join("\n")}
        </div>
      </div>
    </section>`;
      }

      if (compId === "content-pricing-table") {
        return `    <section class="content-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Investment</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="pricing-grid">
          <div class="pricing-card">
            <h3>Standard Tier</h3>
            <div class="pricing-price">$2,400</div>
            <p>Essential production foundation for emerging brands.</p>
            <ul class="pricing-features">
              <li>✓ Semantic Multi-Page Architecture</li>
              <li>✓ Design Preset Customization</li>
              <li>✓ Local Standalone Runtime</li>
            </ul>
            <a href="contact.html" class="btn btn-secondary" style="margin-top: auto;">Select Tier</a>
          </div>
          <div class="pricing-card is-featured">
            <span class="badge" style="align-self: flex-start; margin-bottom: 0.5rem;">Recommended</span>
            <h3>Cinematic Tier</h3>
            <div class="pricing-price">$4,800</div>
            <p>Advanced scroll-driven choreography and canvas sequences.</p>
            <ul class="pricing-features">
              <li>✓ Everything in Standard</li>
              <li>✓ GSAP Scroll Choreography</li>
              <li>✓ Frame Sequence Canvas Player</li>
              <li>✓ Priority SLA Delivery</li>
            </ul>
            <a href="contact.html" class="btn btn-primary" style="margin-top: auto;">Select Tier</a>
          </div>
          <div class="pricing-card">
            <h3>Immersive 3D Tier</h3>
            <div class="pricing-price">$8,500</div>
            <p>Spatial Three.js WebGL scenes and interactive lighting.</p>
            <ul class="pricing-features">
              <li>✓ Everything in Cinematic</li>
              <li>✓ Interactive Three.js WebGL</li>
              <li>✓ Studio HDRI Lighting Rig</li>
              <li>✓ White-Glove Support</li>
            </ul>
            <a href="contact.html" class="btn btn-secondary" style="margin-top: auto;">Select Tier</a>
          </div>
        </div>
      </div>
    </section>`;
      }
    }

    // 7. ADVANCED FAMILY
    if (compId.startsWith("advanced-")) {
      return `    <section class="advanced-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <span class="badge">Spatial & Cinematic</span>
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
        <div class="canvas-interactive-container" data-interactive-experience="${this.escape(compId)}">
          <canvas id="canvas-${section.id}" aria-label="${this.escape(headline)} Interactive Canvas"></canvas>
        </div>
      </div>
    </section>`;
    }

    // Generic fallback for any other component
    return `    <section class="generic-section" id="${section.id}">
      <div class="container">
        <div class="section-header">
          <h2>${this.escape(headline)}</h2>
          <p>${this.escape(subheadline)}</p>
        </div>
      </div>
    </section>`;
  }
}
