"use client";

import { gsap, ScrollTrigger, prefersReducedMotion } from "../gsap/provider";
import { ScrollRevealConfig } from "../types";

export class CinematicScrollTriggers {
  /**
   * Pattern A: Scroll Reveal
   */
  static applyScrollReveal(
    target: gsap.DOMTarget,
    triggerElement: HTMLElement,
    config: ScrollRevealConfig = {}
  ): gsap.core.Tween | null {
    if (prefersReducedMotion()) {
      gsap.set(target, { opacity: 1, x: 0, y: 0 });
      return null;
    }

    const {
      direction = "up",
      distance = 40,
      duration = 0.9,
      stagger = 0.12,
      delay = 0,
    } = config;

    let x = 0;
    let y = 0;

    switch (direction) {
      case "up":
        y = distance;
        break;
      case "down":
        y = -distance;
        break;
      case "left":
        x = distance;
        break;
      case "right":
        x = -distance;
        break;
      case "fade":
      default:
        x = 0;
        y = 0;
        break;
    }

    gsap.set(target, { opacity: 0, x, y });

    return gsap.to(target, {
      opacity: 1,
      x: 0,
      y: 0,
      duration,
      stagger,
      delay,
      ease: "power3.out",
      scrollTrigger: {
        trigger: triggerElement,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /**
   * Pattern B: Pinned Storytelling
   */
  static applyPinnedStory(
    pinContainer: HTMLElement,
    storySteps: HTMLElement[],
    options: { pinDuration?: string | number } = {}
  ): gsap.core.Timeline | null {
    if (prefersReducedMotion() || storySteps.length <= 1) {
      storySteps.forEach((step, i) => {
        gsap.set(step, { opacity: i === 0 ? 1 : 0.4 });
      });
      return null;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pinContainer,
        start: "top top",
        end: options.pinDuration ? `+=${options.pinDuration}` : `+=${storySteps.length * 100}%`,
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
      },
    });

    storySteps.forEach((step, index) => {
      if (index === 0) {
        gsap.set(step, { opacity: 1, y: 0 });
      } else {
        gsap.set(step, { opacity: 0, y: 30 });
        // Fade out previous step and fade in current
        tl.to(storySteps[index - 1], { opacity: 0, y: -20, duration: 0.5 }, `step-${index}`)
          .to(step, { opacity: 1, y: 0, duration: 0.5 }, `step-${index}`);
      }
    });

    return tl;
  }

  /**
   * Pattern C: Parallax
   */
  static applyParallax(
    layerElement: HTMLElement,
    triggerElement: HTMLElement,
    speed: number = 0.3 // positive moves slower, negative moves faster
  ): gsap.core.Tween | null {
    if (prefersReducedMotion()) return null;

    const yMovement = speed * 150;

    return gsap.fromTo(
      layerElement,
      { y: -yMovement / 2 },
      {
        y: yMovement / 2,
        ease: "none",
        scrollTrigger: {
          trigger: triggerElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      }
    );
  }

  /**
   * Pattern D: Text Storytelling (Staggered Words or Lines)
   */
  static applyTextStorytelling(
    wordsOrLines: HTMLElement[],
    triggerElement: HTMLElement
  ): gsap.core.Tween | null {
    if (prefersReducedMotion()) {
      gsap.set(wordsOrLines, { opacity: 1, y: 0 });
      return null;
    }

    gsap.set(wordsOrLines, { opacity: 0, y: 25 });

    return gsap.to(wordsOrLines, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        trigger: triggerElement,
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
    });
  }

  /**
   * Pattern E: Horizontal Scroll Section
   */
  static applyHorizontalScroll(
    container: HTMLElement,
    track: HTMLElement
  ): gsap.core.Tween | null {
    if (prefersReducedMotion()) return null;

    const totalWidth = track.scrollWidth - container.clientWidth;
    if (totalWidth <= 0) return null;

    return gsap.to(track, {
      x: -totalWidth,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: () => `+=${totalWidth}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
  }

  /**
   * Pattern F: Section Transitions
   */
  static applySectionTransition(
    section: HTMLElement
  ): gsap.core.Tween | null {
    if (prefersReducedMotion()) {
      gsap.set(section, { opacity: 1, scale: 1 });
      return null;
    }

    gsap.set(section, { opacity: 0.85, scale: 0.98 });

    return gsap.to(section, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 90%",
        toggleActions: "play none none reverse",
      },
    });
  }
}
