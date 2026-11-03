import { ProjectDesignState } from "../design/types";
import { generateCssVariables } from "../design/resolver";

export class CssCompiler {
  /**
   * Compiles unified production CSS including design tokens, reset, typography,
   * component styling, responsive layout grids, and interactive component styles.
   */
  public static compileStylesheet(design: ProjectDesignState): string {
    const rawVars = generateCssVariables(design) as Record<string, string>;
    const tokenLines = Object.entries(rawVars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");

    return `/**
 * Agency Website Engine - Production Stylesheet
 * Zero CDN Dependencies - Local Standalone CSS
 */

:root {
  /* Raw Theme Variables from Resolver */
${tokenLines}

  /* Semantic Color and Layout Tokens */
  --color-primary: var(--theme-primary, ${design.colors.primary});
  --color-secondary: var(--theme-secondary, ${design.colors.secondary});
  --color-accent: var(--theme-accent, ${design.colors.accent});
  --color-background: var(--theme-bg, ${design.colors.background});
  --color-card: var(--theme-surface, ${design.colors.surface});
  --color-foreground: var(--theme-text, ${design.colors.text});
  --color-muted: var(--theme-muted, ${design.colors.mutedText});
  --font-heading: var(--theme-heading-font, "${design.typography.headingFont}", sans-serif);
  --font-body: var(--theme-body-font, "${design.typography.bodyFont}", sans-serif);
  --border-radius: var(--theme-radius, ${design.layout.borderRadius});
  --container-max-width: var(--theme-container, ${design.layout.containerWidth});
  --section-padding: clamp(3rem, 6vw, 6rem);
  --header-height: 72px;
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* 1. Reset & Global Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: var(--color-foreground, #0f172a);
  background-color: var(--color-background, #ffffff);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

body.nav-open {
  overflow: hidden;
}

img, video, canvas {
  display: block;
  max-width: 100%;
  height: auto;
}

a {
  color: inherit;
  text-decoration: none;
  transition: opacity var(--transition-fast), color var(--transition-fast);
}

button, input, textarea, select {
  font: inherit;
  color: inherit;
}

button {
  cursor: pointer;
  border: none;
  background: none;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading, inherit);
  color: var(--color-foreground, #0f172a);
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Container */
.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin-left: auto;
  margin-right: auto;
  padding-left: clamp(1rem, 4vw, 2rem);
  padding-right: clamp(1rem, 4vw, 2rem);
}

/* Utility Badges & Buttons */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-primary, #2563eb) 12%, transparent);
  color: var(--color-primary, #2563eb);
  border: 1px solid color-mix(in srgb, var(--color-primary, #2563eb) 25%, transparent);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--border-radius, 8px);
  transition: all var(--transition-fast);
  text-align: center;
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary, #2563eb);
  color: #ffffff;
}

.btn-primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-secondary {
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 8%, transparent);
  color: var(--color-foreground, #0f172a);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 15%, transparent);
}

.btn-secondary:hover {
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 15%, transparent);
}

/* 2. Header & Navigation */
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  background: color-mix(in srgb, var(--color-background, #ffffff) 85%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 10%, transparent);
  display: flex;
  align-items: center;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.site-logo {
  font-family: var(--font-heading, inherit);
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--color-foreground, #0f172a);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.site-logo span {
  color: var(--color-primary, #2563eb);
}

.nav-links-desktop {
  display: none;
  align-items: center;
  gap: 2rem;
  list-style: none;
}

.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 75%, transparent);
}

.nav-link:hover, .nav-link.active {
  color: var(--color-primary, #2563eb);
}

.nav-actions-desktop {
  display: none;
  align-items: center;
  gap: 1rem;
}

.nav-mobile-toggle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  padding: 8px;
  border-radius: var(--border-radius, 8px);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 15%, transparent);
}

.nav-mobile-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--color-foreground, #0f172a);
  border-radius: 2px;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.nav-mobile-toggle[aria-expanded="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.nav-mobile-toggle[aria-expanded="true"] span:nth-child(2) {
  opacity: 0;
}

.nav-mobile-toggle[aria-expanded="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile Nav Drawer */
.mobile-nav-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 105;
}

.mobile-nav-overlay.is-open {
  display: block;
}

.mobile-nav-menu {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 85%;
  max-width: 360px;
  background: var(--color-background, #ffffff);
  z-index: 110;
  transform: translateX(100%);
  transition: transform var(--transition-slow);
  padding: 5rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
}

.mobile-nav-menu.is-open {
  transform: translateX(0);
}

.mobile-nav-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.mobile-nav-links a {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-foreground, #0f172a);
}

@media (min-width: 1024px) {
  .nav-links-desktop, .nav-actions-desktop {
    display: flex;
  }
  .nav-mobile-toggle, .mobile-nav-overlay, .mobile-nav-menu {
    display: none !important;
  }
}

/* 3. Section Generic Layouts */
section {
  padding: var(--section-padding) 0;
  position: relative;
  overflow: hidden;
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto clamp(2rem, 4vw, 3.5rem);
}

.section-header h2 {
  font-size: clamp(1.85rem, 3.5vw, 2.75rem);
  margin-top: 0.75rem;
  margin-bottom: 1rem;
}

.section-header p {
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 70%, transparent);
}

/* 4. Component Styles (7 Families) */

/* HERO FAMILY */
.hero-section {
  padding: clamp(4rem, 8vw, 7.5rem) 0;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-content h1 {
  font-size: clamp(2.25rem, 4.5vw, 3.75rem);
  font-weight: 800;
  line-height: 1.15;
}

.hero-content p.subtitle {
  font-size: clamp(1.05rem, 2vw, 1.25rem);
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 75%, transparent);
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
}

.hero-media-wrapper {
  position: relative;
  border-radius: var(--border-radius, 12px);
  overflow: hidden;
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 5%, transparent);
}

.hero-media-wrapper img, .hero-media-wrapper video {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
}

.hero-centered {
  text-align: center;
}

.hero-centered .hero-content {
  max-width: 860px;
  margin: 0 auto;
  align-items: center;
}

.hero-centered .hero-actions {
  justify-content: center;
}

@media (min-width: 1024px) {
  .hero-split .hero-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

/* BUSINESS FAMILY */
.grid-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
}

.card {
  padding: clamp(1.5rem, 3vw, 2.25rem);
  border-radius: var(--border-radius, 12px);
  background: var(--color-card, #ffffff);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 10%, transparent);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px -10px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius, 8px);
  background: color-mix(in srgb, var(--color-primary, #2563eb) 12%, transparent);
  color: var(--color-primary, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-bottom: 1.25rem;
}

.card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.card p {
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 70%, transparent);
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  text-align: center;
}

.stat-item {
  padding: 1.5rem;
  border-radius: var(--border-radius, 8px);
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 3%, transparent);
}

.stat-value {
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  color: var(--color-primary, #2563eb);
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 0.5rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 70%, transparent);
}

@media (min-width: 768px) {
  .grid-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-cards.cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  .grid-cards.cols-4 {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* CONVERSION FAMILY (Forms & CTAs) */
.conversion-box {
  background: color-mix(in srgb, var(--color-primary, #2563eb) 5%, var(--color-card, #ffffff));
  border: 1px solid color-mix(in srgb, var(--color-primary, #2563eb) 20%, transparent);
  border-radius: var(--border-radius, 16px);
  padding: clamp(2rem, 5vw, 3.5rem);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-foreground, #0f172a);
}

.form-input, .form-textarea, .form-select {
  width: 100%;
  padding: 0.85rem 1rem;
  font-size: 0.95rem;
  border-radius: var(--border-radius, 8px);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 20%, transparent);
  background: var(--color-background, #ffffff);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #2563eb) 15%, transparent);
}

.form-textarea {
  min-height: 120px;
  resize: vertical;
}

.form-success-banner {
  display: none;
  padding: 1rem 1.25rem;
  border-radius: var(--border-radius, 8px);
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .form-grid.two-col {
    grid-template-columns: 1fr 1fr;
  }
}

/* SOCIAL PROOF FAMILY */
.reviews-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.review-card {
  padding: 1.75rem;
  border-radius: var(--border-radius, 12px);
  background: var(--color-card, #ffffff);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 10%, transparent);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.25rem;
}

.stars {
  color: #f59e0b;
  font-size: 1.1rem;
  letter-spacing: 2px;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  background: color-mix(in srgb, var(--color-primary, #2563eb) 15%, transparent);
}

.author-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.author-role {
  font-size: 0.8rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 60%, transparent);
}

/* Carousel Container */
.carousel-container {
  position: relative;
  overflow: hidden;
  width: 100%;
}

.carousel-track {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.carousel-slide {
  flex: 0 0 100%;
  width: 100%;
  padding: 0 0.5rem;
}

.carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.carousel-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 8%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.carousel-dots {
  display: flex;
  gap: 0.5rem;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 25%, transparent);
  transition: all var(--transition-fast);
}

.carousel-dot.is-active {
  width: 24px;
  border-radius: 9999px;
  background: var(--color-primary, #2563eb);
}

@media (min-width: 768px) {
  .reviews-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .reviews-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* MEDIA FAMILY (Gallery, Slider) */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.gallery-item {
  border-radius: var(--border-radius, 8px);
  overflow: hidden;
  aspect-ratio: 4 / 3;
  position: relative;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.gallery-item:hover img {
  transform: scale(1.05);
}

/* Interactive Before/After Slider */
.before-after-container {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  aspect-ratio: 16 / 9;
  border-radius: var(--border-radius, 12px);
  overflow: hidden;
  user-select: none;
  box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.2);
}

.before-after-after-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.before-after-clip-layer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 50%;
  overflow: hidden;
  z-index: 2;
}

.before-after-before-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 800px;
  height: 100%;
  max-width: none;
  object-fit: cover;
}

.before-after-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 4px;
  background: #ffffff;
  z-index: 10;
  cursor: ew-resize;
  transform: translateX(-50%);
}

.before-after-handle::after {
  content: "↔";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ffffff;
  color: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

@media (min-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* CONTENT FAMILY (FAQ Accordions, Pricing) */
.accordion-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 820px;
  margin: 0 auto;
}

.accordion-item {
  border-radius: var(--border-radius, 8px);
  background: var(--color-card, #ffffff);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 12%, transparent);
  overflow: hidden;
  transition: border-color var(--transition-fast);
}

.accordion-item.is-open {
  border-color: var(--color-primary, #2563eb);
}

.accordion-trigger {
  width: 100%;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  font-weight: 600;
  font-size: 1.05rem;
}

.accordion-icon {
  font-size: 1.25rem;
  transition: transform var(--transition-fast);
}

.accordion-item.is-open .accordion-icon {
  transform: rotate(45deg);
}

.accordion-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--transition-normal);
}

.accordion-content {
  padding: 0 1.5rem 1.25rem;
  font-size: 0.95rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 75%, transparent);
  line-height: 1.6;
}

/* Pricing Table */
.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.75rem;
}

.pricing-card {
  padding: 2.5rem 2rem;
  border-radius: var(--border-radius, 16px);
  background: var(--color-card, #ffffff);
  border: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 12%, transparent);
  display: flex;
  flex-direction: column;
  position: relative;
}

.pricing-card.is-featured {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 12px 32px -10px color-mix(in srgb, var(--color-primary, #2563eb) 25%, transparent);
}

.pricing-price {
  font-size: 2.75rem;
  font-weight: 800;
  margin: 1rem 0;
  color: var(--color-foreground, #0f172a);
}

.pricing-features {
  list-style: none;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.pricing-features li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .pricing-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ADVANCED FAMILY (Interactive Canvas & 3D Containers) */
.canvas-interactive-container {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--border-radius, 12px);
  overflow: hidden;
  background: #090d16;
  position: relative;
}

.canvas-interactive-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* 5. Footer */
.site-footer {
  margin-top: auto;
  background: color-mix(in srgb, var(--color-foreground, #0f172a) 4%, var(--color-background, #ffffff));
  border-top: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 10%, transparent);
  padding: clamp(3rem, 6vw, 4.5rem) 0 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  margin-bottom: 3rem;
}

.footer-brand p {
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 65%, transparent);
  max-width: 320px;
}

.footer-col h4 {
  font-size: 0.95rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.footer-links a {
  font-size: 0.9rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 70%, transparent);
}

.footer-links a:hover {
  color: var(--color-primary, #2563eb);
}

.footer-bottom {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 2rem;
  border-top: 1px solid color-mix(in srgb, var(--color-foreground, #0f172a) 8%, transparent);
  font-size: 0.85rem;
  color: color-mix(in srgb, var(--color-foreground, #0f172a) 60%, transparent);
}

@media (min-width: 768px) {
  .footer-grid {
    grid-template-columns: 2fr repeat(2, 1fr);
  }
  .footer-bottom {
    flex-direction: row;
  }
}

@media (min-width: 1024px) {
  .footer-grid {
    grid-template-columns: 2fr repeat(3, 1fr);
  }
}
`;
  }
}
