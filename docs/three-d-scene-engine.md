# Phase 3.3 — Immersive 3D Scene, Camera, Lighting & Material Engine
## Production Architecture & Operational Specification

This document details the architecture, configuration schema, camera engine, studio lighting rigs, non-destructive material engine, multi-object scene graph, and database persistence pipeline for **Phase 3.3** in the **Agency Website Engine**.

---

## 1. Scene Configuration System

Located in [`src/modules/three-d/scene/`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/scene/):

The scene configuration system provides a modular schema (`threeDSceneConfigSchema`) validated using Zod:

```typescript
export interface ThreeDSceneConfig {
  version: "1.0";
  environment: EnvironmentConfig;
  camera: CameraConfig;
  lighting: LightingConfig;
  objects: SceneObjectConfig[];
  renderQuality: RenderQualityConfig;
}
```

### 1.1. Persistence Architecture
Scene settings are persisted without requiring disruptive database migrations by leveraging the existing SQLite `ProjectDesignConfig.threeDPreferences` JSON column:
- `threeDPreferences.sceneConfig`: Stores the full validated `ThreeDSceneConfig`.
- Synchronized with `lightingEnvironment` and `experienceLevel` columns.
- Dedicated REST API routes:
  - `GET /api/projects/[id]/3d/scene`: Retrieves the live scene configuration and available model assets.
  - `PATCH /api/projects/[id]/3d/scene`: Validates input, merges updates into `threeDPreferences`, and saves to SQLite.

---

## 2. Camera Engine & Viewpoint Presets

Located in [`src/modules/three-d/scene/engine.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/scene/engine.ts):

### 2.1. Controls
- **FOV**: Adjustable from 15° to 120° (default 45°).
- **Clipping Planes**: Near (0.1m) and Far (1000m).
- **Position & Target**: 3-axis Cartesian coordinates `[x, y, z]`.
- **OrbitControls Limits**:
  - Distance clamping: `minDistance: 1.2m`, `maxDistance: 25.0m`.
  - Polar angle clamping: `maxPolarAngle: Math.PI / 2 + 0.05` (~1.62 rad) prevents the camera from sinking beneath the ground plane.
  - Smooth damping (`dampingFactor: 0.05`).

### 2.2. Cinematic Viewpoint Presets
| Preset | Position `[x, y, z]` | Target `[x, y, z]` | FOV | Character |
| :--- | :--- | :--- | :--- | :--- |
| `hero_angle` | `[0, 2.5, 6]` | `[0, 0, 0]` | 45° | Elevated 3/4 perspective for primary product showcase. |
| `front` | `[0, 1.2, 5.5]` | `[0, 0.8, 0]` | 40° | Eye-level front elevation. |
| `top_down` | `[0, 8, 2]` | `[0, 0, 0]` | 45° | Architectural bird's-eye view. |
| `isometric` | `[5, 5, 5]` | `[0, 0, 0]` | 38° | True isometric axonometric aesthetic. |
| `cinematic_low` | `[0, 0.4, 4.5]` | `[0, 1.2, 0]` | 50° | Low-angle heroic automotive/architectural stance. |

---

## 3. Studio Lighting Engine

Located in [`src/modules/three-d/lighting/engine.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/lighting/engine.ts):

### 3.1. Lighting Structure
- **Ambient Daylight**: Neutral or color-tinted ambient floor illumination.
- **Main Key Directional Light**: Primary shadow-casting light with customizable shadow map size (512 to 2048) and shadow bias (-0.0001).
- **Fill Directional Light**: Soft complementary light (shadows disabled to save GPU resources).
- **Rim / Back Directional Light**: Edge definition highlight for silhouettes.
- **Configurable Point Lights**: Positional omnidirectional glow lights with attenuation distance and decay.
- **Configurable Spot Lights**: Targeted conical spotlights with angle and penumbra softness controls.

### 3.2. Presets
- `studio`: Balanced 5500K daylight with soft fill.
- `sunset`: 2700K warm amber key light with deep indigo twilight ambient tones.
- `dramatic_neon`: High-contrast split lighting featuring `#06b6d4` electric cyan key and `#ec4899` vibrant magenta fill.
- `clinical_bright`: High-key clean white architectural/medical illumination.
- `luxury_warm`: Subtle `#d97706` tungsten with soft champagne reflections.

---

## 4. Material Engine & Non-Destructive Overrides

Located in [`src/modules/three-d/materials/engine.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/materials/engine.ts):

### 4.1. Non-Destructive Overrides
- **WeakMap Registry**: Caches original materials for every mesh in an object upon instantiation.
- **Safe Material Cloning**: Clones materials on demand when an override is applied. Other objects sharing that material are unaffected.
- **Supported Surface Controls**:
  - `color`: Base albedo tint.
  - `roughness`: 0.0 (mirror-like) to 1.0 (matte).
  - `metalness`: 0.0 (dielectric) to 1.0 (pure metal).
  - `opacity` & `transparent`: Alpha transparency.
  - `emissive` & `emissiveIntensity`: Self-illumination glow.
  - `wireframe`: Dynamic topological wireframe overlay.
  - `doubleSided`: `THREE.DoubleSide` face normal rendering.
- **Clean Reset**: Restores original materials and disposes all generated cloned materials to prevent WebGL GPU leaks.

---

## 5. Multi-Object Scene Graph & Transform Engine

Located in [`src/modules/three-d/scene/objects.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/scene/objects.ts):

- **Supported Sources**:
  - Real uploaded `.glb` / `.gltf` model assets via `ThreeDModelLoader`.
  - Procedural 3D archetypes (`product_model`, `spatial_environment`, `hero_floating_object`, `interactive_particles`).
- **Transforms**:
  - `position`: `[x, y, z]` in world space units.
  - `rotation`: `[x, y, z]` in degrees (automatically converted to radians for Three.js Euler matrices).
  - `scale`: `[x, y, z]` scale factors.
  - `visible`: Toggles object graph visibility.
  - `castShadow` & `receiveShadow`: Configured across all child meshes.
- **Operations**:
  - `addObject`: Instantiates and attaches a new object to the scene.
  - `duplicateObject`: Deep-clones the object with a new unique ID and a spatial offset.
  - `removeObject`: Detaches and disposes geometries and materials.
  - `updateTransform`: Real-time updates without reloading geometry.

---

## 6. Environment & Atmosphere

- **Background Canvas**:
  - Solid Theme Color: Hex color background (default `#070b14`).
  - Transparent: Leaves Three.js background null so the HTML page shows through.
- **Atmospheric Fog**: Exponential depth fog with near/far clipping distances.
- **Ground Plane**: Standardized 40x40 plane receiving dynamic shadows with PBR roughness.
- **Editor Grid Helper**: 20x20 unit grid overlay toggleable directly in the studio for spatial alignment.

---

## 7. Scene Studio UI (`<SceneStudioView />`)

Located at `/projects/[id]/3d` ([`src/components/three-d-studio/SceneStudioView.tsx`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/components/three-d-studio/SceneStudioView.tsx)):

- **Viewport HUD**: Real-time FPS telemetry, object count, mesh count, and vertex count.
- **Inspector Panels**:
  - **Objects**: Hierarchy list, add object modal, delete, and visibility toggles.
  - **Transform**: Position, rotation, scale numeric inputs with real-time WebGL canvas synchronization.
  - **Material**: Color picker, roughness/metalness sliders, wireframe and double-sided checkboxes, reset button.
  - **Camera**: Preset buttons (Hero, Front, Top-down, Isometric, Cinematic) and FOV slider.
  - **Lighting**: Preset atmospheric dropdown and key/ambient intensity sliders.
  - **Env**: Background mode, canvas color, fog toggle, and grid toggle.
  - **Perf**: Hardware telemetry and DPR limits.
- **Header Actions**: Save 3D Scene button with toast notifications, Reset Scene button, and direct preview links.

---

## 8. Verification & Test Suite Summary

- `tests/verify-three-d-scene.ts`: 85 unit and integration tests covering schemas, camera presets, lighting presets, material cloning isolation, multi-object transforms, duplication, and SQLite persistence.
- `tests/browser-three-d-scene.ts`: 20 Playwright Chromium browser tests verifying end-to-end WebGL rendering, modal object addition, transform updates, material override toggles, camera preset switching, lighting switching, OrbitControls mouse dragging, and database save confirmation.
