import * as THREE from "three";
import { ThreeDLightingPreset, ThreeDLightingRig } from "../types";

export class ThreeDLightingPresets {
  /**
   * Builds an optimized 3D lighting rig matching the requested atmosphere preset.
   */
  static createRig(preset: ThreeDLightingPreset): ThreeDLightingRig {
    const lightsGroup = new THREE.Group();
    lightsGroup.name = `lighting_rig_${preset}`;

    let ambientColor: string;
    let ambientIntensity: number;
    let keyColor: string;
    let keyIntensity: number;
    let keyPos: [number, number, number];
    let fillColor: string;
    let fillIntensity: number;
    let fillPos: [number, number, number];
    let rimColor: string;
    let rimIntensity: number;
    let rimPos: [number, number, number];

    switch (preset) {
      case "sunset":
        ambientColor = "#312e81";
        ambientIntensity = 0.4;
        keyColor = "#f59e0b"; // Warm amber
        keyIntensity = 2.2;
        keyPos = [4, 2, 3];
        fillColor = "#818cf8"; // Twilight purple
        fillIntensity = 0.8;
        fillPos = [-4, 1, -2];
        rimColor = "#fde047";
        rimIntensity = 1.4;
        rimPos = [0, 5, -4];
        break;

      case "dramatic_neon":
        ambientColor = "#030712";
        ambientIntensity = 0.2;
        keyColor = "#06b6d4"; // Electric cyan
        keyIntensity = 2.5;
        keyPos = [3, 2, 2];
        fillColor = "#ec4899"; // Vibrant magenta
        fillIntensity = 2.0;
        fillPos = [-3, -1, 1];
        rimColor = "#a855f7"; // Neon purple
        rimIntensity = 1.8;
        rimPos = [0, 4, -3];
        break;

      case "clinical_bright":
        ambientColor = "#ffffff";
        ambientIntensity = 1.2;
        keyColor = "#f8fafc"; // High-key clean white
        keyIntensity = 1.8;
        keyPos = [2, 5, 3];
        fillColor = "#e2e8f0";
        fillIntensity = 1.2;
        fillPos = [-3, 3, 2];
        rimColor = "#cbd5e1";
        rimIntensity = 0.6;
        rimPos = [0, 2, -4];
        break;

      case "luxury_warm":
        ambientColor = "#1c1917";
        ambientIntensity = 0.4;
        keyColor = "#d97706"; // Warm tungsten
        keyIntensity = 2.0;
        keyPos = [3, 4, 2];
        fillColor = "#fef3c7"; // Soft champagne
        fillIntensity = 0.7;
        fillPos = [-3, 2, 2];
        rimColor = "#fbbf24"; // Rich gold rim
        rimIntensity = 1.6;
        rimPos = [0, 3, -3];
        break;

      case "studio":
      default:
        ambientColor = "#ffffff";
        ambientIntensity = 0.7;
        keyColor = "#ffffff"; // Balanced daylight
        keyIntensity = 1.8;
        keyPos = [3, 4, 3];
        fillColor = "#94a3b8"; // Soft cool fill
        fillIntensity = 0.9;
        fillPos = [-3, 2, 2];
        rimColor = "#e2e8f0";
        rimIntensity = 0.8;
        rimPos = [0, 3, -3];
        break;
    }

    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    lightsGroup.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(keyColor, keyIntensity);
    keyLight.position.set(keyPos[0], keyPos[1], keyPos[2]);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    lightsGroup.add(keyLight);

    const fillLight = new THREE.DirectionalLight(fillColor, fillIntensity);
    fillLight.position.set(fillPos[0], fillPos[1], fillPos[2]);
    lightsGroup.add(fillLight);

    const rimLight = new THREE.DirectionalLight(rimColor, rimIntensity);
    rimLight.position.set(rimPos[0], rimPos[1], rimPos[2]);
    lightsGroup.add(rimLight);

    return {
      ambientLight,
      keyLight,
      fillLight,
      rimLight,
      lightsGroup,
    };
  }
}
