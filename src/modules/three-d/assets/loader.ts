import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { ThreeDModelNormalizer, ModelNormalizedStats } from "./normalizer";
import { ThreeDDisposal } from "../core/disposal";

export interface LoadedModelResult {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  stats: ModelNormalizedStats;
  dispose: () => void;
}

export interface ModelLoadOptions {
  normalize?: boolean;
  targetSize?: number;
  dracoPath?: string;
  onProgress?: (percent: number) => void;
}

export class ThreeDModelLoader {
  private static dracoLoader: DRACOLoader | null = null;

  /**
   * Returns a lazily initialized DRACOLoader pointing to local decoders.
   */
  static getDracoLoader(decoderPath: string = "/draco/gltf/"): DRACOLoader {
    if (!this.dracoLoader) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(decoderPath);
      // Preload decoder workers if running in browser
      if (typeof window !== "undefined") {
        this.dracoLoader.preload();
      }
    }
    return this.dracoLoader;
  }

  /**
   * Loads a GLB/GLTF model from a URL or web path with progress and normalization.
   */
  static async load(
    url: string,
    options: ModelLoadOptions = {}
  ): Promise<LoadedModelResult> {
    const loader = new GLTFLoader();

    // Attach DRACOLoader
    try {
      const draco = this.getDracoLoader(options.dracoPath);
      loader.setDRACOLoader(draco);
    } catch {}

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.load(
        url,
        (data) => resolve(data),
        (event) => {
          if (event.total && options.onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            options.onProgress(percent);
          }
        },
        (error: any) =>
          reject(
            new Error(
              `Failed to load 3D model from "${url}": ${
                error instanceof Error ? error.message : String(error)
              }`
            )
          )
      );
    });

    const modelScene = gltf.scene;

    // Normalization
    let stats: ModelNormalizedStats = {
      center: [0, 0, 0],
      size: [1, 1, 1],
      maxDimension: 1,
      scaleFactor: 1,
      vertexCount: 0,
      meshCount: 0,
    };

    if (options.normalize ?? true) {
      stats = ThreeDModelNormalizer.normalize(modelScene, options.targetSize ?? 2.0);
    }

    if (options.onProgress) {
      options.onProgress(100);
    }

    return {
      scene: modelScene,
      animations: gltf.animations || [],
      stats,
      dispose: () => {
        ThreeDDisposal.disposeObject(modelScene);
      },
    };
  }

  /**
   * Parses an ArrayBuffer directly without network requests (useful for tests and uploads).
   */
  static async parse(
    data: ArrayBuffer | string,
    path: string = "",
    options: ModelLoadOptions = {}
  ): Promise<LoadedModelResult> {
    const loader = new GLTFLoader();

    try {
      const draco = this.getDracoLoader(options.dracoPath);
      loader.setDRACOLoader(draco);
    } catch {}

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      loader.parse(
        data,
        path,
        (res) => resolve(res),
        (err: any) =>
          reject(
            new Error(
              `Failed to parse 3D model: ${err instanceof Error ? err.message : String(err)}`
            )
          )
      );
    });

    const modelScene = gltf.scene;

    let stats: ModelNormalizedStats = {
      center: [0, 0, 0],
      size: [1, 1, 1],
      maxDimension: 1,
      scaleFactor: 1,
      vertexCount: 0,
      meshCount: 0,
    };

    if (options.normalize ?? true) {
      stats = ThreeDModelNormalizer.normalize(modelScene, options.targetSize ?? 2.0);
    }

    return {
      scene: modelScene,
      animations: gltf.animations || [],
      stats,
      dispose: () => {
        ThreeDDisposal.disposeObject(modelScene);
      },
    };
  }

  /**
   * Disposes the cached DRACOLoader worker pool.
   */
  static disposeDraco(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
    }
  }
}
