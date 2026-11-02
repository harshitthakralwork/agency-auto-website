import * as THREE from "three";
import { ThreeDDisposalStats } from "../types";

export class ThreeDDisposal {
  /**
   * Recursively traverses an Object3D, disposing of all attached geometries,
   * materials, and material textures, and removing all child links.
   */
  static disposeObject(root: THREE.Object3D): ThreeDDisposalStats {
    const stats: ThreeDDisposalStats = {
      geometriesDisposed: 0,
      materialsDisposed: 0,
      texturesDisposed: 0,
    };

    const disposedGeometries = new Set<THREE.BufferGeometry>();
    const disposedMaterials = new Set<THREE.Material>();
    const disposedTextures = new Set<THREE.Texture>();

    root.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;

        // Dispose geometry
        if (mesh.geometry && !disposedGeometries.has(mesh.geometry)) {
          mesh.geometry.dispose();
          disposedGeometries.add(mesh.geometry);
          stats.geometriesDisposed++;
        }

        // Dispose material(s)
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

          for (const mat of materials) {
            if (!disposedMaterials.has(mat)) {
              // Dispose textures attached to material properties
              this.disposeMaterialTextures(mat, disposedTextures, stats);
              mat.dispose();
              disposedMaterials.add(mat);
              stats.materialsDisposed++;
            }
          }
        }
      }
    });

    // Clear children
    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
    }

    return stats;
  }

  /**
   * Disposes of standard texture maps attached to a Material.
   */
  private static disposeMaterialTextures(
    material: any,
    disposedTextures: Set<THREE.Texture>,
    stats: ThreeDDisposalStats
  ) {
    const textureKeys = [
      "map",
      "alphaMap",
      "aoMap",
      "bumpMap",
      "displacementMap",
      "emissiveMap",
      "envMap",
      "lightMap",
      "metalnessMap",
      "normalMap",
      "roughnessMap",
    ];

    for (const key of textureKeys) {
      const tex = material[key];
      if (tex && tex.isTexture && !disposedTextures.has(tex)) {
        tex.dispose();
        disposedTextures.add(tex);
        stats.texturesDisposed++;
      }
    }
  }

  /**
   * Complete teardown of an entire Three.js Scene and WebGLRenderer.
   */
  static disposeSceneAndRenderer(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ): ThreeDDisposalStats {
    const stats = this.disposeObject(scene);

    try {
      renderer.dispose();
      renderer.forceContextLoss();
      const domElement = renderer.domElement;
      if (domElement && domElement.parentNode) {
        domElement.parentNode.removeChild(domElement);
      }
    } catch {}

    return stats;
  }
}

