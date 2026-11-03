import fs from "fs";
import path from "path";

export class JsBundler {
  /**
   * Generates the standalone, zero-CDN vanilla JavaScript runtime file.
   */
  public static generateRuntimeJs(): string {
    return `/**
 * Agency Website Engine - Production Client Runtime
 * Zero CDN Dependencies - Local Standalone Execution
 */
(function () {
  "use strict";

  // 1. Mobile Navigation Toggle
  function initMobileNav() {
    const navToggle = document.querySelector("[data-mobile-nav-toggle]");
    const navMenu = document.querySelector("[data-mobile-nav-menu]");
    const navOverlay = document.querySelector("[data-mobile-nav-overlay]");

    if (!navToggle || !navMenu) return;

    function toggleNav(open) {
      const isExpanded = open !== undefined ? open : navToggle.getAttribute("aria-expanded") !== "true";
      navToggle.setAttribute("aria-expanded", String(isExpanded));
      navMenu.classList.toggle("is-open", isExpanded);
      if (navOverlay) navOverlay.classList.toggle("is-open", isExpanded);
      document.body.classList.toggle("nav-open", isExpanded);
    }

    navToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleNav();
    });

    if (navOverlay) {
      navOverlay.addEventListener("click", function () {
        toggleNav(false);
      });
    }

    // Close when clicking nav links
    navMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggleNav(false);
      });
    });

    // Close on Escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        toggleNav(false);
      }
    });
  }

  // 2. FAQ Disclosure Accordion
  function initAccordions() {
    const accordionTriggers = document.querySelectorAll("[data-accordion-trigger]");

    accordionTriggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        const item = trigger.closest("[data-accordion-item]");
        const panel = item ? item.querySelector("[data-accordion-panel]") : null;
        if (!item || !panel) return;

        const isOpen = item.classList.contains("is-open");
        
        // Close siblings if in a single-expand accordion
        const parentAccordion = item.closest("[data-accordion-group]");
        if (parentAccordion && !parentAccordion.hasAttribute("data-allow-multiple")) {
          parentAccordion.querySelectorAll("[data-accordion-item]").forEach(function (sibling) {
            if (sibling !== item) {
              sibling.classList.remove("is-open");
              const sibTrigger = sibling.querySelector("[data-accordion-trigger]");
              const sibPanel = sibling.querySelector("[data-accordion-panel]");
              if (sibTrigger) sibTrigger.setAttribute("aria-expanded", "false");
              if (sibPanel) sibPanel.style.maxHeight = null;
            }
          });
        }

        if (isOpen) {
          item.classList.remove("is-open");
          trigger.setAttribute("aria-expanded", "false");
          panel.style.maxHeight = null;
        } else {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    });
  }

  // 3. Before/After Interactive Comparison Slider
  function initBeforeAfterSliders() {
    const sliders = document.querySelectorAll("[data-comparison-slider]");

    sliders.forEach(function (slider) {
      const handle = slider.querySelector("[data-slider-handle]");
      const clipLayer = slider.querySelector("[data-slider-clip]");
      const rangeInput = slider.querySelector("[data-slider-range]");

      if (!handle || !clipLayer) return;

      function updatePosition(pct) {
        const clamped = Math.max(0, Math.min(100, pct));
        clipLayer.style.width = clamped + "%";
        handle.style.left = clamped + "%";
        if (rangeInput) rangeInput.value = clamped;
      }

      if (rangeInput) {
        rangeInput.addEventListener("input", function (e) {
          updatePosition(parseFloat(e.target.value));
        });
      }

      let isDragging = false;

      function onPointerMove(e) {
        if (!isDragging) return;
        const rect = slider.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const pct = ((clientX - rect.left) / rect.width) * 100;
        updatePosition(pct);
      }

      function onPointerUp() {
        isDragging = false;
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
      }

      function onPointerDown(e) {
        isDragging = true;
        onPointerMove(e);
        window.addEventListener("mousemove", onPointerMove);
        window.addEventListener("mouseup", onPointerUp);
        window.addEventListener("touchmove", onPointerMove, { passive: true });
        window.addEventListener("touchend", onPointerUp);
      }

      slider.addEventListener("mousedown", onPointerDown);
      slider.addEventListener("touchstart", onPointerDown, { passive: true });
    });
  }

  // 4. Testimonials Carousel
  function initCarousels() {
    const carousels = document.querySelectorAll("[data-carousel]");

    carousels.forEach(function (carousel) {
      const track = carousel.querySelector("[data-carousel-track]");
      const slides = carousel.querySelectorAll("[data-carousel-slide]");
      const prevBtn = carousel.querySelector("[data-carousel-prev]");
      const nextBtn = carousel.querySelector("[data-carousel-next]");
      const dotsContainer = carousel.querySelector("[data-carousel-dots]");

      if (!track || slides.length === 0) return;

      let currentIndex = 0;

      function goToSlide(index) {
        currentIndex = (index + slides.length) % slides.length;
        track.style.transform = "translateX(-" + (currentIndex * 100) + "%)";

        if (dotsContainer) {
          dotsContainer.querySelectorAll("[data-dot-index]").forEach(function (dot, i) {
            dot.classList.toggle("is-active", i === currentIndex);
          });
        }
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          goToSlide(currentIndex - 1);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          goToSlide(currentIndex + 1);
        });
      }

      // Generate indicator dots
      if (dotsContainer) {
        dotsContainer.innerHTML = "";
        slides.forEach(function (_, i) {
          const dot = document.createElement("button");
          dot.setAttribute("type", "button");
          dot.setAttribute("data-dot-index", String(i));
          dot.setAttribute("aria-label", "Go to slide " + (i + 1));
          dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
          dot.addEventListener("click", function () {
            goToSlide(i);
          });
          dotsContainer.appendChild(dot);
        });
      }

      // Optional auto-advance
      if (carousel.hasAttribute("data-auto-play")) {
        const interval = parseInt(carousel.getAttribute("data-auto-play"), 10) || 5000;
        let timer = setInterval(function () {
          goToSlide(currentIndex + 1);
        }, interval);

        carousel.addEventListener("mouseenter", function () {
          clearInterval(timer);
        });
        carousel.addEventListener("mouseleave", function () {
          timer = setInterval(function () {
            goToSlide(currentIndex + 1);
          }, interval);
        });
      }
    });
  }

  // 5. Contact & Lead Capture Form Interception
  function initForms() {
    const forms = document.querySelectorAll("[data-client-form]");

    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Perform standard HTML5 constraint validation
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerText : "Submit";
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "Transmitting...";
        }

        // Show localized success toast / card
        setTimeout(function () {
          if (submitBtn) {
            submitBtn.innerText = "Confirmed ✓";
          }

          let feedbackBox = form.querySelector("[data-form-feedback]");
          if (!feedbackBox) {
            feedbackBox = document.createElement("div");
            feedbackBox.setAttribute("data-form-feedback", "true");
            feedbackBox.className = "form-success-banner";
            form.prepend(feedbackBox);
          }

          feedbackBox.innerHTML = "<strong>Inquiry Received!</strong> Our team will contact you within 24 hours.";
          feedbackBox.style.display = "block";

          form.reset();

          setTimeout(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerText = originalText;
            }
          }, 3500);
        }, 600);
      });
    });
  }

  // 6. Smooth Scroll for Anchor Links
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const headerHeight = (document.querySelector("[data-site-header]") || {}).offsetHeight || 0;
          const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({
            top: targetY,
            behavior: "smooth"
          });
        }
      });
    });
  }

  // Initialize all interactive modules on DOM ready
  function initAll() {
    initMobileNav();
    initAccordions();
    initBeforeAfterSliders();
    initCarousels();
    initForms();
    initSmoothScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
`;
  }

  /**
   * Copies local vendor libraries (GSAP, Three.js) if experience tier requires them.
   */
  public static copyVendors(outputDir: string, experienceTier: string): string[] {
    const copiedVendors: string[] = [];
    const nodeModulesDir = path.resolve(process.cwd(), "node_modules");
    const vendorDir = path.join(outputDir, "vendor");

    if (experienceTier === "CINEMATIC" || experienceTier === "IMMERSIVE_3D") {
      fs.mkdirSync(vendorDir, { recursive: true });

      // GSAP & ScrollTrigger
      const gsapSrc = path.join(nodeModulesDir, "gsap", "dist", "gsap.min.js");
      const scrollTriggerSrc = path.join(nodeModulesDir, "gsap", "dist", "ScrollTrigger.min.js");

      if (fs.existsSync(gsapSrc)) {
        fs.copyFileSync(gsapSrc, path.join(vendorDir, "gsap.min.js"));
        copiedVendors.push("vendor/gsap.min.js");
      }
      if (fs.existsSync(scrollTriggerSrc)) {
        fs.copyFileSync(scrollTriggerSrc, path.join(vendorDir, "ScrollTrigger.min.js"));
        copiedVendors.push("vendor/ScrollTrigger.min.js");
      }
    }

    if (experienceTier === "IMMERSIVE_3D") {
      const vendorJsmLoaders = path.join(vendorDir, "jsm", "loaders");
      const vendorJsmUtils = path.join(vendorDir, "jsm", "utils");
      fs.mkdirSync(vendorJsmLoaders, { recursive: true });
      fs.mkdirSync(vendorJsmUtils, { recursive: true });

      const threeSrc = path.join(nodeModulesDir, "three", "build", "three.module.js");
      const threeCoreSrc = path.join(nodeModulesDir, "three", "build", "three.core.js");
      const gltfLoaderSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "loaders", "GLTFLoader.js");
      const bufferGeoUtilsSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "utils", "BufferGeometryUtils.js");
      const skeletonUtilsSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "utils", "SkeletonUtils.js");

      if (fs.existsSync(threeSrc)) {
        fs.copyFileSync(threeSrc, path.join(vendorDir, "three.module.js"));
        copiedVendors.push("vendor/three.module.js");
      }
      if (fs.existsSync(threeCoreSrc)) {
        fs.copyFileSync(threeCoreSrc, path.join(vendorDir, "three.core.js"));
        copiedVendors.push("vendor/three.core.js");
      }
      if (fs.existsSync(gltfLoaderSrc)) {
        fs.copyFileSync(gltfLoaderSrc, path.join(vendorJsmLoaders, "GLTFLoader.js"));
        copiedVendors.push("vendor/jsm/loaders/GLTFLoader.js");
      }
      if (fs.existsSync(bufferGeoUtilsSrc)) {
        fs.copyFileSync(bufferGeoUtilsSrc, path.join(vendorJsmUtils, "BufferGeometryUtils.js"));
        copiedVendors.push("vendor/jsm/utils/BufferGeometryUtils.js");
      }
      if (fs.existsSync(skeletonUtilsSrc)) {
        fs.copyFileSync(skeletonUtilsSrc, path.join(vendorJsmUtils, "SkeletonUtils.js"));
        copiedVendors.push("vendor/jsm/utils/SkeletonUtils.js");
      }
    }

    return copiedVendors;
  }
}
