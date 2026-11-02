import * as THREE from "three";
import { SceneObjectConfig } from "./types";
import { Procedural3DArchetypes } from "../assets/procedural";
import { ThreeDModelLoader } from "../assets/loader";
import { ThreeDMaterialEngine } from "../materials/engine";
import { ThreeDDisposal } from "../core/disposal";

export interface ManagedSceneObject {
  config: SceneObjectConfig;
  root: THREE.Object3D;
  disposeCallback?: () => void;
}

/**
 * Manages multi-object scene graphs, transforms, visibility, shadows, and lifecycle.
 */
export class ThreeDObjectManager {
  private container = new THREE.Group();
  private managedObjects = new Map<string, ManagedSceneObject>();

  constructor() {
    this.container.name = "SceneObjectsContainer";
  }

  getContainer(): THREE.Group {
    return this.container;
  }

  getManagedObject(id: string): ManagedSceneObject | undefined {
    return this.managedObjects.get(id);
  }

  getAllManagedObjects(): ManagedSceneObject[] {
    return Array.from(this.managedObjects.values());
  }

  /**
   * Loads and instantiates an object based on its SceneObjectConfig.
   */
  async loadObject(config: SceneObjectConfig): Promise<ManagedSceneObject> {
    // If object already exists, update its config/transform
    const existing = this.managedObjects.get(config.id);
    if (existing) {
      this.applyTransformAndProperties(existing.root, config);
      existing.config = { ...config };
      return existing;
    }

    let root: THREE.Object3D;
    let disposeCallback: (() => void) | undefined;

    if (config.sourceType === "asset" && config.assetUrl) {
      // Load real GLTF/GLB model
      const loaded = await ThreeDModelLoader.load(config.assetUrl, {
        normalize: true,
        targetSize: 2.0,
      });
      root = loaded.scene;
      disposeCallback = loaded.dispose;
    } else {
      // Procedural archetype
      const pType = config.proceduralType || "product_model";
      root = Procedural3DArchetypes.create(pType);
      disposeCallback = () => ThreeDDisposal.disposeObject(root);
    }

    root.name = `Object_${config.id}_${config.name}`;
    this.applyTransformAndProperties(root, config);

    // Register original materials for non-destructive overrides
    ThreeDMaterialEngine.registerOriginalMaterials(root);

    // Apply material override if enabled
    if (config.materialOverride && config.materialOverride.enabled) {
      ThreeDMaterialEngine.applyOverride(root, config.materialOverride);
    }

    this.container.add(root);

    const managed: ManagedSceneObject = {
      config: { ...config },
      root,
      disposeCallback,
    };
    this.managedObjects.set(config.id, managed);

    return managed;
  }

  /**
   * Applies position, rotation (degrees -> radians), scale, visibility, and shadow flags.
   */
  applyTransformAndProperties(root: THREE.Object3D, config: SceneObjectConfig): void {
    root.position.set(...config.position);

    // Convert degrees to radians for Euler angles
    const degToRad = Math.PI / 180;
    root.rotation.set(
      config.rotation[0] * degToRad,
      config.rotation[1] * degToRad,
      config.rotation[2] * degToRad
    );

    root.scale.set(...config.scale);
    root.visible = config.visible;

    // Apply shadow flags to all child meshes
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = config.castShadow;
        mesh.receiveShadow = config.receiveShadow;
      }
    });

    root.updateMatrixWorld(true);
  }

  /**
   * Updates an existing object's transform in real time.
   */
  updateTransform(
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
    const managed = this.managedObjects.get(id);
    if (!managed) return false;

    if (transform.position) managed.config.position = [...transform.position];
    if (transform.rotation) managed.config.rotation = [...transform.rotation];
    if (transform.scale) managed.config.scale = [...transform.scale];
    if (typeof transform.visible === "boolean") managed.config.visible = transform.visible;
    if (typeof transform.castShadow === "boolean") managed.config.castShadow = transform.castShadow;
    if (typeof transform.receiveShadow === "boolean")
      managed.config.receiveShadow = transform.receiveShadow;

    this.applyTransformAndProperties(managed.root, managed.config);
    return true;
  }

  /**
   * Applies a material override to a specific managed object.
   */
  applyMaterialOverride(id: string, override: SceneObjectConfig["materialOverride"]): boolean {
    const managed = this.managedObjects.get(id);
    if (!managed) return false;

    managed.config.materialOverride = override ? { ...override } : undefined;
    if (override && override.enabled) {
      ThreeDMaterialEngine.applyOverride(managed.root, override);
    } else {
      ThreeDMaterialEngine.resetOverride(managed.root);
    }
    return true;
  }

  /**
   * Resets material override for a specific object.
   */
  resetMaterialOverride(id: string): boolean {
    const managed = this.managedObjects.get(id);
    if (!managed) return false;

    if (managed.config.materialOverride) {
      managed.config.materialOverride.enabled = false;
    }
    ThreeDMaterialEngine.resetOverride(managed.root);
    return true;
  }

  /**
   * Removes an object from the scene and disposes its resources.
   */
  removeObject(id: string): boolean {
    const managed = this.managedObjects.get(id);
    if (!managed) return false;

    // Reset overrides to clean up cloned materials first
    ThreeDMaterialEngine.resetOverride(managed.root);

    this.container.remove(managed.root);
    if (managed.disposeCallback) {
      managed.disposeCallback();
    } else {
      ThreeDDisposal.disposeObject(managed.root);
    }

    this.managedObjects.delete(id);
    return true;
  }

  /**
   * Creates a duplicate of an existing object with a new unique ID and a slight positional offset.
   */
  async duplicateObject(id: string): Promise<SceneObjectConfig | null> {
    const source = this.managedObjects.get(id);
    if (!source) return null;

    const newId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newConfig: SceneObjectConfig = {
      ...JSON.parse(JSON.stringify(source.config)),
      id: newId,
      name: `${source.config.name} (Copy)`,
      position: [
        source.config.position[0] + 0.8,
        source.config.position[1],
        source.config.position[2] + 0.8,
      ],
    };

    await this.loadObject(newConfig);
    return newConfig;
  }

  /**
   * Clears and disposes all managed objects.
   */
  clear(): void {
    for (const [id] of this.managedObjects) {
      this.removeObject(id);
    }
    this.managedObjects.clear();
  }

  dispose(): void {
    this.clear();
  }
}
