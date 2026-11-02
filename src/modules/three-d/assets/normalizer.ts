import * as THREE from "three";

export interface ModelNormalizedStats {
  center: [number, number, number];
  size: [number, number, number];
  maxDimension: number;
  scaleFactor: number;
  vertexCount: number;
  meshCount: number;
}

export class ThreeDModelNormalizer {
  /**
   * Centers and scales a 3D model scene to a standard bounding box,
   * configures shadow properties, and tallies vertex metrics.
   */
  static normalize(
    root: THREE.Object3D,
    targetDimension: number = 2.0
  ): ModelNormalizedStats {
    // 1. Force matrix updates to guarantee accurate bounding box
    root.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();

    box.getCenter(center);
    box.getSize(size);

    const maxDimension = Math.max(size.x, size.y, size.z) || 1.0;
    const scaleFactor = targetDimension / maxDimension;

    // Center the model geometry relative to origin
    root.position.x -= center.x * scaleFactor;
    root.position.y -= center.y * scaleFactor;
    root.position.z -= center.z * scaleFactor;

    root.scale.set(scaleFactor, scaleFactor, scaleFactor);
    root.updateMatrixWorld(true);

    // Recompute normalized bounds and vertex metrics
    let vertexCount = 0;
    let meshCount = 0;

    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        meshCount++;
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.geometry) {
          const posAttr = mesh.geometry.getAttribute("position");
          if (posAttr) {
            vertexCount += posAttr.count;
          }
        }
      }
    });

    return {
      center: [center.x, center.y, center.z],
      size: [size.x, size.y, size.z],
      maxDimension,
      scaleFactor,
      vertexCount,
      meshCount,
    };
  }
}

