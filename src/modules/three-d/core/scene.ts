import * as THREE from "three";
import { ThreeDSceneConfig } from "../types";

export class ThreeDScene {
  /**
   * Creates a configured Scene graph with optional background and atmospheric fog.
   */
  static create(config: ThreeDSceneConfig = {}): THREE.Scene {
    const scene = new THREE.Scene();

    if (config.backgroundColor && !config.transparent) {
      scene.background = new THREE.Color(config.backgroundColor);
    } else {
      scene.background = null; // Transparent canvas
    }

    if (config.fogColor) {
      const near = config.fogNear ?? 10;
      const far = config.fogFar ?? 50;
      scene.fog = new THREE.Fog(new THREE.Color(config.fogColor), near, far);
    }

    return scene;
  }

  /**
   * Sets background color dynamically or switches to transparent mode.
   */
  static setBackground(scene: THREE.Scene, colorHex: string | null): void {
    if (colorHex) {
      scene.background = new THREE.Color(colorHex);
    } else {
      scene.background = null;
    }
  }
}

