import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CameraConfig,
  CameraPreset,
  EnvironmentConfig,
  LightingConfig,
  RenderQualityConfig,
  SceneObjectConfig,
  ThreeDSceneConfig,
} from "./types";
import { CAMERA_PRESETS, createDefaultThreeDSceneConfig } from "./defaults";
import { ThreeDLightingEngine } from "../lighting/engine";
import { ThreeDObjectManager } from "./objects";
import { ThreeDAnimationLoop } from "../core/loop";
import { ThreeDRenderer } from "../core/renderer";
import { ThreeDDisposal } from "../core/disposal";

export interface SceneEngineMetrics {
  fps: number;
  meshCount: number;
  vertexCount: number;
  objectCount: number;
}

export interface EngineInitOptions {
  interactiveControls?: boolean;
  onMetricsUpdate?: (metrics: SceneEngineMetrics) => void;
}

/**
 * Unified modular 3D Scene Engine orchestrating scene graph, camera, lighting, environment, and objects.
 */
export class ThreeDSceneEngine {
  private container: HTMLElement | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private loop: ThreeDAnimationLoop;

  private lightingEngine: ThreeDLightingEngine;
  private objectManager: ThreeDObjectManager;

  private groundMesh: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  private currentConfig: ThreeDSceneConfig;
  private isDisposed = false;

  private onMetricsUpdate?: (metrics: SceneEngineMetrics) => void;

  constructor(initialConfig?: ThreeDSceneConfig) {
    this.currentConfig = initialConfig ? JSON.parse(JSON.stringify(initialConfig)) : createDefaultThreeDSceneConfig();

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.currentConfig.camera.fov,
      1,
      this.currentConfig.camera.near,
      this.currentConfig.camera.far
    );
    this.camera.position.set(...this.currentConfig.camera.position);
    this.camera.lookAt(...this.currentConfig.camera.target);

    this.lightingEngine = new ThreeDLightingEngine();
    this.scene.add(this.lightingEngine.getGroup());

    this.objectManager = new ThreeDObjectManager();
    this.scene.add(this.objectManager.getContainer());

    this.loop = new ThreeDAnimationLoop();
    this.loop.subscribe((delta) => this.onFrame(delta));
  }

  /**
   * Initializes the WebGL canvas inside a DOM container.
   */
  async init(container: HTMLElement, options: EngineInitOptions = {}): Promise<void> {
    this.container = container;
    this.onMetricsUpdate = options.onMetricsUpdate;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Setup WebGL Renderer
    this.renderer = ThreeDRenderer.create({
      antialias: this.currentConfig.renderQuality.antialias,
      alpha: this.currentConfig.environment.backgroundMode === "transparent",
      powerPreference: "high-performance",
    });
    ThreeDRenderer.resize(this.renderer, width, height);

    this.renderer.shadowMap.enabled = this.currentConfig.renderQuality.shadowQuality !== "off";
    if (this.currentConfig.renderQuality.shadowQuality === "high") {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    container.appendChild(this.renderer.domElement);

    // 2. Setup Camera Aspect Ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // 3. Setup OrbitControls if interactive
    if (options.interactiveControls !== false) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      const limits = this.currentConfig.camera.orbitLimits;
      this.controls.enableDamping = limits.enableDamping;
      this.controls.dampingFactor = limits.dampingFactor;
      this.controls.minDistance = limits.minDistance;
      this.controls.maxDistance = limits.maxDistance;
      this.controls.minPolarAngle = limits.minPolarAngle;
      this.controls.maxPolarAngle = limits.maxPolarAngle;
      this.controls.target.set(...this.currentConfig.camera.target);
      this.controls.update();
    }

    // 4. Apply initial Environment, Lighting, and Objects
    await this.applyConfig(this.currentConfig);

    // 5. Start RAF Render Loop
    this.loop.start();
  }

  /**
   * Applies a complete scene configuration update.
   */
  async applyConfig(config: ThreeDSceneConfig): Promise<void> {
    this.currentConfig = JSON.parse(JSON.stringify(config));

    this.applyEnvironment(this.currentConfig.environment);
    this.applyCamera(this.currentConfig.camera);
    this.applyLighting(this.currentConfig.lighting);
    this.applyRenderQuality(this.currentConfig.renderQuality);
    await this.syncObjects(this.currentConfig.objects);
  }

  /**
   * Updates Environment (Background, Fog, Ground Plane, Grid Helper).
   */
  applyEnvironment(env: EnvironmentConfig): void {
    // 1. Background
    if (env.backgroundMode === "transparent") {
      this.scene.background = null;
    } else {
      this.scene.background = new THREE.Color(env.backgroundColor);
    }

    // 2. Fog
    if (env.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        new THREE.Color(env.fog.color),
        env.fog.near,
        env.fog.far
      );
    } else {
      this.scene.fog = null;
    }

    // 3. Ground Plane
    if (env.groundPlane.enabled) {
      if (!this.groundMesh) {
        const geom = new THREE.PlaneGeometry(env.groundPlane.size, env.groundPlane.size);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(env.groundPlane.color),
          roughness: env.groundPlane.roughness,
          metalness: env.groundPlane.metalness,
        });
        this.groundMesh = new THREE.Mesh(geom, mat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.position.y = -0.01;
        this.groundMesh.receiveShadow = env.groundPlane.receiveShadow;
        this.groundMesh.name = "SceneGroundPlane";
        this.scene.add(this.groundMesh);
      } else {
        const mat = this.groundMesh.material as THREE.MeshStandardMaterial;
        mat.color.set(env.groundPlane.color);
        mat.roughness = env.groundPlane.roughness;
        mat.metalness = env.groundPlane.metalness;
        this.groundMesh.receiveShadow = env.groundPlane.receiveShadow;
        this.groundMesh.visible = true;
      }
    } else if (this.groundMesh) {
      this.groundMesh.visible = false;
    }

    // 4. Grid Helper
    if (env.gridHelper.enabled) {
      if (!this.gridHelper) {
        this.gridHelper = new THREE.GridHelper(
          env.gridHelper.size,
          env.gridHelper.divisions,
          new THREE.Color(env.gridHelper.colorCenter),
          new THREE.Color(env.gridHelper.colorGrid)
        );
        this.gridHelper.name = "EditorGridHelper";
        this.scene.add(this.gridHelper);
      } else {
        this.gridHelper.visible = true;
      }
    } else if (this.gridHelper) {
      this.gridHelper.visible = false;
    }
  }

  /**
   * Updates Camera and OrbitControls limits.
   */
  applyCamera(cam: CameraConfig): void {
    this.camera.fov = cam.fov;
    this.camera.near = cam.near;
    this.camera.far = cam.far;
    this.camera.position.set(...cam.position);
    this.camera.updateProjectionMatrix();

    if (this.controls) {
      this.controls.target.set(...cam.target);
      this.controls.minDistance = cam.orbitLimits.minDistance;
      this.controls.maxDistance = cam.orbitLimits.maxDistance;
      this.controls.minPolarAngle = cam.orbitLimits.minPolarAngle;
      this.controls.maxPolarAngle = cam.orbitLimits.maxPolarAngle;
      this.controls.update();
    } else {
      this.camera.lookAt(...cam.target);
    }
  }

  /**
   * Switches to a standard camera viewpoint preset (front, hero, top, isometric).
   */
  setCameraPreset(preset: CameraPreset): void {
    const p = CAMERA_PRESETS[preset] || CAMERA_PRESETS.hero_angle;
    this.currentConfig.camera.preset = preset;
    this.currentConfig.camera.position = [...p.position];
    this.currentConfig.camera.target = [...p.target];
    this.currentConfig.camera.fov = p.fov;
    this.applyCamera(this.currentConfig.camera);
  }

  /**
   * Updates lighting rig.
   */
  applyLighting(lighting: LightingConfig): void {
    this.lightingEngine.applyLighting(lighting);
  }

  /**
   * Updates render quality & tone mapping.
   */
  applyRenderQuality(quality: RenderQualityConfig): void {
    if (!this.renderer) return;

    this.renderer.shadowMap.enabled = quality.shadowQuality !== "off";
    if (quality.shadowQuality === "high") {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } else {
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
    }

    if (quality.toneMapping === "aces_filmic") {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    } else if (quality.toneMapping === "cineon") {
      this.renderer.toneMapping = THREE.CineonToneMapping;
    } else if (quality.toneMapping === "reinhard") {
      this.renderer.toneMapping = THREE.ReinhardToneMapping;
    } else {
      this.renderer.toneMapping = THREE.LinearToneMapping;
    }
    this.renderer.toneMappingExposure = quality.toneMappingExposure;
  }

  /**
   * Synchronizes managed objects with the configuration list.
   */
  async syncObjects(objects: SceneObjectConfig[]): Promise<void> {
    const incomingIds = new Set(objects.map((o) => o.id));

    // 1. Remove obsolete objects
    for (const managed of this.objectManager.getAllManagedObjects()) {
      if (!incomingIds.has(managed.config.id)) {
        this.objectManager.removeObject(managed.config.id);
      }
    }

    // 2. Load or update incoming objects
    for (const objConfig of objects) {
      await this.objectManager.loadObject(objConfig);
    }
  }

  /**
   * Adds a new object to the scene.
   */
  async addObject(config: SceneObjectConfig): Promise<void> {
    await this.objectManager.loadObject(config);
    this.currentConfig.objects.push(config);
  }

  /**
   * Duplicates an existing object in the scene.
   */
  async duplicateObject(id: string): Promise<SceneObjectConfig | null> {
    const duplicatedConfig = await this.objectManager.duplicateObject(id);
    if (duplicatedConfig) {
      this.currentConfig.objects.push(duplicatedConfig);
    }
    return duplicatedConfig;
  }

  /**
   * Removes an object by ID.
   */
  removeObject(id: string): boolean {
    const success = this.objectManager.removeObject(id);
    if (success) {
      this.currentConfig.objects = this.currentConfig.objects.filter((o) => o.id !== id);
    }
    return success;
  }

  /**
   * Updates an object's transform in real-time.
   */
  updateObjectTransform(
    id: string,
    transform: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
      visible?: boolean;
      castShadow?: boolean;
      receiveShadow?: boolean;
    }
  ): boolean {
    const success = this.objectManager.updateTransform(id, transform);
    if (success) {
      const obj = this.currentConfig.objects.find((o) => o.id === id);
      if (obj) {
        if (transform.position) obj.position = [...transform.position];
        if (transform.rotation) obj.rotation = [...transform.rotation];
        if (transform.scale) obj.scale = [...transform.scale];
        if (typeof transform.visible === "boolean") obj.visible = transform.visible;
        if (typeof transform.castShadow === "boolean") obj.castShadow = transform.castShadow;
        if (typeof transform.receiveShadow === "boolean") obj.receiveShadow = transform.receiveShadow;
      }
    }
    return success;
  }

  /**
   * Applies a material override to a specific object.
   */
  applyMaterialOverride(id: string, override: SceneObjectConfig["materialOverride"]): boolean {
    const success = this.objectManager.applyMaterialOverride(id, override);
    if (success) {
      const obj = this.currentConfig.objects.find((o) => o.id === id);
      if (obj) {
        obj.materialOverride = override ? { ...override } : undefined;
      }
    }
    return success;
  }

  /**
   * Resets material override for an object.
   */
  resetMaterialOverride(id: string): boolean {
    const success = this.objectManager.resetMaterialOverride(id);
    if (success) {
      const obj = this.currentConfig.objects.find((o) => o.id === id);
      if (obj && obj.materialOverride) {
        obj.materialOverride.enabled = false;
      }
    }
    return success;
  }

  /**
   * Updates canvas size on container resize.
   */
  resize(width: number, height: number): void {
    if (!this.renderer || width <= 0 || height <= 0) return;
    ThreeDRenderer.resize(this.renderer, width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Per-frame callback: updates controls, renders scene, and tallies performance metrics.
   */
  private onFrame(_delta: number): void {
    if (this.isDisposed || !this.renderer) return;

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);

    if (this.onMetricsUpdate) {
      let meshCount = 0;
      let vertexCount = 0;

      this.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          meshCount++;
          const geom = (child as THREE.Mesh).geometry;
          if (geom && geom.getAttribute("position")) {
            vertexCount += geom.getAttribute("position").count;
          }
        }
      });

      this.onMetricsUpdate({
        fps: this.loop.getFps(),
        meshCount,
        vertexCount,
        objectCount: this.objectManager.getAllManagedObjects().length,
      });
    }
  }

  /**
   * Gets the current live configuration.
   */
  getConfig(): ThreeDSceneConfig {
    return JSON.parse(JSON.stringify(this.currentConfig));
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  getObjectManager(): ThreeDObjectManager {
    return this.objectManager;
  }

  /**
   * Complete recursive teardown and disposal of all resources.
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    this.loop.stop();

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    this.lightingEngine.dispose();
    this.objectManager.dispose();

    if (this.groundMesh) {
      ThreeDDisposal.disposeObject(this.groundMesh);
      this.groundMesh = null;
    }

    if (this.gridHelper) {
      this.gridHelper.dispose();
      this.gridHelper = null;
    }

    if (this.renderer) {
      if (this.container && this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
