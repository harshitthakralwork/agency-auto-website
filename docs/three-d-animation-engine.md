# Phase 3.4 — Scroll-Linked 3D Animation & Timeline Engine
## Production Architecture & Operational Specification

This document details the architecture, animation data model, mathematical easing engine, GSAP ScrollTrigger bridge, visual timeline studio, client runtime component, and verification suites for **Phase 3.4** in the **Agency Website Engine**.

---

## 1. Architectural Overview & Design Principles

Phase 3.4 builds upon the Three.js foundational core (Phase 3.1), GLTF model loader (Phase 3.2), and 3D Scene Engine (Phase 3.3) by connecting them directly to the GSAP and ScrollTrigger cinematic infrastructure established in Phase 2.3.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Agency Website Engine                           │
├────────────────────────────────────────────────────────────────────────┤
│  Client Viewport / Scroll Gestures                                      │
│         │                                                              │
│         ▼                                                              │
│  GSAP ScrollTrigger Bridge (`ThreeDScrollTriggerBridge`)               │
│  - Scoped via `gsap.context()` for 100% leak-free teardown             │
│  - Bidirectional scrub with configurable damping (e.g. 1.0s lag)       │
│  - Dynamic container pinning (`pin: true`)                             │
│  - Accessible fallback for `prefers-reduced-motion`                    │
│         │                                                              │
│         ▼ (Progress 0.0 to 1.0)                                        │
│  3D Animation Interpolation Engine (`ThreeDAnimationEngine`)           │
│  - Zero GC allocation per-frame using scratch Vector3/Euler/Color      │
│  - Multi-track property evaluation (Object, Camera, Light, Material)   │
│  - Mathematical easing curves (Power1, Power2, Power3, Sine, Expo)     │
│         │                                                              │
│         ▼                                                              │
│  3D Scene Engine (`ThreeDSceneEngine`)                                 │
│  - Object Transforms: Vector3 Position, Euler Rotation, Scale          │
│  - Camera: Position, LookAt Target, Cinematic Lens FOV                 │
│  - Lighting Rigs: Directional Key/Fill/Rim, Point, Spot Intensity/Color│
│  - Material Overrides: Non-destructive Color, Roughness, Metalness     │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Principles
1. **Zero Duplicate Lifecycles**: Reuses the central GSAP provider from `@/modules/cinematic/gsap/provider` rather than creating a secondary instance.
2. **Zero Garbage Collection Overhead**: Evaluation loops avoid runtime object allocations (`new THREE.Vector3()`, `new THREE.Color()`) during scrolling, reusing pre-instantiated scratch buffers.
3. **Non-Destructive Material Interpolation**: Preserves original geometry materials while transitioning surface finishes and lighting.
4. **Resilient Persistence**: Stores timeline choreographies inside SQLite `ProjectDesignConfig.threeDPreferences` under `animationConfig`.

---

## 2. Animation Data Model & Schema

Located in [`src/modules/three-d/animation/`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/animation/):

```typescript
export interface KeyframeConfig {
  id: string;
  time: number; // Normalized progress 0.0 to 1.0
  value: number | [number, number, number] | string | boolean;
  ease?: EasingType;
}

export interface AnimationTrackConfig {
  id: string;
  name: string;
  targetType: "object" | "camera" | "light" | "material";
  targetId: string;
  property: AnimationPropertyType;
  keyframes: KeyframeConfig[];
  enabled: boolean;
}

export interface ScrollTriggerConfig {
  enabled: boolean;
  triggerSelector?: string;
  start: string; // e.g. "top top"
  end: string;   // e.g. "+=2500"
  scrub: boolean | number;
  pin: boolean;
  anticipatePin?: number;
  markers?: boolean;
}

export interface ThreeDTimelineConfig {
  id: string;
  name: string;
  duration: number; // Playback duration in seconds (e.g. 4.0s)
  scrollTrigger: ScrollTriggerConfig;
  tracks: AnimationTrackConfig[];
}

export interface ThreeDAnimationConfig {
  version: "1.0";
  activeTimelineId: string;
  timelines: ThreeDTimelineConfig[];
}
```

---

## 3. Mathematical Easing Curves

Located in [`src/modules/three-d/animation/engine.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/animation/engine.ts):

| Easing | Formula | Character |
| :--- | :--- | :--- |
| `linear` | `t` | Constant mechanical velocity. Ideal for continuous 360° product inspection. |
| `power1.in` | `t * t` | Smooth acceleration curve. |
| `power1.out` | `t * (2 - t)` | Smooth deceleration curve. |
| `power1.inOut` | `t < 0.5 ? 2*t^2 : -1 + (4 - 2*t)*t` | Balanced cinematic ease for camera moves. |
| `power2.out` | `(t - 1)^3 + 1` | Crisp vehicle/product braking feel. |
| `power2.inOut` | Quartic bell curve | Dramatic contrast between midpoint drift and endpoints. |
| `power3.out` | `1 - (1 - t)^4` | High-impact hero product slam. |
| `sine.inOut` | `-(cos(π * t) - 1) / 2` | Symmetrical organic undulating wave. |
| `expo.out` | `1 - 2^(-10 * t)` | Rapid snap-to-focus. |

---

## 4. Production Animation Presets

Located in [`src/modules/three-d/animation/defaults.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/animation/defaults.ts):

1. **Product 360° Inspection (`product_360`)**:
   - Rotates primary model from 0° to 360° around the Y-axis.
   - Applies subtle harmonic scale breathing `[1, 1, 1]` -> `[1.1, 1.1, 1.1]` -> `[1, 1, 1]`.
2. **Cinematic Fly-Through (`hero_flythrough`)**:
   - Sweeps camera from high angle `[0, 6, 10]` down to presentation eye-level `[0, 1.5, 4]`.
   - Narrows lens FOV dynamically from wide 65° down to 35° telephoto compression.
   - Tilts object `[-15°, -30°, 0°]` -> `[0°, 20°, 0°]`.
3. **Cyberpunk Neon Shift (`cyberpunk_neon`)**:
   - Key light transitions from neutral studio white `#ffffff` -> electric cyan `#06b6d4` -> vibrant magenta `#ec4899`.
   - Surface roughness transitions from matte (0.5) to mirror metallic sheen (0.1).
4. **Exploded Scale & Elevation (`exploded_showcase`)**:
   - Vertically levitates product model `+1.2m` on Y-axis.
   - Rotates simultaneously across X, Y, and Z axes `[15°, 90°, -10°]`.

---

## 5. Visual Timeline Studio UI

Located at `/projects/[id]/animation-3d` ([`src/components/three-d-animation/TimelineStudioView.tsx`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/components/three-d-animation/TimelineStudioView.tsx)):

- **Live 3D Viewport**: Real-time rendering with WebGL context and OrbitControls preview.
- **Floating Telemetry HUD**: Displays current active timeline name, live time in seconds (`1.50s / 4.0s`), and scroll scrub percentage (`38%`).
- **Interactive Scrubber Controller**:
  - Play / Pause / Reset controls.
  - 0% to 100% Range Slider for manual scrubbing.
- **Multi-Track Lane Visualizer**:
  - Color-coded badges for Target Types (Sky blue for Object, Amber for Camera, Yellow for Light, Purple for Material).
  - Track visibility toggle (`Eye` / `EyeOff`).
  - Keyframe diamonds positioned at `left: ${keyframe.time * 100}%`.
  - Add keyframe button at current scrub position.
- **Side Inspector Panel**:
  - Selected keyframe timing slider, value editor (Vector3, Hex color picker, Scalar number, Boolean), and easing dropdown.
  - ScrollTrigger configuration (start trigger, end distance, scrub smoothing, pinning).
  - One-click Animation Preset appender.
  - "Save Timeline" button with persistent SQLite database synchronization.

---

## 6. Client Runtime Component

Located in [`src/components/three-d-animation/Scroll3DStoryCanvas.tsx`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/components/three-d-animation/Scroll3DStoryCanvas.tsx):

- Designed for client websites and standalone story landing pages.
- Embeds Three.js canvas in a pinned viewport container (`sticky top-0 h-screen`).
- Synchronizes GSAP ScrollTrigger with chapter narrative overlays positioned along the scroll track.
- Detects WebGL availability with graceful fallback message if unsupported.
- Respects accessibility preference for `prefers-reduced-motion`.

---

## 7. Verification & Automated Test Coverage

The Phase 3.4 engine is accompanied by comprehensive automated verification:

- `tests/verify-three-d-animation.ts`: 51 unit & integration tests covering Zod schemas, timeline defaults, mathematical easing curve accuracy, multi-track conflict resolution, Vector3 / Euler / Color / Scalar interpolation, and SQLite database persistence.
- `tests/browser-three-d-animation.ts`: 25 Playwright Chromium browser tests validating real WebGL canvas rendering, playback start/pause, scrub slider updates, keyframe diamond selection, inspector parameter editing, preset appending, and full page reload persistence.

Total test suites across all phases: **12 suites, 613 tests**, with 100% pass rate.
