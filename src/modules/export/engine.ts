import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { resolveDesignState, generateCssVariables } from "../design/resolver";
import { getCategoryPack } from "../categories/registry";
import { createDefaultThreeDSceneConfig } from "../three-d/scene/defaults";
import { createDefaultThreeDAnimationConfig } from "../three-d/animation/defaults";
import { Production3DManifest } from "../three-d/runtime/types";
import { ExportOptions, ExportResult, ExportedAssetRef } from "./types";

export class WebsiteExportEngine {
  /**
   * Exports an independent client website package to the specified target directory.
   */
  static async exportProject(options: ExportOptions): Promise<ExportResult> {
    const { projectId, outputDirectory } = options;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        designConfig: true,
        assets: true,
      },
    });

    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found.`);
    }

    const warnings: string[] = [];
    const exportedAssets: ExportedAssetRef[] = [];

    // 1. Resolve design state and category pack
    const categoryPack = getCategoryPack(project.category);
    const design = resolveDesignState(project.category, {
      ...project.designConfig,
      experienceLevel: project.experienceLevel,
    });
    const themeVars = generateCssVariables(design);

    // 2. Resolve 3D Scene and Animation configs
    let parsedPrefs: Record<string, any> = {};
    if (project.designConfig?.threeDPreferences) {
      try {
        parsedPrefs = JSON.parse(project.designConfig.threeDPreferences);
      } catch {
        parsedPrefs = {};
      }
    }

    const sceneConfig = parsedPrefs.sceneConfig || createDefaultThreeDSceneConfig();
    const primaryId = sceneConfig.objects?.[0]?.id || "obj_primary_showcase";
    const animationConfig = parsedPrefs.animationConfig || createDefaultThreeDAnimationConfig(primaryId);

    // 3. Prepare destination directories
    const exportRoot = path.resolve(outputDirectory);
    const vendorDir = path.join(exportRoot, "vendor");
    const vendorJsmLoaders = path.join(vendorDir, "jsm", "loaders");
    const vendorJsmUtils = path.join(vendorDir, "jsm", "utils");
    const assetsDir = path.join(exportRoot, "assets");
    const assetsModels = path.join(assetsDir, "models");
    const assetsImages = path.join(assetsDir, "images");
    const assetsVideos = path.join(assetsDir, "videos");

    fs.mkdirSync(vendorJsmLoaders, { recursive: true });
    fs.mkdirSync(vendorJsmUtils, { recursive: true });
    fs.mkdirSync(assetsModels, { recursive: true });
    fs.mkdirSync(assetsImages, { recursive: true });
    fs.mkdirSync(assetsVideos, { recursive: true });

    // 4. Copy Vendor Scripts (Zero Internet Dependency)
    const nodeModulesDir = path.resolve(process.cwd(), "node_modules");

    // Copy Three.js core and GLTFLoader
    const threeSrc = path.join(nodeModulesDir, "three", "build", "three.module.js");
    const threeCoreSrc = path.join(nodeModulesDir, "three", "build", "three.core.js");
    const gltfLoaderSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "loaders", "GLTFLoader.js");
    const bufferGeoUtilsSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "utils", "BufferGeometryUtils.js");
    const skeletonUtilsSrc = path.join(nodeModulesDir, "three", "examples", "jsm", "utils", "SkeletonUtils.js");

    fs.copyFileSync(threeSrc, path.join(vendorDir, "three.module.js"));
    if (fs.existsSync(threeCoreSrc)) {
      fs.copyFileSync(threeCoreSrc, path.join(vendorDir, "three.core.js"));
    }
    fs.copyFileSync(gltfLoaderSrc, path.join(vendorJsmLoaders, "GLTFLoader.js"));
    fs.copyFileSync(bufferGeoUtilsSrc, path.join(vendorJsmUtils, "BufferGeometryUtils.js"));
    fs.copyFileSync(skeletonUtilsSrc, path.join(vendorJsmUtils, "SkeletonUtils.js"));

    // Copy GSAP & ScrollTrigger
    const gsapSrc = path.join(nodeModulesDir, "gsap", "dist", "gsap.min.js");
    const scrollTriggerSrc = path.join(nodeModulesDir, "gsap", "dist", "ScrollTrigger.min.js");
    fs.copyFileSync(gsapSrc, path.join(vendorDir, "gsap.min.js"));
    fs.copyFileSync(scrollTriggerSrc, path.join(vendorDir, "ScrollTrigger.min.js"));

    // 5. Copy Project Assets & Build Asset Map
    const assetMap: Record<string, string> = {};
    const publicDir = path.resolve(process.cwd(), "public");

    for (const asset of project.assets) {
      const relSrc = asset.fileUrl.startsWith("/") ? asset.fileUrl.slice(1) : asset.fileUrl;
      const physicalSrc = path.join(publicDir, relSrc);

      let targetSubdir = assetsImages;
      let relSubdir = "./assets/images";
      if (asset.assetType === "MODEL_3D" || asset.fileName.endsWith(".glb") || asset.fileName.endsWith(".gltf")) {
        targetSubdir = assetsModels;
        relSubdir = "./assets/models";
      } else if (asset.assetType === "VIDEO" || asset.fileName.endsWith(".mp4") || asset.fileName.endsWith(".webm")) {
        targetSubdir = assetsVideos;
        relSubdir = "./assets/videos";
      }

      const destPath = path.join(targetSubdir, asset.fileName);
      const relativeUrl = `${relSubdir}/${asset.fileName}`;

      if (fs.existsSync(physicalSrc)) {
        fs.copyFileSync(physicalSrc, destPath);
        const stats = fs.statSync(destPath);
        exportedAssets.push({
          originalUrl: asset.fileUrl,
          localPath: destPath,
          fileName: asset.fileName,
          assetType: asset.assetType,
          fileSize: stats.size,
        });

        assetMap[asset.fileUrl] = relativeUrl;
        assetMap[asset.id] = relativeUrl;
        if (asset.assignedSlot) {
          assetMap[asset.assignedSlot] = relativeUrl;
        }
      } else {
        warnings.push(`Asset file not found on disk: ${physicalSrc}`);
      }
    }

    // 6. Rewrite Scene Config Model URLs to relative portable paths
    const portableSceneConfig = JSON.parse(JSON.stringify(sceneConfig));
    if (Array.isArray(portableSceneConfig.objects)) {
      for (const obj of portableSceneConfig.objects) {
        if (obj.assetUrl && assetMap[obj.assetUrl]) {
          obj.assetUrl = assetMap[obj.assetUrl];
        } else if (obj.assetUrl && obj.assetUrl.startsWith("/uploads/")) {
          // Find matching file in exported models
          const baseName = path.basename(obj.assetUrl);
          obj.assetUrl = `./assets/models/${baseName}`;
        }
      }
    }

    // 7. Write site-manifest.json
    const manifest: Production3DManifest = {
      version: "1.0",
      projectId: project.id,
      projectName: project.name,
      sceneConfig: portableSceneConfig,
      animationConfig,
      assetMap,
      fallbackMode: "procedural",
      metadata: {
        exportedAt: new Date().toISOString(),
        engineVersion: "0.1.0-phase3.5",
      },
    };

    fs.writeFileSync(
      path.join(exportRoot, "site-manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf-8"
    );

    // 8. Generate standalone style.css
    const cssContent = this.generateStyles(themeVars, design);
    fs.writeFileSync(path.join(exportRoot, "style.css"), cssContent, "utf-8");

    // 9. Generate standalone runtime.js
    const runtimeJsContent = this.generateRuntimeJs(manifest);
    fs.writeFileSync(path.join(exportRoot, "runtime.js"), runtimeJsContent, "utf-8");

    // 10. Generate standalone index.html
    const htmlContent = this.generateHtml(project, design, categoryPack, manifest);
    const indexHtmlPath = path.join(exportRoot, "index.html");
    fs.writeFileSync(indexHtmlPath, htmlContent, "utf-8");

    return {
      success: true,
      projectId: project.id,
      projectName: project.name,
      projectSlug: project.slug,
      exportPath: exportRoot,
      indexHtmlPath,
      assetCount: exportedAssets.length,
      assets: exportedAssets,
      manifest,
      exportedAt: new Date().toISOString(),
      warnings,
    };
  }

  /**
   * Generates standalone CSS stylesheet including design tokens and layout classes.
   */
  private static generateStyles(themeVars: Record<string, any>, design: any): string {
    const cssVarLines = Object.entries(themeVars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n");

    return `/* =========================================================
   Agency Website Engine — Production Client Stylesheet
   Generated for: ${design.experienceLevel} Tier
   ========================================================= */

:root {
${cssVarLines}
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--theme-bg, #090d16);
  color: var(--theme-text, #f8fafc);
  font-family: var(--theme-body-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: var(--theme-base-font-size, 16px);
  line-height: 1.6;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--theme-heading-font, inherit);
  color: #ffffff;
  line-height: 1.2;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
}

/* Container */
.container {
  width: 100%;
  max-width: var(--theme-container, 1280px);
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Header Navbar */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background-color: rgba(9, 13, 22, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1.125rem;
}

.brand-logo {
  height: 2rem;
  width: 2rem;
  border-radius: var(--theme-radius, 8px);
  background-color: var(--theme-primary, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 800;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--theme-muted, #94a3b8);
}

.btn-primary {
  background-color: var(--theme-primary, #6366f1);
  color: #ffffff;
  padding: 0.5rem 1.25rem;
  border-radius: var(--theme-radius, 8px);
  font-size: 0.875rem;
  font-weight: 600;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  opacity: 0.95;
}

/* Hero Section */
.hero-section {
  padding: 5rem 1.5rem 4rem;
  text-align: center;
}

.hero-tagline {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--theme-primary, #6366f1);
  background-color: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  margin-bottom: 1.25rem;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  max-width: 900px;
  margin: 0 auto 1.5rem;
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--theme-muted, #94a3b8);
  max-width: 650px;
  margin: 0 auto 2.5rem;
}

/* 3D Experience Viewport & Scroll Container */
.scene-3d-wrapper {
  position: relative;
  width: 100%;
  background-color: #020617;
}

.scene-3d-sticky-canvas {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.scene-3d-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  z-index: 20;
}

.scene-3d-progress-bar {
  height: 100%;
  width: 0%;
  background-color: var(--theme-primary, #6366f1);
  transition: width 0.05s linear;
}

/* Story Chapters Floating Over 3D Scene */
.story-chapters-track {
  position: relative;
  z-index: 10;
  margin-top: -100vh;
  pointer-events: none;
}

.story-chapter {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 4rem;
}

.story-card {
  max-width: 420px;
  padding: 2rem;
  border-radius: 1rem;
  background-color: rgba(9, 13, 22, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  pointer-events: auto;
}

.story-card-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--theme-primary, #6366f1);
  margin-bottom: 0.5rem;
  display: block;
  font-family: monospace;
}

.story-card-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.story-card-desc {
  font-size: 0.925rem;
  color: var(--theme-muted, #94a3b8);
}

/* Features Grid */
.features-section {
  padding: 6rem 1.5rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  padding: 2rem;
  border-radius: var(--theme-radius, 12px);
  background-color: var(--theme-surface, rgba(15, 23, 42, 0.6));
  border: 1px solid rgba(148, 163, 184, 0.15);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: var(--theme-primary, #6366f1);
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.feature-desc {
  font-size: 0.9rem;
  color: var(--theme-muted, #94a3b8);
}

/* Footer */
.site-footer {
  padding: 4rem 2rem;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  text-align: center;
  font-size: 0.875rem;
  color: var(--theme-muted, #94a3b8);
}

@media (max-width: 768px) {
  .nav-links { display: none; }
  .story-chapter { padding: 1.5rem; align-items: center; text-align: center; }
  .story-card { max-width: 100%; }
}
`;
  }

  /**
   * Generates standalone runtime.js client script containing Three.js scene engine + GSAP ScrollTrigger bridge.
   */
  private static generateRuntimeJs(manifest: Production3DManifest): string {
    const serializedManifest = JSON.stringify(manifest);

    return `/**
 * Agency Website Engine — Standalone 3D Production Runtime
 * Disconnected from Dashboard APIs. Zero external network dependency.
 */
import * as THREE from "./vendor/three.module.js";
import { GLTFLoader } from "./vendor/jsm/loaders/GLTFLoader.js";

const manifest = ${serializedManifest};

// Degree to Radian conversion
const DEG2RAD = Math.PI / 180;

// Easing calculator
function evaluateEasing(t, ease) {
  const c = Math.max(0, Math.min(1, t));
  switch (ease) {
    case "power1.in": return c * c;
    case "power1.out": return c * (2 - c);
    case "power1.inOut": return c < 0.5 ? 2 * c * c : -1 + (4 - 2 * c) * c;
    case "power2.in": return c * c * c;
    case "power2.out": { const u = c - 1; return u * u * u + 1; }
    case "power2.inOut": return c < 0.5 ? 4 * c * c * c : (c - 1) * (2 * c - 2) * (2 * c - 2) + 1;
    case "power3.out": return 1 - Math.pow(1 - c, 4);
    case "sine.inOut": return -(Math.cos(Math.PI * c) - 1) / 2;
    case "expo.out": return c === 1 ? 1 : 1 - Math.pow(2, -10 * c);
    case "linear":
    default: return c;
  }
}

class Standalone3DRuntime {
  constructor(canvasContainerId, progressBarId) {
    this.container = document.getElementById(canvasContainerId);
    this.progressBar = document.getElementById(progressBarId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lightsMap = new Map();
    this.objectsMap = new Map();
    this.activeTimeline = manifest.animationConfig.timelines[0] || null;
    this.scratchColorA = new THREE.Color();
    this.scratchColorB = new THREE.Color();
    this.scratchResult = new THREE.Color();
  }

  async init() {
    if (!this.container) return;

    // 1. Check WebGL support
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    if (!gl) {
      this.container.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:0.875rem;">WebGL is not supported or hardware acceleration is disabled.</div>';
      return;
    }

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 2. Setup Three.js Scene, Camera, and Renderer
    this.scene = new THREE.Scene();
    const env = manifest.sceneConfig.environment;
    if (env.backgroundMode === "color" && env.backgroundColor) {
      this.scene.background = new THREE.Color(env.backgroundColor);
    }

    if (env.fog && env.fog.enabled) {
      this.scene.fog = new THREE.Fog(new THREE.Color(env.fog.color), env.fog.near, env.fog.far);
    }

    const cam = manifest.sceneConfig.camera;
    this.camera = new THREE.PerspectiveCamera(cam.fov || 45, width / height, cam.near || 0.1, cam.far || 1000);
    this.camera.position.set(...cam.position);
    this.camera.lookAt(...cam.target);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: env.backgroundMode === "transparent" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = manifest.sceneConfig.renderQuality.shadowQuality !== "off";
    this.container.appendChild(this.renderer.domElement);

    // 3. Setup Lighting Rig
    this.setupLighting(manifest.sceneConfig.lighting);

    // 4. Load Models & Objects
    await this.setupObjects(manifest.sceneConfig.objects);

    // 5. Connect GSAP ScrollTrigger
    this.setupScrollTrigger();

    // 6. Resize listener
    window.addEventListener("resize", () => {
      if (!this.renderer || !this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });

    // 7. Start RAF Render Loop (Single Loop Guaranteed)
    const animate = () => {
      requestAnimationFrame(animate);
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    animate();
  }

  setupLighting(config) {
    if (!config) return;
    if (config.ambient && config.ambient.intensity > 0) {
      const amb = new THREE.AmbientLight(new THREE.Color(config.ambient.color), config.ambient.intensity);
      this.scene.add(amb);
      this.lightsMap.set("ambient", amb);
    }
    if (config.mainDirectional && config.mainDirectional.enabled) {
      const dir = new THREE.DirectionalLight(new THREE.Color(config.mainDirectional.color), config.mainDirectional.intensity);
      dir.position.set(...config.mainDirectional.position);
      dir.castShadow = Boolean(config.mainDirectional.castShadow);
      this.scene.add(dir);
      this.lightsMap.set("mainDirectional", dir);
    }
    if (config.fillLight && config.fillLight.enabled) {
      const fill = new THREE.DirectionalLight(new THREE.Color(config.fillLight.color), config.fillLight.intensity);
      fill.position.set(...config.fillLight.position);
      this.scene.add(fill);
      this.lightsMap.set("fillLight", fill);
    }
  }

  async setupObjects(objects) {
    if (!Array.isArray(objects)) return;
    const loader = new GLTFLoader();

    for (const obj of objects) {
      if (obj.sourceType === "asset" && obj.assetUrl) {
        try {
          const gltf = await new Promise((resolve, reject) => {
            loader.load(obj.assetUrl, resolve, undefined, reject);
          });
          const root = gltf.scene || gltf.scenes[0];
          this.applyObjectTransform(root, obj);
          this.scene.add(root);
          this.objectsMap.set(obj.id, root);
        } catch (err) {
          console.warn("[Standalone3DRuntime] Failed to load model:", obj.assetUrl, err);
          // Substitute clean procedural mesh so page never breaks
          this.createProceduralMesh(obj);
        }
      } else {
        this.createProceduralMesh(obj);
      }
    }
  }

  createProceduralMesh(obj) {
    const geom = new THREE.TorusKnotGeometry(0.8, 0.25, 100, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: obj.materialOverride?.color || 0x6366f1,
      roughness: obj.materialOverride?.roughness ?? 0.2,
      metalness: obj.materialOverride?.metalness ?? 0.8,
      wireframe: Boolean(obj.materialOverride?.wireframe),
    });
    const mesh = new THREE.Mesh(geom, mat);
    this.applyObjectTransform(mesh, obj);
    this.scene.add(mesh);
    this.objectsMap.set(obj.id, mesh);
  }

  applyObjectTransform(obj3d, config) {
    if (config.position) obj3d.position.set(...config.position);
    if (config.rotation) obj3d.rotation.set(config.rotation[0] * DEG2RAD, config.rotation[1] * DEG2RAD, config.rotation[2] * DEG2RAD);
    if (config.scale) obj3d.scale.set(...config.scale);
    if (typeof config.visible === "boolean") obj3d.visible = config.visible;
  }

  evaluateTimeline(progress) {
    if (!this.activeTimeline) return;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    if (this.progressBar) {
      this.progressBar.style.width = (clampedProgress * 100) + "%";
    }

    for (const track of this.activeTimeline.tracks) {
      if (!track.enabled || track.keyframes.length === 0) continue;
      this.evaluateTrack(track, clampedProgress);
    }
  }

  evaluateTrack(track, progress) {
    const kfs = track.keyframes;
    let val;
    if (kfs.length === 1 || progress <= kfs[0].time) {
      val = kfs[0].value;
    } else if (progress >= kfs[kfs.length - 1].time) {
      val = kfs[kfs.length - 1].value;
    } else {
      let idx = 0;
      for (let i = 0; i < kfs.length - 1; i++) {
        if (progress >= kfs[i].time && progress <= kfs[i + 1].time) {
          idx = i;
          break;
        }
      }
      const k0 = kfs[idx];
      const k1 = kfs[idx + 1];
      const span = k1.time - k0.time;
      const t = span > 0 ? (progress - k0.time) / span : 0;
      const easedT = evaluateEasing(t, k0.ease);
      val = this.interpolate(track.property, k0.value, k1.value, easedT);
    }
    this.applyTrackValue(track, val);
  }

  interpolate(prop, v0, v1, t) {
    if (Array.isArray(v0) && Array.isArray(v1)) {
      return [v0[0] + (v1[0] - v0[0]) * t, v0[1] + (v1[1] - v0[1]) * t, v0[2] + (v1[2] - v0[2]) * t];
    }
    if (prop === "light_color" || prop === "material_color") {
      try {
        this.scratchColorA.set(v0);
        this.scratchColorB.set(v1);
        this.scratchResult.copy(this.scratchColorA).lerp(this.scratchColorB, t);
        return "#" + this.scratchResult.getHexString();
      } catch { return v0; }
    }
    if (typeof v0 === "number" && typeof v1 === "number") {
      return v0 + (v1 - v0) * t;
    }
    return t >= 0.5 ? v1 : v0;
  }

  applyTrackValue(track, val) {
    if (track.targetType === "object") {
      const obj = this.objectsMap.get(track.targetId);
      if (!obj) return;
      if (track.property === "position" && Array.isArray(val)) obj.position.set(...val);
      else if (track.property === "rotation" && Array.isArray(val)) obj.rotation.set(val[0] * DEG2RAD, val[1] * DEG2RAD, val[2] * DEG2RAD);
      else if (track.property === "scale" && Array.isArray(val)) obj.scale.set(...val);
      else if (track.property === "visible") obj.visible = Boolean(val);
    } else if (track.targetType === "camera" && this.camera) {
      if (track.property === "camera_position" && Array.isArray(val)) this.camera.position.set(...val);
      else if (track.property === "camera_target" && Array.isArray(val)) this.camera.lookAt(...val);
      else if (track.property === "camera_fov" && typeof val === "number") {
        this.camera.fov = val;
        this.camera.updateProjectionMatrix();
      }
    } else if (track.targetType === "light") {
      const light = this.lightsMap.get(track.targetId);
      if (!light) return;
      if (track.property === "light_intensity" && typeof val === "number") light.intensity = val;
      else if (track.property === "light_color" && typeof val === "string") light.color.set(val);
    }
  }

  setupScrollTrigger() {
    if (!window.gsap || !window.ScrollTrigger) {
      this.evaluateTimeline(0);
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    const scrollWrapper = document.getElementById("scene-3d-scroll-wrapper");
    const stConfig = this.activeTimeline?.scrollTrigger || { start: "top top", end: "+=2000", scrub: 1, pin: true };

    const virtual = { p: 0 };
    window.gsap.to(virtual, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: scrollWrapper || this.container,
        start: stConfig.start || "top top",
        end: stConfig.end || "+=2500",
        scrub: typeof stConfig.scrub === "number" ? stConfig.scrub : 1,
        pin: Boolean(stConfig.pin),
        onUpdate: (self) => {
          this.evaluateTimeline(self.progress);
        },
      },
    });

    this.evaluateTimeline(0);
  }
}

// Bootstrap on DOM load or immediately if already ready
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    const runtime = new Standalone3DRuntime("scene-3d-canvas-host", "scene-3d-progress-bar");
    runtime.init();
  });
} else {
  const runtime = new Standalone3DRuntime("scene-3d-canvas-host", "scene-3d-progress-bar");
  runtime.init();
}
`;
  }

  /**
   * Generates standalone HTML5 document.
   */
  private static generateHtml(
    project: any,
    design: any,
    categoryPack: any,
    manifest: Production3DManifest
  ): string {
    const keyFeatures = categoryPack.keyFeatures.slice(0, 3);
    const pages = categoryPack.recommendedPages.slice(0, 4);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} | ${categoryPack.title}</title>
  <link rel="stylesheet" href="./style.css">

  <!-- Local Standalone Vendor Dependencies (Zero External CDN Dependency) -->
  <script src="./vendor/gsap.min.js"></script>
  <script src="./vendor/ScrollTrigger.min.js"></script>

  <!-- Native Browser Import Map -->
  <script type="importmap">
  {
    "imports": {
      "three": "./vendor/three.module.js",
      "three/addons/": "./vendor/jsm/"
    }
  }
  </script>
</head>
<body>
  <!-- Header -->
  <header class="site-header">
    <div class="brand-badge">
      <div class="brand-logo">${project.name.charAt(0)}</div>
      <span>${project.name}</span>
    </div>
    <nav class="nav-links">
      ${pages.map((p: any) => `<a href="#${p.id}">${p.name}</a>`).join("\n      ")}
    </nav>
    <button class="btn-primary">Book Consultation</button>
  </header>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <span class="hero-tagline">${categoryPack.title} Experience</span>
      <h1 class="hero-title">${project.name}</h1>
      <p class="hero-description">${project.description || `Excellence, precision, and verified luxury crafted for discerning clientele.`}</p>
    </div>
  </section>

  <!-- Pinned 3D Interactive Storytelling Viewport -->
  <section id="scene-3d-scroll-wrapper" class="scene-3d-wrapper" data-3d-scroll-canvas>
    <!-- Pinned Canvas Host -->
    <div id="scene-3d-canvas-host" class="scene-3d-sticky-canvas">
      <div class="scene-3d-progress">
        <div id="scene-3d-progress-bar" class="scene-3d-progress-bar"></div>
      </div>
    </div>

    <!-- Scroll Chapters Overlay -->
    <div class="story-chapters-track">
      <div class="story-chapter" style="align-items: flex-start;">
        <div class="story-card">
          <span class="story-card-badge">Chapter 01 // Vision</span>
          <h3 class="story-card-title">${keyFeatures[0] || "Signature Craftsmanship"}</h3>
          <p class="story-card-desc">Engineered to deliver exceptional visual clarity, flawless surfaces, and high-performance tactile luxury.</p>
        </div>
      </div>

      <div class="story-chapter" style="align-items: flex-end;">
        <div class="story-card">
          <span class="story-card-badge">Chapter 02 // Precision</span>
          <h3 class="story-card-title">${keyFeatures[1] || "Bespoke Architecture"}</h3>
          <p class="story-card-desc">Every line and angle is mathematically aligned to produce maximum emotional resonance and functional superiority.</p>
        </div>
      </div>

      <div class="story-chapter" style="align-items: center; text-align: center;">
        <div class="story-card">
          <span class="story-card-badge">Chapter 03 // Immersion</span>
          <h3 class="story-card-title">${keyFeatures[2] || "Unrivaled Impact"}</h3>
          <p class="story-card-desc">Experience real interactive 3D inspection directly in modern mobile and desktop browsers.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features-section">
    <div class="container">
      <div style="text-align: center; max-width: 650px; margin: 0 auto;">
        <span class="hero-tagline">Capabilities & Standards</span>
        <h2 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 1rem;">Architectural Excellence</h2>
        <p style="color: var(--theme-muted); font-size: 1rem;">Designed exclusively for high-tier production deployment.</p>
      </div>

      <div class="features-grid">
        ${(categoryPack.keyFeatures || []).slice(0, 3).map((f: string) => `
        <div class="feature-card">
          <h3 class="feature-title">${f}</h3>
          <p class="feature-desc">Engineered specifically for ${categoryPack.title} standards and client expectations.</p>
        </div>`).join("")}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${project.name}. All rights reserved.</p>
      <p style="margin-top: 0.5rem; font-size: 0.75rem; opacity: 0.7;">Powered by Agency Website Engine • Immersive 3D Runtime</p>
    </div>
  </footer>

  <!-- Standalone Runtime Initialization -->
  <script type="module" src="./runtime.js"></script>
</body>
</html>
`;
  }
}
