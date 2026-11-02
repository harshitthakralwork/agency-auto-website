import {
  ThreeDAnimationConfig,
  ThreeDTimelineConfig,
  AnimationTrackConfig,
} from "./types";

/**
 * Creates default 3D animation timeline configuration.
 */
export function createDefaultThreeDAnimationConfig(primaryObjectId = "obj_primary_showcase"): ThreeDAnimationConfig {
  const defaultTimeline: ThreeDTimelineConfig = {
    id: "timeline_main_story",
    name: "Main 3D Scroll Journey",
    duration: 4.0,
    scrollTrigger: {
      enabled: true,
      triggerSelector: "[data-3d-scroll-canvas]",
      start: "top top",
      end: "+=2500",
      scrub: 1, // 1-second smooth interpolation lag
      pin: true,
      anticipatePin: 1,
      markers: false,
    },
    tracks: [
      // Track 1: Rotate primary showcase object 360 degrees around Y axis
      {
        id: "track_primary_spin",
        name: "Product Y-Axis 360° Spin",
        targetType: "object",
        targetId: primaryObjectId,
        property: "rotation",
        enabled: true,
        keyframes: [
          { id: "kf_spin_start", time: 0.0, value: [0, 0, 0], ease: "linear" },
          { id: "kf_spin_mid", time: 0.5, value: [0, 180, 0], ease: "linear" },
          { id: "kf_spin_end", time: 1.0, value: [0, 360, 0], ease: "linear" },
        ],
      },
      // Track 2: Camera Position zoom and subtle elevation drift
      {
        id: "track_camera_drift",
        name: "Camera Elevation & Distance",
        targetType: "camera",
        targetId: "mainCamera",
        property: "camera_position",
        enabled: true,
        keyframes: [
          { id: "kf_cam_start", time: 0.0, value: [0, 2.5, 6], ease: "power1.inOut" },
          { id: "kf_cam_mid", time: 0.5, value: [1.5, 1.8, 4.5], ease: "power1.inOut" },
          { id: "kf_cam_end", time: 1.0, value: [0, 2.2, 5.5], ease: "power1.inOut" },
        ],
      },
      // Track 3: Camera FOV Cinematic Compression
      {
        id: "track_camera_fov",
        name: "Cinematic FOV Transition",
        targetType: "camera",
        targetId: "mainCamera",
        property: "camera_fov",
        enabled: true,
        keyframes: [
          { id: "kf_fov_start", time: 0.0, value: 45, ease: "sine.inOut" },
          { id: "kf_fov_end", time: 1.0, value: 38, ease: "sine.inOut" },
        ],
      },
      // Track 4: Key Light Intensity Arc
      {
        id: "track_light_intensity",
        name: "Key Light Intensity Arc",
        targetType: "light",
        targetId: "mainDirectional",
        property: "light_intensity",
        enabled: true,
        keyframes: [
          { id: "kf_light_start", time: 0.0, value: 1.2, ease: "linear" },
          { id: "kf_light_mid", time: 0.5, value: 2.2, ease: "power2.out" },
          { id: "kf_light_end", time: 1.0, value: 1.5, ease: "power2.in" },
        ],
      },
    ],
  };

  return {
    version: "1.0",
    activeTimelineId: defaultTimeline.id,
    timelines: [defaultTimeline],
  };
}

/**
 * Built-in production-grade animation presets that can be loaded into any timeline.
 */
export const ANIMATION_PRESETS: Record<
  string,
  { name: string; description: string; getTracks: (objectId: string) => AnimationTrackConfig[] }
> = {
  product_360: {
    name: "Product 360° Inspection",
    description: "Complete seamless rotation of the showcase model with subtle camera framing.",
    getTracks: (objectId: string) => [
      {
        id: `track_spin_${Date.now()}`,
        name: "360° Smooth Spin",
        targetType: "object",
        targetId: objectId,
        property: "rotation",
        enabled: true,
        keyframes: [
          { id: "kf_p360_0", time: 0.0, value: [0, 0, 0], ease: "linear" },
          { id: "kf_p360_1", time: 0.5, value: [0, 180, 0], ease: "linear" },
          { id: "kf_p360_2", time: 1.0, value: [0, 360, 0], ease: "linear" },
        ],
      },
      {
        id: `track_scale_${Date.now()}`,
        name: "Subtle Scale Breathe",
        targetType: "object",
        targetId: objectId,
        property: "scale",
        enabled: true,
        keyframes: [
          { id: "kf_scale_0", time: 0.0, value: [1, 1, 1], ease: "power1.inOut" },
          { id: "kf_scale_1", time: 0.5, value: [1.1, 1.1, 1.1], ease: "power1.inOut" },
          { id: "kf_scale_2", time: 1.0, value: [1, 1, 1], ease: "power1.inOut" },
        ],
      },
    ],
  },

  hero_flythrough: {
    name: "Cinematic Fly-Through",
    description: "Dramatic high-angle fly-in with dynamic camera FOV compression.",
    getTracks: (objectId: string) => [
      {
        id: `track_fly_cam_${Date.now()}`,
        name: "Camera High-Angle Sweep",
        targetType: "camera",
        targetId: "mainCamera",
        property: "camera_position",
        enabled: true,
        keyframes: [
          { id: "kf_fly_0", time: 0.0, value: [0, 6, 10], ease: "power2.out" },
          { id: "kf_fly_1", time: 0.6, value: [3, 2.5, 5], ease: "power1.inOut" },
          { id: "kf_fly_2", time: 1.0, value: [0, 1.5, 4], ease: "power2.out" },
        ],
      },
      {
        id: `track_fly_fov_${Date.now()}`,
        name: "Dynamic Lens Compression",
        targetType: "camera",
        targetId: "mainCamera",
        property: "camera_fov",
        enabled: true,
        keyframes: [
          { id: "kf_ffov_0", time: 0.0, value: 65, ease: "power2.inOut" },
          { id: "kf_ffov_1", time: 1.0, value: 35, ease: "power2.inOut" },
        ],
      },
      {
        id: `track_fly_obj_${Date.now()}`,
        name: "Object Presentation Tilt",
        targetType: "object",
        targetId: objectId,
        property: "rotation",
        enabled: true,
        keyframes: [
          { id: "kf_ftilt_0", time: 0.0, value: [-15, -30, 0], ease: "power1.out" },
          { id: "kf_ftilt_1", time: 1.0, value: [0, 20, 0], ease: "power1.out" },
        ],
      },
    ],
  },

  cyberpunk_neon: {
    name: "Cyberpunk Neon Shift",
    description: "Vibrant lighting and material color transition with metallic finish sheen.",
    getTracks: (objectId: string) => [
      {
        id: `track_neon_light_${Date.now()}`,
        name: "Key Light Color Transition",
        targetType: "light",
        targetId: "mainDirectional",
        property: "light_color",
        enabled: true,
        keyframes: [
          { id: "kf_neon_0", time: 0.0, value: "#ffffff", ease: "power1.inOut" },
          { id: "kf_neon_1", time: 0.5, value: "#06b6d4", ease: "power1.inOut" },
          { id: "kf_neon_2", time: 1.0, value: "#ec4899", ease: "power1.inOut" },
        ],
      },
      {
        id: `track_neon_mat_${Date.now()}`,
        name: "Material Sheen Transition",
        targetType: "material",
        targetId: objectId,
        property: "material_roughness",
        enabled: true,
        keyframes: [
          { id: "kf_nmat_0", time: 0.0, value: 0.5, ease: "linear" },
          { id: "kf_nmat_1", time: 0.5, value: 0.1, ease: "linear" },
          { id: "kf_nmat_2", time: 1.0, value: 0.3, ease: "linear" },
        ],
      },
    ],
  },

  exploded_showcase: {
    name: "Exploded Scale & Elevation",
    description: "Object elevation and scaling reveal suited for product feature breakdowns.",
    getTracks: (objectId: string) => [
      {
        id: `track_exp_pos_${Date.now()}`,
        name: "Vertical Levitation Lift",
        targetType: "object",
        targetId: objectId,
        property: "position",
        enabled: true,
        keyframes: [
          { id: "kf_epos_0", time: 0.0, value: [0, 0, 0], ease: "power2.out" },
          { id: "kf_epos_1", time: 0.5, value: [0, 1.2, 0], ease: "power1.inOut" },
          { id: "kf_epos_2", time: 1.0, value: [0, 0.5, 0], ease: "power2.inOut" },
        ],
      },
      {
        id: `track_exp_rot_${Date.now()}`,
        name: "Multi-Axis Tilt",
        targetType: "object",
        targetId: objectId,
        property: "rotation",
        enabled: true,
        keyframes: [
          { id: "kf_erot_0", time: 0.0, value: [0, 0, 0], ease: "linear" },
          { id: "kf_erot_1", time: 0.5, value: [15, 90, -10], ease: "linear" },
          { id: "kf_erot_2", time: 1.0, value: [0, 180, 0], ease: "linear" },
        ],
      },
    ],
  },
};
