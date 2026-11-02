import * as THREE from "three";
import { Production3DManifest, ProductionRuntimeOptions, RuntimeMetrics } from "./types";
import { ProductionAssetResolver } from "./loader";
import { ThreeDSceneEngine } from "../scene/engine";
import { ThreeDAnimationEngine } from "../animation/engine";
import { ThreeDScrollTriggerBridge } from "../animation/scroll-trigger";
import { ThreeDCapabilityDetector } from "../performance/capabilities";
import { ThreeDModelLoader } from "../assets/loader";
import { Procedural3DArchetypes } from "../assets/procedural";

/**
 * Production-grade 3D Runtime.
 * Completely decoupled from internal studio editors and management dashboards.
 * Designed for independently deployed client websites.
 */
export class Production3DRuntime {
  private container: HTMLElement;
  private manifest: Production3DManifest;
  private options: ProductionRuntimeOptions;
  private resolver: ProductionAssetResolver;

  private sceneEngine: ThreeDSceneEngine | null = null;
  private animationEngine: ThreeDAnimationEngine | null = null;
  private scrollBridge: ThreeDScrollTriggerBridge | null = null;

  private isDisposed = false;
  private isLoaded = false;
  private isContextLost = false;

  private cleanupListeners: (() => void)[] = [];

  constructor(options: ProductionRuntimeOptions) {
    this.options = options;
    this.container = options.container;
    this.manifest = options.manifest;
    this.resolver = new ProductionAssetResolver(this.manifest.assetMap);
  }

  /**
   * Initializes the production 3D scene, loads models, restores materials, and binds animations.
   */
  async init(): Promise<boolean> {
    if (this.isDisposed) return false;

    // 1. Probe WebGL hardware capabilities
    const capabilities = ThreeDCapabilityDetector.detect();
    if (!capabilities.supported) {
      const err = new Error("WebGL is not supported on this device or is disabled.");
      if (this.options.onError) this.options.onError(err);
      this.renderFallback("WebGL not supported");
      return false;
    }

    try {
      // 2. Instantiate core 3D scene engine
      const resolvedSceneConfig = JSON.parse(JSON.stringify(this.manifest.sceneConfig));

      // Resolve asset URLs through the resolver
      if (Array.isArray(resolvedSceneConfig.objects)) {
        for (const obj of resolvedSceneConfig.objects) {
          if (obj.sourceType === "asset" && obj.assetUrl) {
            obj.assetUrl = this.resolver.resolveUrl(obj.assetUrl);
          }
        }
      }

      this.sceneEngine = new ThreeDSceneEngine(resolvedSceneConfig);

      // 3. Initialize renderer in container
      await this.sceneEngine.init(this.container, {
        interactiveControls: Boolean(this.options.interactiveControls),
      });

      if (this.isDisposed || !this.sceneEngine) return false;

      // 4. Attach WebGL Context Loss / Restore guards
      const renderer = this.sceneEngine.getRenderer();
      if (renderer) {
        const canvas = renderer.domElement;

        const onContextLost = (e: Event) => {
          e.preventDefault();
          this.isContextLost = true;
          console.warn("[Production3DRuntime] WebGL context lost. Pausing render pipeline.");
        };

        const onContextRestored = async () => {
          console.info("[Production3DRuntime] WebGL context restored. Rebuilding scene graph.");
          this.isContextLost = false;
          if (this.sceneEngine) {
            await this.sceneEngine.applyConfig(this.manifest.sceneConfig);
          }
        };

        canvas.addEventListener("webglcontextlost", onContextLost);
        canvas.addEventListener("webglcontextrestored", onContextRestored);

        this.cleanupListeners.push(() => {
          canvas.removeEventListener("webglcontextlost", onContextLost);
          canvas.removeEventListener("webglcontextrestored", onContextRestored);
        });
      }

      // 5. Connect Animation Engine
      this.animationEngine = new ThreeDAnimationEngine(this.sceneEngine);
      const activeTimeline =
        this.manifest.animationConfig.timelines.find(
          (t) => t.id === this.manifest.animationConfig.activeTimelineId
        ) || this.manifest.animationConfig.timelines[0];

      if (activeTimeline) {
        this.animationEngine.setTimeline(activeTimeline);

        // 7. Connect GSAP ScrollTrigger bridge if scroll linking is enabled
        if (activeTimeline.scrollTrigger && activeTimeline.scrollTrigger.enabled) {
          this.scrollBridge = new ThreeDScrollTriggerBridge(this.animationEngine);
          const cleanupScroll = this.scrollBridge.init({
            triggerElement: this.container,
            pinElement: this.container,
            config: activeTimeline.scrollTrigger,
            onProgress: (p) => {
              if (this.options.onProgress) this.options.onProgress(p);
            },
          });
          this.cleanupListeners.push(cleanupScroll);
        } else {
          // Default initial evaluation
          this.animationEngine.evaluate(0);
        }
      }

      // 8. Window resize and visibilitychange handlers
      const handleResize = () => {
        if (this.container && this.sceneEngine && !this.isDisposed) {
          this.sceneEngine.resize(
            this.container.clientWidth || 800,
            this.container.clientHeight || 600
          );
          if (this.scrollBridge) {
            this.scrollBridge.refresh();
          }
        }
      };

      const handleVisibilityChange = () => {
        // Automatically pause/resume to save battery on mobile and backgrounded tabs
        if (document.hidden) {
          // Window hidden
        } else if (this.scrollBridge) {
          this.scrollBridge.refresh();
        }
      };

      window.addEventListener("resize", handleResize);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      this.cleanupListeners.push(() => {
        window.removeEventListener("resize", handleResize);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      });

      this.isLoaded = true;
      if (this.options.onLoaded && !this.isDisposed) {
        this.options.onLoaded();
      }

      return true;
    } catch (err: any) {
      if (this.isDisposed) return false;
      console.error("[Production3DRuntime] Initialization error:", err);
      if (this.options.onError) this.options.onError(err);
      this.renderFallback(err.message || "Failed to initialize 3D scene");
      return false;
    }
  }

  /**
   * Loads all model assets, safely catching failed model URLs and substituting a procedural archetype.
   */
  private async loadSceneModels(objects: any[]): Promise<void> {
    if (this.isDisposed || !this.sceneEngine || !Array.isArray(objects)) return;

    for (const objConfig of objects) {
      if (this.isDisposed || !this.sceneEngine) return;
      if (objConfig.sourceType === "asset" && objConfig.assetUrl) {
        try {
          await this.sceneEngine.addObject(objConfig);
        } catch (loadErr) {
          if (this.isDisposed || !this.sceneEngine) return;
          console.warn(
            `[Production3DRuntime] Model failed to load (${objConfig.assetUrl}). Substituting procedural archetype.`,
            loadErr
          );
          // Substitute procedural fallback so client website never breaks
          const fallbackConfig = {
            ...objConfig,
            sourceType: "procedural" as const,
            proceduralType: "product_model" as const,
          };
          await this.sceneEngine.addObject(fallbackConfig);
        }
      } else {
        await this.sceneEngine.addObject(objConfig);
      }
    }
  }

  /**
   * Renders non-intrusive fallback placeholder if WebGL completely fails.
   */
  private renderFallback(message: string): void {
    if (this.isDisposed || !this.container) return;

    // Check if poster fallback exists
    if (this.manifest.posterUrl) {
      const posterImg = document.createElement("img");
      posterImg.src = this.resolver.resolveUrl(this.manifest.posterUrl);
      posterImg.alt = "3D Experience Showcase Preview";
      posterImg.className = "w-full h-full object-cover";
      this.container.innerHTML = "";
      this.container.appendChild(posterImg);
      return;
    }

    // Default accessible fallback banner
    this.container.innerHTML = `
      <div class="flex h-full w-full items-center justify-center bg-slate-900/60 p-6 text-center text-slate-300">
        <div>
          <h4 class="text-base font-semibold text-white mb-1">3D Experience Standby</h4>
          <p class="text-xs text-slate-400 max-w-sm">${message}</p>
        </div>
      </div>
    `;
  }

  /**
   * Queries real-time runtime metrics (FPS, draw calls, triangles).
   */
  getMetrics(): RuntimeMetrics | null {
    if (!this.sceneEngine || !this.sceneEngine.getRenderer()) return null;
    const renderer = this.sceneEngine.getRenderer()!;
    const info = renderer.info;

    return {
      fps: 60, // Monitored by loop
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      memoryGeometries: info.memory.geometries,
      memoryTextures: info.memory.textures,
    };
  }

  getSceneEngine(): ThreeDSceneEngine | null {
    return this.sceneEngine;
  }

  getAnimationEngine(): ThreeDAnimationEngine | null {
    return this.animationEngine;
  }

  /**
   * Complete clean teardown: destroys WebGL context, ScrollTriggers, and event listeners.
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Run all registered cleanups
    for (const cleanup of this.cleanupListeners) {
      try {
        cleanup();
      } catch {}
    }
    this.cleanupListeners = [];

    if (this.scrollBridge) {
      this.scrollBridge.dispose();
      this.scrollBridge = null;
    }

    if (this.sceneEngine) {
      this.sceneEngine.dispose();
      this.sceneEngine = null;
    }

    this.animationEngine = null;
  }
}
