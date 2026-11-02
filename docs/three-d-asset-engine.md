# Phase 3.2 — Real 3D Asset Management & GLTF Model Loading Engine
## Production Architecture & Operational Specification

This document details the architecture, server-side security validation, asset ingestion pipeline, normalization engine, and client-side WebGL rendering system for 3D assets in the **Agency Website Engine**.

---

## 1. Supported 3D Formats & Specifications

The 3D Asset Engine provides native support for the Khronos glTF 2.0 open standard:

| Format | Extension | MIME Type | Maximum Budget | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **glTF 2.0 Binary** | `.glb` | `model/gltf-binary` | 50 MB | Self-contained production asset (meshes, materials, embedded textures, and Draco buffer). |
| **glTF 2.0 JSON** | `.gltf` | `model/gltf+json` | 50 MB | Structured glTF hierarchy with base64 embedded data URIs (`data:application/octet-stream;base64,...`). |

---

## 2. Server-Side Security & Validation Engine (`ModelAssetValidator`)

Located in [`src/modules/three-d/assets/validator.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/assets/validator.ts), all uploaded 3D assets undergo multi-layer inspection before touching disk storage:

### 2.1. GLB Binary Container Validation
- **Magic Byte Verification**: Verifies the 4-byte little-endian header is `0x46546C67` (`"glTF"` in ASCII). Rejects non-glTF or spoofed binaries.
- **Specification Version**: Enforces version `2`. glTF 1.0 is deprecated and rejected.
- **Length Consistency Check**: Reads the declared 32-bit total container length and compares it against the physical buffer byte length to detect truncated or corrupted files.
- **Chunk 0 Integrity**: Inspects the first chunk header; ensures chunk type is `0x4E4F534A` (`"JSON"`) and validates embedded scene JSON against UTF-8 parsing errors.

### 2.2. glTF JSON Schema & Boundary Protection
- **Asset Descriptor**: Asserts the root contains a valid `asset.version` starting with `"2."`.
- **Path Traversal Shield**: Inspects all `buffers[].uri` and `images[].uri` fields. Rejects any string containing `..`, `\`, or starting with `/` to prevent directory traversal attacks.
- **SSRF & Network Boundary**: Disallows all external network protocols (`http:`, `https:`, `ftp:`, `file:`). Only internal relative assets or `data:` base64 URIs are permitted.

### 2.3. Automated Metadata Extraction
On successful validation, the engine extracts and persists structural metadata in SQLite `metadataJson`:
- `format`: `"glb"` or `"gltf"`
- `meshCount`: Total primitives and meshes
- `materialCount`: Total PBR material definitions
- `animationCount`: Skeletal or keyframe tracks
- `dracoCompressed`: Boolean flag detecting `KHR_draco_mesh_compression`
- `extensionsUsed`: List of active glTF extensions

---

## 3. Local Draco Mesh Compression Pipeline

To ensure the engine functions 100% offline without relying on third-party CDNs (e.g., Google or jsDelivr), the Draco WASM decoders are bundled locally in the application's public root:

- `public/draco/gltf/draco_decoder.js`
- `public/draco/gltf/draco_decoder.wasm`
- `public/draco/gltf/draco_wasm_wrapper.js`

Three.js `DRACOLoader` is automatically initialized with `/draco/gltf/` across all loader instances, allowing compressed models to decode at native WASM speed.

---

## 4. Model Normalization Engine (`ThreeDModelNormalizer`)

Located in [`src/modules/three-d/assets/normalizer.ts`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/modules/three-d/assets/normalizer.ts):

In real client projects, raw 3D models from Blender, Maya, or CAD software frequently arrive at arbitrary scales (e.g., centimeters vs. meters) or with off-center pivots. The normalization engine automatically standardizes all loaded models:

1. **World Matrix Recalculation**: Forces `root.updateMatrixWorld(true)` across the entire object hierarchy.
2. **Bounding Box Analysis**: Calculates `THREE.Box3().setFromObject(root)`, extracting exact `size` vector and center point.
3. **Proportional Re-Scaling**: Computes `scaleFactor = targetDimension / max(size.x, size.y, size.z)` (default `2.0` units) and applies uniform scaling.
4. **Origin Centering**: Offsets `root.position` by `-center * scaleFactor` so the visual centroid aligns exactly at `(0, 0, 0)`.
5. **Shadow Activation**: Traverses all `THREE.Mesh` nodes, automatically setting `castShadow = true` and `receiveShadow = true`.
6. **Geometry Metrics**: Counts total vertex attributes and mesh nodes for diagnostic HUD reporting.

---

## 5. Interactive 3D Model Viewer (`<ModelViewer3D />`)

Located in [`src/components/three-d/ModelViewer3D.tsx`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/components/three-d/ModelViewer3D.tsx):

A production-ready client WebGL component built on Three.js:

- **OrbitControls Interaction**: Smooth spherical camera navigation with damping (`dampingFactor: 0.05`), distance zoom clamping (`minDistance: 1.0`, `maxDistance: 15.0`), and vertical rotation clamping (`maxPolarAngle: Math.PI / 2 + 0.1`).
- **Dynamic Lighting Presets**: Live switching between 5 curated studio presets:
  - `studio`: Balanced 3-point key/fill/rim with neutral ambient light.
  - `sunset`: Warm amber rim light with deep purple ambient tones.
  - `dramatic_neon`: High-contrast cyan/magenta split lighting.
  - `clinical_bright`: Clean medical/architectural white illumination.
  - `luxury_warm`: Subtle champagne tones with soft gold highlights.
- **Interactive Wireframe Toggle**: Dynamically flips material wireframe mode on all meshes without reloading geometry.
- **Auto-Rotation**: Smooth continuous turntable rotation toggle.
- **HUD Diagnostics**: Live overlay displaying model name, mesh count, vertex count, and interactive control shortcuts.
- **Responsive ResizeObserver**: Dynamically updates renderer size and camera aspect ratio on layout changes.
- **Complete Memory Cleanup**: Recursive disposal of geometries, textures, materials, and WebGL renderer context on unmount to eliminate GPU memory leaks.

---

## 6. Media Studio Integration

In [`src/components/media-studio/media-studio-view.tsx`](file:///c:/Users/minem/Desktop/AI-WEBSITE-BUILDER/agency-website-engine/src/components/media-studio/media-studio-view.tsx):

- **Dedicated 3D Models Tab**: Filter and manage 3D assets alongside images, videos, and frame sequences.
- **Assigned 3D Slots**:
  - `THREE_D_HERO_MODEL`: Primary 3D model rendered in the page hero.
  - `THREE_D_SHOWCASE_MODEL`: Interactive product or architecture showcase model.
  - `THREE_D_ENVIRONMENT_MAP`: HDR/EXR or equirectangular environment texture.
- **Exclusive Slot Enforcement**: Reassigning a slot clears it from any previously assigned asset to maintain deterministic state.
- **Interactive 3D Modal**: Clicking "Interactive 3D Preview" opens the `<ModelViewer3D />` inside a high-resolution modal, allowing directors and clients to inspect real geometry, wireframes, and lighting before publishing.

---

## 7. Verification & Test Suite

The 3D Asset Management & GLTF Model Loading engine is covered by automated test suites:

- `tests/verify-three-d-assets.ts`: 43 automated unit and integration tests verifying binary headers, glTF security traversal prevention, metadata extraction, model normalization, in-memory GLTF parsing, and SQLite storage persistence.
- `tests/browser-three-d.ts`: 15 Playwright Chromium browser tests verifying end-to-end Media Studio filtering, modal opening, WebGL `<canvas>` mounting, OrbitControls mouse dragging, HUD toggles, and zero uncaught exceptions.

