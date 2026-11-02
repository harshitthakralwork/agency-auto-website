# Phase 3.5 — Production 3D Website Runtime & Integration
## Architecture, Reusable Client Runtime & Standalone Website Export Specification

This document details the architecture, manifest structure, asset portability rules, fallback mechanisms, standalone export pipeline, and verification gates for **Phase 3.5** in the **Agency Website Engine**.

---

## 1. Architectural Overview & Objective

Phase 3.5 bridges the gap between internal agency authoring tools (Phase 3.1–3.4) and independent, production-grade client websites. Prior to Phase 3.5, 3D scenes and timelines could only be viewed within the internal dashboard. Phase 3.5 delivers:

1. **Reusable Production 3D Runtime (`Production3DRuntime`)**: A lightweight, self-contained TypeScript engine that consumes a `Production3DManifest` and orchestrates WebGL rendering, asset resolution, GSAP ScrollTrigger evaluation, and single-RAF updates with zero dependencies on agency dashboard APIs.
2. **Next.js Live Preview Integration (`Production3DCanvas`)**: Genuine 3D WebGL rendering embedded directly inside the `/projects/[id]/preview` route for `IMMERSIVE_3D` tier projects, replacing mockups with live scroll-driven narrative storytelling.
3. **Standalone Website Export Engine (`WebsiteExportEngine`)**: A zero-configuration compilation engine producing clean, static HTML5/CSS3/ES6 sites with local `./vendor/` dependencies (Three.js module, GLTFLoader, GSAP, ScrollTrigger), fully remapped relative `./assets/` paths, and zero external CDN or SQLite requirements.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Agency Website Engine                           │
│                             Phase 3.5                                  │
├────────────────────────────────────────────────────────────────────────┤
│                       AUTHORING & ORCHESTRATION                        │
│                                                                        │
│   Project Asset Store     Design Studio & Presets    3D Timeline Studio │
│   (GLB/GLTF Models,        (Color, Font, Spacing,     (Keyframes, Ease, │
│    Textures, Posters)       Layout, ExperienceTier)    Camera, Lights) │
│            │                          │                       │        │
│            └──────────────────────────┼───────────────────────┘        │
│                                       ▼                                │
│                     Production 3D Manifest Generator                   │
│                                       │                                │
│                   ┌───────────────────┴───────────────────┐            │
│                   ▼                                       ▼            │
│       [1. Internal Preview Runtime]           [2. Standalone Export]   │
│       - `Production3DCanvas`                  - `WebsiteExportEngine`  │
│       - `/projects/[id]/preview`              - `dist/export/`         │
│       - Sticky Pinned WebGL Canvas            - `index.html`           │
│       - GSAP ScrollTrigger Scrub              - `style.css`            │
│       - Responsive Viewport Constraints       - `runtime.js`           │
│       - Fallback to Procedural Archetype      - `./vendor/` Bundle     │
│                                               - `./assets/` Remapped   │
│                                               - Zero CDN Dependency    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Production 3D Manifest Architecture

Located in [`src/modules/three-d/runtime/types.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/runtime/types.ts).

The manifest is the serializable, immutable contract describing the complete 3D experience:

```typescript
export interface Production3DManifest {
  version: "1.0";
  projectId: string;
  projectName: string;
  sceneConfig: ThreeDSceneConfig;
  animationConfig: ThreeDAnimationConfig;
  assetMap: Record<string, string>;
  posterUrl?: string;
  fallbackMode: "poster" | "procedural" | "silent";
  metadata?: {
    exportedAt: string;
    engineVersion: string;
    targetDpr?: number;
  };
}
```

### Key Contract Guarantees
- **Self-Sufficiency**: Contains all lighting rigs, camera matrices, material parameters, and animation tracks.
- **Portability**: The `assetMap` decouples internal server asset paths (`/uploads/projects/...`) from client-facing paths (`./assets/models/...`).
- **Resilience**: Specifies fallback strategies (`procedural` or `poster`) if client WebGL hardware acceleration is disabled.

---

## 3. Production Asset Resolver & Security

Located in [`src/modules/three-d/runtime/loader.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/runtime/loader.ts).

The `ProductionAssetResolver` is responsible for translating asset references and preventing malicious path traversal:

```typescript
export class ProductionAssetResolver {
  // Strips Unix traversal sequences (../), Windows backslashes (..\), and drive letters (C:)
  static sanitizePath(input: string): string { ... }

  // Translates slots or relative paths via manifest assetMap
  resolveUrl(assetRef: string): string { ... }

  // Deeply rewrites all object assetUrls inside scene configuration
  static portibilizeSceneConfig(config: ThreeDSceneConfig, transformUrl: (url: string) => string): ThreeDSceneConfig { ... }
}
```

---

## 4. Reusable Production 3D Runtime

Located in [`src/modules/three-d/runtime/runtime.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/runtime/runtime.ts).

The `Production3DRuntime` coordinates:
1. **Hardware Capability Probing**: Probes WebGL 1/2 contexts before attempting initialization. Falls back non-destructively if unavailable.
2. **Context Loss & Restoration**: Hooks into `webglcontextlost` and `webglcontextrestored` events to pause execution and rebuild the scene graph without page reloads.
3. **Single Animation Loop**: Ensures exactly one active RAF loop drives rendering and GSAP timeline interpolation.
4. **Graceful Model Fallback**: If an uploaded GLB file is missing or 404s, the runtime catches the failure and seamlessly substitutes an archetype procedural mesh so client websites never break.
5. **Strict Teardown (`dispose()`)**: Frees WebGL render targets, unlinks geometry/materials, disconnects window listeners, and releases ScrollTrigger pins cleanly.

---

## 5. Standalone Website Export Pipeline

Located in [`src/modules/export/engine.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/export/engine.ts).

### Export Engine Responsibilities:
1. **Zero External CDN Dependency**:
   - Copies `three.module.js` and `three.core.js` into `./vendor/`.
   - Copies `GLTFLoader.js`, `BufferGeometryUtils.js`, and `SkeletonUtils.js` into `./vendor/jsm/`.
   - Copies `gsap.min.js` and `ScrollTrigger.min.js` into `./vendor/`.
2. **Asset Packaging**:
   - Collects all referenced GLB/GLTF models, images, and videos into `./assets/models/`, `./assets/images/`, and `./assets/videos/`.
   - Re-writes model URLs in `site-manifest.json` and `runtime.js` to relative paths (`./assets/models/...`).
3. **Native ES Module Resolution**:
   - Uses `<script type="importmap">` in `index.html` to map `"three"` to `./vendor/three.module.js` and `"three/addons/"` to `./vendor/jsm/`, allowing modern browsers to execute unbundled ES modules natively offline.
4. **Standalone Client Runtime (`runtime.js`)**:
   - Pure ES6 class `Standalone3DRuntime` that boots on `DOMContentLoaded` or immediately if DOM is ready.
   - Binds to GSAP ScrollTrigger to interpolate object rotation, camera positions, lighting, and progress bars smoothly across scroll.

---

## 6. End-to-End Verification Suites

Three comprehensive verification suites guard the Phase 3.5 deliverables:

| Test Suite | Purpose | Tests | Status |
|---|---|---|---|
| `tests/verify-three-d-runtime.ts` | Unit tests for Asset Resolver, Path Sanitization, Manifest roundtripping, Capability detector | 11 | **PASSED** |
| `tests/browser-three-d-runtime.ts` | Playwright E2E testing Next.js Live Preview (`/projects/[id]/preview`), canvas mount, sticky scroll, and mobile/tablet constraints | 10 | **PASSED** |
| `tests/verify-website-export.ts` | End-to-end export generation, independent Node HTTP server on port 4005, Playwright canvas test, zero external requests, scrub verification | 22 | **PASSED** |

### Complete Regression Baseline
In addition to the 3 new suites, all previous phase suites continue to pass:
- `verify-engine.ts` (102 tests passed)
- `verify-media-engine.ts` (37 tests passed)
- `verify-design-accuracy.ts` (82 tests passed)
- `verify-cinematic-engine.ts` (71 tests passed)
- `verify-three-d-core.ts` (61 tests passed)
- `verify-three-d-assets.ts` (43 tests passed)
- `verify-three-d-scene.ts` (85 tests passed)
- `verify-three-d-animation.ts` (51 tests passed)

Total verified test footprint across engine: **553 automated tests passing**.
Next.js production build (`npm run build`): **0 TypeScript or compilation errors**.
