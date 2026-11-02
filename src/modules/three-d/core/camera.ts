import * as THREE from "three";
import { ThreeDCameraConfig } from "../types";

export class ThreeDCamera {
  static readonly DEFAULT_FOV = 45;
  static readonly DEFAULT_NEAR = 0.1;
  static readonly DEFAULT_FAR = 1000;

  /**
   * Creates a PerspectiveCamera positioned and oriented towards a target.
   */
  static create(
    width: number,
    height: number,
    config: ThreeDCameraConfig = {}
  ): THREE.PerspectiveCamera {
    const aspect = width / (height || 1);
    const fov = config.fov ?? this.DEFAULT_FOV;
    const near = config.near ?? this.DEFAULT_NEAR;
    const far = config.far ?? this.DEFAULT_FAR;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    const pos = config.position || [0, 1.5, 4];
    camera.position.set(pos[0], pos[1], pos[2]);

    const target = config.target || [0, 0, 0];
    camera.lookAt(target[0], target[1], target[2]);

    return camera;
  }

  /**
   * Updates camera aspect ratio and projection matrix on viewport resize.
   */
  static updateAspect(camera: THREE.PerspectiveCamera, width: number, height: number): void {
    camera.aspect = width / (height || 1);
    camera.updateProjectionMatrix();
  }
}

