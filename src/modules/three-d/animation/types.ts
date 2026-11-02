export type AnimationTargetType = "object" | "camera" | "light" | "material";

export type AnimationPropertyType =
  // Object transforms
  | "position"
  | "rotation"
  | "scale"
  | "opacity"
  | "visible"
  // Camera properties
  | "camera_position"
  | "camera_target"
  | "camera_fov"
  // Lighting properties
  | "light_intensity"
  | "light_color"
  // Material properties
  | "material_color"
  | "material_roughness"
  | "material_metalness"
  | "material_opacity"
  | "material_emissive";

export type EasingType =
  | "linear"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3.out"
  | "sine.inOut"
  | "expo.out";

export type KeyframeValue =
  | number
  | [number, number, number]
  | string
  | boolean;

export interface KeyframeConfig {
  id: string;
  time: number; // Normalized progress 0.0 to 1.0
  value: KeyframeValue;
  ease?: EasingType;
}

export interface AnimationTrackConfig {
  id: string;
  name: string;
  targetType: AnimationTargetType;
  targetId: string; // Object ID, "camera", Light ID, or Material Object ID
  property: AnimationPropertyType;
  keyframes: KeyframeConfig[];
  enabled: boolean;
}

export interface ScrollTriggerConfig {
  enabled: boolean;
  triggerSelector?: string;
  start: string; // e.g. "top top"
  end: string;   // e.g. "+=2000" or "bottom bottom"
  scrub: boolean | number; // true, false, or lag damping in seconds (e.g. 1)
  pin: boolean;
  anticipatePin?: number;
  markers?: boolean;
}

export interface ThreeDTimelineConfig {
  id: string;
  name: string;
  duration: number; // Preview duration in seconds (e.g. 4.0)
  scrollTrigger: ScrollTriggerConfig;
  tracks: AnimationTrackConfig[];
}

export interface ThreeDAnimationConfig {
  version: "1.0";
  activeTimelineId: string;
  timelines: ThreeDTimelineConfig[];
}
