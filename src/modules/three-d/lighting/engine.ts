import * as THREE from "three";
import { LightingConfig } from "../scene/types";
import { ThreeDLightingPresets } from "./presets";

/**
 * Manages Three.js scene lighting, directional key/fill/rim rigs, point/spot lights, and shadow maps.
 */
export class ThreeDLightingEngine {
  private lightingGroup = new THREE.Group();
  private lightsMap = new Map<string, THREE.Light>();

  constructor() {
    this.lightingGroup.name = "SceneLightingGroup";
  }

  getGroup(): THREE.Group {
    return this.lightingGroup;
  }

  /**
   * Applies a complete LightingConfig to the lighting group.
   * Completely disposes prior lights before rebuilding to prevent memory leaks.
   */
  applyLighting(config: LightingConfig): void {
    this.clear();

    // 1. Ambient Light
    if (config.ambient && config.ambient.intensity > 0) {
      const ambient = new THREE.AmbientLight(
        new THREE.Color(config.ambient.color),
        config.ambient.intensity
      );
      ambient.name = "ambient-light";
      this.lightingGroup.add(ambient);
      this.lightsMap.set("ambient", ambient);
    }

    // 2. Hemisphere Light
    if (config.hemisphere && config.hemisphere.enabled && config.hemisphere.intensity > 0) {
      const hemi = new THREE.HemisphereLight(
        new THREE.Color(config.hemisphere.skyColor),
        new THREE.Color(config.hemisphere.groundColor),
        config.hemisphere.intensity
      );
      hemi.name = "hemisphere-light";
      this.lightingGroup.add(hemi);
      this.lightsMap.set("hemisphere", hemi);
    }

    // 3. Main Directional Key Light
    if (config.mainDirectional && config.mainDirectional.enabled) {
      const dir = new THREE.DirectionalLight(
        new THREE.Color(config.mainDirectional.color),
        config.mainDirectional.intensity
      );
      dir.name = config.mainDirectional.id || "main-key-light";
      dir.position.set(...config.mainDirectional.position);

      if (config.mainDirectional.castShadow) {
        dir.castShadow = true;
        const shadowMapSize = config.mainDirectional.shadowMapSize || 1024;
        dir.shadow.mapSize.width = shadowMapSize;
        dir.shadow.mapSize.height = shadowMapSize;
        dir.shadow.camera.near = 0.5;
        dir.shadow.camera.far = 40;
        dir.shadow.camera.left = -10;
        dir.shadow.camera.right = 10;
        dir.shadow.camera.top = 10;
        dir.shadow.camera.bottom = -10;
        dir.shadow.bias = config.mainDirectional.shadowBias ?? -0.0001;
      }

      this.lightingGroup.add(dir);
      this.lightsMap.set("mainDirectional", dir);
    }

    // 4. Fill Light
    if (config.fillLight && config.fillLight.enabled) {
      const fill = new THREE.DirectionalLight(
        new THREE.Color(config.fillLight.color),
        config.fillLight.intensity
      );
      fill.name = config.fillLight.id || "fill-light";
      fill.position.set(...config.fillLight.position);
      fill.castShadow = false; // Fill lights do not need expensive shadows

      this.lightingGroup.add(fill);
      this.lightsMap.set("fillLight", fill);
    }

    // 5. Rim / Back Light
    if (config.rimLight && config.rimLight.enabled) {
      const rim = new THREE.DirectionalLight(
        new THREE.Color(config.rimLight.color),
        config.rimLight.intensity
      );
      rim.name = config.rimLight.id || "rim-light";
      rim.position.set(...config.rimLight.position);
      rim.castShadow = false;

      this.lightingGroup.add(rim);
      this.lightsMap.set("rimLight", rim);
    }

    // 6. Configurable Point Lights
    if (Array.isArray(config.pointLights)) {
      for (const pConfig of config.pointLights) {
        if (!pConfig.enabled) continue;
        const pt = new THREE.PointLight(
          new THREE.Color(pConfig.color),
          pConfig.intensity,
          pConfig.distance ?? 0,
          pConfig.decay ?? 2
        );
        pt.name = pConfig.id;
        pt.position.set(...pConfig.position);
        pt.castShadow = Boolean(pConfig.castShadow);
        if (pt.castShadow) {
          pt.shadow.mapSize.width = 512;
          pt.shadow.mapSize.height = 512;
        }
        this.lightingGroup.add(pt);
        this.lightsMap.set(`point_${pConfig.id}`, pt);
      }
    }

    // 7. Configurable Spot Lights
    if (Array.isArray(config.spotLights)) {
      for (const sConfig of config.spotLights) {
        if (!sConfig.enabled) continue;
        const spot = new THREE.SpotLight(
          new THREE.Color(sConfig.color),
          sConfig.intensity,
          0,
          sConfig.angle ?? Math.PI / 4,
          sConfig.penumbra ?? 0.2
        );
        spot.name = sConfig.id;
        spot.position.set(...sConfig.position);
        if (sConfig.target) {
          spot.target.position.set(...sConfig.target);
          this.lightingGroup.add(spot.target);
        }
        spot.castShadow = Boolean(sConfig.castShadow);
        if (spot.castShadow) {
          spot.shadow.mapSize.width = 512;
          spot.shadow.mapSize.height = 512;
        }
        this.lightingGroup.add(spot);
        this.lightsMap.set(`spot_${sConfig.id}`, spot);
      }
    }
  }

  /**
   * Retrieves an individual light by key or ID.
   */
  getLight(key: string): THREE.Light | undefined {
    return this.lightsMap.get(key);
  }

  /**
   * Clears and disposes all active lights.
   */
  clear(): void {
    while (this.lightingGroup.children.length > 0) {
      const child = this.lightingGroup.children[0];
      if (child instanceof THREE.Light && child.dispose) {
        child.dispose();
      }
      this.lightingGroup.remove(child);
    }
    this.lightsMap.clear();
  }

  dispose(): void {
    this.clear();
  }
}
