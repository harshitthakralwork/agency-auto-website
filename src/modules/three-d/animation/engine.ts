import * as THREE from "three";
import {
  AnimationPropertyType,
  AnimationTrackConfig,
  EasingType,
  KeyframeConfig,
  ThreeDTimelineConfig,
} from "./types";
import { ThreeDSceneEngine } from "../scene/engine";

const DEG2RAD = Math.PI / 180;

/**
 * Mathematical easing curves matching standard GSAP easing formulations.
 */
export function evaluateEasing(t: number, ease?: EasingType): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (ease) {
    case "power1.in":
      return clamped * clamped;
    case "power1.out":
      return clamped * (2 - clamped);
    case "power1.inOut":
      return clamped < 0.5
        ? 2 * clamped * clamped
        : -1 + (4 - 2 * clamped) * clamped;
    case "power2.in":
      return clamped * clamped * clamped;
    case "power2.out": {
      const u = clamped - 1;
      return u * u * u + 1;
    }
    case "power2.inOut":
      return clamped < 0.5
        ? 4 * clamped * clamped * clamped
        : (clamped - 1) * (2 * clamped - 2) * (2 * clamped - 2) + 1;
    case "power3.out":
      return 1 - Math.pow(1 - clamped, 4);
    case "sine.inOut":
      return -(Math.cos(Math.PI * clamped) - 1) / 2;
    case "expo.out":
      return clamped === 1 ? 1 : 1 - Math.pow(2, -10 * clamped);
    case "linear":
    default:
      return clamped;
  }
}

/**
 * Real-time 3D Animation Interpolation Engine.
 * Evaluates timelines at any progress (0.0 to 1.0) and mutates Three.js objects directly with zero GC pressure.
 */
export class ThreeDAnimationEngine {
  private sceneEngine: ThreeDSceneEngine;
  private currentTimeline: ThreeDTimelineConfig | null = null;

  // Scratch objects for zero-allocation per-frame interpolation
  private scratchColorA = new THREE.Color();
  private scratchColorB = new THREE.Color();
  private scratchResultColor = new THREE.Color();

  constructor(sceneEngine: ThreeDSceneEngine) {
    this.sceneEngine = sceneEngine;
  }

  /**
   * Sets the active timeline to evaluate.
   */
  setTimeline(timeline: ThreeDTimelineConfig): void {
    // Sort keyframes in each track ascending by time for fast binary/linear search
    const sanitizedTimeline: ThreeDTimelineConfig = {
      ...timeline,
      tracks: timeline.tracks.map((track) => ({
        ...track,
        keyframes: [...track.keyframes].sort((a, b) => a.time - b.time),
      })),
    };
    this.currentTimeline = sanitizedTimeline;
  }

  getTimeline(): ThreeDTimelineConfig | null {
    return this.currentTimeline;
  }

  /**
   * Evaluates the active timeline at a given normalized progress (0.0 to 1.0).
   */
  evaluate(progress: number): void {
    if (!this.currentTimeline) return;
    const clampedProgress = Math.max(0, Math.min(1, progress));

    for (const track of this.currentTimeline.tracks) {
      if (!track.enabled || track.keyframes.length === 0) continue;
      this.evaluateTrack(track, clampedProgress);
    }
  }

  /**
   * Evaluates an individual track and applies the interpolated value to the target Three.js entity.
   */
  private evaluateTrack(track: AnimationTrackConfig, progress: number): void {
    const kfs = track.keyframes;
    let interpolatedValue: any;

    if (kfs.length === 1 || progress <= kfs[0].time) {
      interpolatedValue = kfs[0].value;
    } else if (progress >= kfs[kfs.length - 1].time) {
      interpolatedValue = kfs[kfs.length - 1].value;
    } else {
      // Find surrounding keyframes
      let idx = 0;
      for (let i = 0; i < kfs.length - 1; i++) {
        if (progress >= kfs[i].time && progress <= kfs[i + 1].time) {
          idx = i;
          break;
        }
      }

      const k0 = kfs[idx];
      const k1 = kfs[idx + 1];
      const timeSpan = k1.time - k0.time;
      const rawT = timeSpan > 0 ? (progress - k0.time) / timeSpan : 0;
      const easedT = evaluateEasing(rawT, k0.ease);

      interpolatedValue = this.interpolateValues(track.property, k0.value, k1.value, easedT);
    }

    this.applyTrackValue(track, interpolatedValue);
  }

  /**
   * High performance value interpolation handling numbers, 3D vectors, colors, and booleans.
   */
  private interpolateValues(
    property: AnimationPropertyType,
    v0: any,
    v1: any,
    t: number
  ): any {
    // 1. Vector3 properties: position, rotation, scale, camera_position, camera_target
    if (
      Array.isArray(v0) &&
      Array.isArray(v1) &&
      v0.length === 3 &&
      v1.length === 3
    ) {
      return [
        v0[0] + (v1[0] - v0[0]) * t,
        v0[1] + (v1[1] - v0[1]) * t,
        v0[2] + (v1[2] - v0[2]) * t,
      ];
    }

    // 2. Color properties: light_color, material_color
    if (property === "light_color" || property === "material_color") {
      try {
        this.scratchColorA.set(v0);
        this.scratchColorB.set(v1);
        this.scratchResultColor.copy(this.scratchColorA).lerp(this.scratchColorB, t);
        return "#" + this.scratchResultColor.getHexString();
      } catch {
        return v0;
      }
    }

    // 3. Scalar numeric properties: camera_fov, light_intensity, material_roughness, etc.
    if (typeof v0 === "number" && typeof v1 === "number") {
      return v0 + (v1 - v0) * t;
    }

    // 4. Boolean properties: visible
    if (typeof v0 === "boolean" || typeof v1 === "boolean") {
      return t >= 0.5 ? v1 : v0;
    }

    return t >= 0.5 ? v1 : v0;
  }

  /**
   * Applies the calculated value to the target Three.js object, camera, light, or material.
   */
  private applyTrackValue(track: AnimationTrackConfig, value: any): void {
    switch (track.targetType) {
      case "object":
        this.applyObjectProperty(track.targetId, track.property, value);
        break;

      case "camera":
        this.applyCameraProperty(track.property, value);
        break;

      case "light":
        this.applyLightProperty(track.targetId, track.property, value);
        break;

      case "material":
        this.applyMaterialProperty(track.targetId, track.property, value);
        break;
    }
  }

  /**
   * Mutates an object's transform, visibility, or opacity.
   */
  private applyObjectProperty(objectId: string, property: AnimationPropertyType, value: any): void {
    const managed = this.sceneEngine.getObjectManager().getManagedObject(objectId);
    if (!managed) return;
    const root = managed.root;

    switch (property) {
      case "position":
        if (Array.isArray(value)) {
          root.position.set(value[0], value[1], value[2]);
        }
        break;

      case "rotation":
        if (Array.isArray(value)) {
          root.rotation.set(value[0] * DEG2RAD, value[1] * DEG2RAD, value[2] * DEG2RAD);
        }
        break;

      case "scale":
        if (Array.isArray(value)) {
          root.scale.set(value[0], value[1], value[2]);
        }
        break;

      case "visible":
        root.visible = Boolean(value);
        break;

      case "opacity":
        if (typeof value === "number") {
          root.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  m.transparent = value < 1.0;
                  m.opacity = value;
                });
              } else if (mesh.material) {
                mesh.material.transparent = value < 1.0;
                mesh.material.opacity = value;
              }
            }
          });
        }
        break;
    }
  }

  /**
   * Mutates the camera position, target lookAt, or lens FOV.
   */
  private applyCameraProperty(property: AnimationPropertyType, value: any): void {
    const camera = this.sceneEngine.getCamera();

    switch (property) {
      case "camera_position":
      case "position":
        if (Array.isArray(value)) {
          camera.position.set(value[0], value[1], value[2]);
        }
        break;

      case "camera_target":
        if (Array.isArray(value)) {
          camera.lookAt(value[0], value[1], value[2]);
        }
        break;

      case "camera_fov":
        if (typeof value === "number") {
          camera.fov = value;
          camera.updateProjectionMatrix();
        }
        break;
    }
  }

  /**
   * Mutates a light source intensity or color.
   */
  private applyLightProperty(lightId: string, property: AnimationPropertyType, value: any): void {
    const lightingEngine = this.sceneEngine.getLightingEngine();
    let light = lightingEngine.getLight(lightId);

    // If not found directly by key, search in point/spot lights
    if (!light) {
      light = lightingEngine.getLight(`point_${lightId}`) || lightingEngine.getLight(`spot_${lightId}`);
    }

    if (!light) return;

    switch (property) {
      case "light_intensity":
        if (typeof value === "number") {
          light.intensity = value;
        }
        break;

      case "light_color":
        if (typeof value === "string") {
          light.color.set(value);
        }
        break;
    }
  }

  /**
   * Mutates material properties non-destructively.
   */
  private applyMaterialProperty(objectId: string, property: AnimationPropertyType, value: any): void {
    const managed = this.sceneEngine.getObjectManager().getManagedObject(objectId);
    if (!managed) return;

    managed.root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        for (const mat of materials) {
          if (!mat) continue;
          const stdMat = mat as THREE.MeshStandardMaterial;

          switch (property) {
            case "material_color":
              if (stdMat.color && typeof value === "string") {
                stdMat.color.set(value);
              }
              break;

            case "material_roughness":
              if (typeof stdMat.roughness === "number" && typeof value === "number") {
                stdMat.roughness = value;
              }
              break;

            case "material_metalness":
              if (typeof stdMat.metalness === "number" && typeof value === "number") {
                stdMat.metalness = value;
              }
              break;

            case "material_opacity":
              if (typeof value === "number") {
                stdMat.transparent = value < 1.0;
                stdMat.opacity = value;
              }
              break;

            case "material_emissive":
              if (stdMat.emissive) {
                if (typeof value === "string") {
                  stdMat.emissive.set(value);
                } else if (typeof value === "number") {
                  stdMat.emissiveIntensity = value;
                }
              }
              break;
          }
        }
      }
    });
  }
}
