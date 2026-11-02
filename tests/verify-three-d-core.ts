import * as THREE from "three";
import {
  ThreeDScene,
  ThreeDCamera,
  ThreeDRenderer,
  ThreeDAnimationLoop,
  ThreeDDisposal,
  Procedural3DArchetypes,
  ThreeDLightingPresets,
  ThreeDCapabilityDetector,
} from "../src/modules/three-d";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runThreeDCoreTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 3.1 VERIFICATION ");
  console.log("  (3D Core & WebGL Foundation Engine)            ");
  console.log("=================================================\n");

  // -------------------------------------------------------------
  // 1. Three.js Revision and Core Type Integration
  // -------------------------------------------------------------
  console.log("--- 1. Testing Three.js Revision & Environment Integration ---");
  assert(typeof THREE.REVISION === "string" && Number(THREE.REVISION) >= 170, `Three.js installed and verified (Revision: ${THREE.REVISION})`);
  assert(typeof THREE.Scene === "function", "THREE.Scene class is exported and functional");
  assert(typeof THREE.PerspectiveCamera === "function", "THREE.PerspectiveCamera is exported and functional");
  assert(typeof THREE.WebGLRenderer === "function", "THREE.WebGLRenderer is exported and functional");

  // -------------------------------------------------------------
  // 2. Scene Graph Creation & Background Handling
  // -------------------------------------------------------------
  console.log("\n--- 2. Testing Scene Graph Management & Fog ---");
  const transparentScene = ThreeDScene.create({ transparent: true });
  assert(transparentScene.background === null, "Transparent scene initializes with null background");

  const coloredScene = ThreeDScene.create({ backgroundColor: "#0f172a" });
  assert(coloredScene.background instanceof THREE.Color, "Colored scene initializes with THREE.Color background");
  assert((coloredScene.background as THREE.Color)?.getHexString() === "0f172a", "Background hex color matches requested #0f172a");

  ThreeDScene.setBackground(coloredScene, null);
  assert(coloredScene.background === null, "Dynamic background clearing successfully switches to transparent");

  const fogScene = ThreeDScene.create({ fogColor: "#1e1b4b", fogNear: 5, fogFar: 30 });
  assert(fogScene.fog instanceof THREE.Fog, "Atmospheric fog initialized successfully");
  assert((fogScene.fog as THREE.Fog).near === 5 && (fogScene.fog as THREE.Fog).far === 30, "Fog near/far clipping planes match specifications");

  // -------------------------------------------------------------
  // 3. Camera Projection & Aspect Ratio Dynamics
  // -------------------------------------------------------------
  console.log("\n--- 3. Testing Perspective Camera & Projection Matrices ---");
  const camera = ThreeDCamera.create(1920, 1080, { fov: 50, position: [0, 2, 5], target: [0, 0, 0] });
  assert(camera.fov === 50, "Camera FOV correctly set to 50 degrees");
  assert(Math.abs(camera.aspect - (1920 / 1080)) < 0.001, "Camera aspect ratio matches 1920x1080 viewport");
  assert(camera.position.x === 0 && camera.position.y === 2 && camera.position.z === 5, "Camera initial position set to [0, 2, 5]");

  ThreeDCamera.updateAspect(camera, 375, 667);
  assert(Math.abs(camera.aspect - (375 / 667)) < 0.001, "Aspect ratio dynamically updated for mobile viewport (375x667)");

  // -------------------------------------------------------------
  // 4. Procedural 3D Archetypes & Geometry Rigging
  // -------------------------------------------------------------
  console.log("\n--- 4. Testing Procedural 3D Archetypes & Materials ---");
  // Archetype 1: product_model
  const productGroup = Procedural3DArchetypes.create("product_model", { color: "#ec4899", wireframe: false });
  assert(productGroup.children.length === 2, "Product model archetype contains body and cap meshes");
  const bodyMesh = productGroup.children[0] as THREE.Mesh;
  assert(bodyMesh.geometry instanceof THREE.CylinderGeometry, "Product body uses CylinderGeometry");
  assert(bodyMesh.material instanceof THREE.MeshPhysicalMaterial, "Product body uses MeshPhysicalMaterial with transmission");

  // Archetype 2: hero_floating_object
  const knotGroup = Procedural3DArchetypes.create("hero_floating_object", { color: "#6366f1", wireframe: true });
  assert(knotGroup.children.length === 1, "Floating hero archetype contains 1 primary mesh");
  const knotMesh = knotGroup.children[0] as THREE.Mesh;
  assert(knotMesh.geometry instanceof THREE.TorusKnotGeometry, "Floating hero uses TorusKnotGeometry");
  assert((knotMesh.material as THREE.MeshStandardMaterial).wireframe === true, "Wireframe mode correctly applied to Torus Knot");

  // Archetype 3: spatial_environment
  const spatialGroup = Procedural3DArchetypes.create("spatial_environment", { color: "#3b82f6" });
  assert(spatialGroup.children.length >= 3, "Spatial environment includes floor plane and pedestal columns");

  // Archetype 4: interactive_particles
  const particleGroup = Procedural3DArchetypes.create("interactive_particles", { color: "#06b6d4" });
  assert(particleGroup.children.length === 1, "Particle archetype created points group");
  const points = particleGroup.children[0] as THREE.Points;
  assert(points.geometry.getAttribute("position").count === 1500, "Particle sphere contains exactly 1500 spatial points");

  // Archetype 5: none
  const emptyGroup = Procedural3DArchetypes.create("none");
  assert(emptyGroup.children.length === 0, "Archetype 'none' produces clean empty container");

  // -------------------------------------------------------------
  // 5. Lighting Environment Rigs & Color Vectors
  // -------------------------------------------------------------
  console.log("\n--- 5. Testing Lighting Environment Rigs (All 5 Presets) ---");
  const presets = ["studio", "sunset", "dramatic_neon", "clinical_bright", "luxury_warm"] as const;

  for (const p of presets) {
    const rig = ThreeDLightingPresets.createRig(p);
    assert(rig.lightsGroup.children.length >= 3, `Lighting preset '${p}' generates at least 3 active lights`);
    assert(rig.ambientLight instanceof THREE.AmbientLight, `Preset '${p}' includes AmbientLight`);
    assert(rig.keyLight instanceof THREE.DirectionalLight, `Preset '${p}' includes Key DirectionalLight`);
    assert(rig.keyLight.castShadow === true, `Preset '${p}' key light enables shadow casting`);
  }

  // Specific color validation
  const neonRig = ThreeDLightingPresets.createRig("dramatic_neon");
  assert(neonRig.keyLight.color.getHexString() === "06b6d4", "Dramatic neon key light has electric cyan hex (#06b6d4)");
  assert(neonRig.fillLight?.color.getHexString() === "ec4899", "Dramatic neon fill light has magenta hex (#ec4899)");

  const sunsetRig = ThreeDLightingPresets.createRig("sunset");
  assert(sunsetRig.keyLight.color.getHexString() === "f59e0b", "Sunset key light has warm amber hex (#f59e0b)");

  // -------------------------------------------------------------
  // 6. Recursive Disposal Engine (Zero Memory Leaks)
  // -------------------------------------------------------------
  console.log("\n--- 6. Testing Recursive Memory Disposal Engine ---");
  const testRoot = new THREE.Group();
  let geomDisposed = false as boolean;
  let matDisposed = false as boolean;

  const testGeo = new THREE.BoxGeometry(1, 1, 1);
  testGeo.addEventListener("dispose", () => {
    geomDisposed = true;
  });

  const testMat = new THREE.MeshStandardMaterial({ color: "#ffffff" });
  testMat.addEventListener("dispose", () => {
    matDisposed = true;
  });

  const testMesh = new THREE.Mesh(testGeo, testMat);
  testRoot.add(testMesh);

  const stats = ThreeDDisposal.disposeObject(testRoot);
  assert(stats.geometriesDisposed >= 1, "Disposal engine reported geometry disposal");
  assert(stats.materialsDisposed >= 1, "Disposal engine reported material disposal");
  assert(geomDisposed === true, "Geometry .dispose() event fired successfully");
  assert(matDisposed === true, "Material .dispose() event fired successfully");
  assert(testRoot.children.length === 0, "All children unlinked and detached from root node");

  // -------------------------------------------------------------
  // 7. Performance Budget Safeguards
  // -------------------------------------------------------------
  console.log("\n--- 7. Testing Performance Budgets & Device Protections ---");
  assert(ThreeDRenderer.DEFAULT_BUDGET.maxDpr === 2.0, "DPR upper bound clamped to 2.0 for GPU memory safety");
  assert(ThreeDRenderer.DEFAULT_BUDGET.antialias === true, "Desktop antialiasing enabled by default");
  assert(ThreeDRenderer.DEFAULT_BUDGET.maxTextureSize === 2048, "Texture size budget capped at 2048px");

  // -------------------------------------------------------------
  // 8. WebGL Capability Detection & Server Safeguards
  // -------------------------------------------------------------
  console.log("\n--- 8. Testing WebGL Capability Detection ---");
  const caps = ThreeDCapabilityDetector.detect();
  assert(typeof caps.supported === "boolean", "Capability detection returns boolean supported flag");
  assert(typeof caps.isLowEndDevice === "boolean", "Capability detection evaluates low-end device heuristic");
  assert(typeof caps.maxTextureSize === "number", "Capability detection queries max texture dimension");

  // -------------------------------------------------------------
  // 9. Animation Loop & Subscription Engine
  // -------------------------------------------------------------
  console.log("\n--- 9. Testing Animation Loop Subscriptions & FPS Tracking ---");
  const loop = new ThreeDAnimationLoop();
  assert(loop.getIsRunning() === false, "Animation loop initialized in stopped state");

  let tickCount = 0;
  const unsubscribe = loop.subscribe((delta) => {
    tickCount++;
  });

  assert(typeof unsubscribe === "function", "Loop subscription returns unsubscribe cleanup function");
  unsubscribe();
  assert(loop.getFps() >= 0, "FPS query returns valid frame rate metric");

  console.log("\n=================================================");
  console.log(`  PHASE 3.1 3D CORE ENGINE: ${passedCount}/${totalCount} TESTS PASSED`);
  console.log("=================================================");
}

runThreeDCoreTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
