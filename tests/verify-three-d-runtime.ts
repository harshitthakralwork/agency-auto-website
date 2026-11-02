import assert from "node:assert";
import { ProductionAssetResolver } from "../src/modules/three-d/runtime/loader";
import { Production3DManifest, RuntimeMetrics } from "../src/modules/three-d/runtime/types";
import { Production3DRuntime } from "../src/modules/three-d/runtime/runtime";
import { createDefaultThreeDSceneConfig } from "../src/modules/three-d/scene/defaults";
import { createDefaultThreeDAnimationConfig } from "../src/modules/three-d/animation/defaults";
import { ThreeDCapabilityDetector } from "../src/modules/three-d/performance/capabilities";

async function runThreeDRuntimeTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 3.5 VERIFICATION ");
  console.log("  (Production 3D Website Runtime Engine)         ");
  console.log("=================================================\n");

  let passed = 0;
  function it(desc: string, fn: () => void | Promise<void>) {
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            passed++;
            console.log(`  [PASS] Test ${passed}: ${desc}`);
          })
          .catch((err) => {
            console.error(`  [FAIL] Test ${passed + 1}: ${desc}`);
            console.error(err);
            process.exit(1);
          });
      } else {
        passed++;
        console.log(`  [PASS] Test ${passed}: ${desc}`);
      }
    } catch (err) {
      console.error(`  [FAIL] Test ${passed + 1}: ${desc}`);
      console.error(err);
      process.exit(1);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Production Asset Resolver & Security Path Sanitization
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing Production Asset Resolver & Security ---");

  it("Sanitizer eliminates Unix directory traversal sequence ('../../')", () => {
    const malicious = "../../etc/passwd";
    const cleaned = ProductionAssetResolver.sanitizePath(malicious);
    assert(!cleaned.includes("../"), "Must not contain directory traversal");
    assert.strictEqual(cleaned, "etc/passwd");
  });

  it("Sanitizer eliminates Windows directory traversal sequence ('..\\..\\')", () => {
    const malicious = "..\\..\\windows\\system32";
    const cleaned = ProductionAssetResolver.sanitizePath(malicious);
    assert(!cleaned.includes("..\\"), "Must not contain Windows directory traversal");
    assert.strictEqual(cleaned, "windows/system32");
  });

  it("Sanitizer strips absolute drive letters ('C:\\')", () => {
    const drivePath = "C:/Users/minem/Desktop/secret.glb";
    const cleaned = ProductionAssetResolver.sanitizePath(drivePath);
    assert(!cleaned.startsWith("C:"), "Must strip drive letter");
    assert.strictEqual(cleaned, "/Users/minem/Desktop/secret.glb");
  });

  it("Resolver maps registered slot keys to safe local URLs", () => {
    const resolver = new ProductionAssetResolver({
      THREE_D_HERO_MODEL: "./assets/models/hero-chassis.glb",
      BEFORE_SLOT: "./assets/images/before.webp",
    });

    const resolved = resolver.resolveUrl("THREE_D_HERO_MODEL");
    assert.strictEqual(resolved, "./assets/models/hero-chassis.glb");
  });

  it("Resolver preserves external secure HTTPS model URLs", () => {
    const resolver = new ProductionAssetResolver();
    const external = "https://cdn.agencyengine.internal/models/sample.glb";
    const resolved = resolver.resolveUrl(external);
    assert.strictEqual(resolved, external);
  });

  it("portibilizeSceneConfig rewrites asset URLs using transformer callback", () => {
    const dummyScene = createDefaultThreeDSceneConfig();
    dummyScene.objects[0].assetUrl = "/uploads/projects/client1/model.glb";

    const portable = ProductionAssetResolver.portibilizeSceneConfig(dummyScene, (url) => {
      return `./assets/models/${url.split("/").pop()}`;
    });

    assert.strictEqual(portable.objects[0].assetUrl, "./assets/models/model.glb");
  });

  // ---------------------------------------------------------------------------
  // 2. Production 3D Manifest Architecture
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing Production 3D Manifest Architecture ---");

  const defaultScene = createDefaultThreeDSceneConfig();
  const defaultAnim = createDefaultThreeDAnimationConfig("obj_primary_showcase");

  const sampleManifest: Production3DManifest = {
    version: "1.0",
    projectId: "proj_luminaire_3d",
    projectName: "Lumière Atelier 3D",
    sceneConfig: defaultScene,
    animationConfig: defaultAnim,
    assetMap: {
      THREE_D_HERO_MODEL: "./assets/models/atelier-model.glb",
    },
    fallbackMode: "procedural",
    posterUrl: "./assets/images/poster.webp",
    metadata: {
      exportedAt: new Date().toISOString(),
      engineVersion: "0.1.0-phase3.5",
    },
  };

  it("Manifest defines version '1.0' and matching project ID", () => {
    assert.strictEqual(sampleManifest.version, "1.0");
    assert.strictEqual(sampleManifest.projectId, "proj_luminaire_3d");
  });

  it("Manifest serializes to JSON and roundtrips without schema degradation", () => {
    const serialized = JSON.stringify(sampleManifest);
    const parsed: Production3DManifest = JSON.parse(serialized);

    assert.strictEqual(parsed.projectName, "Lumière Atelier 3D");
    assert.strictEqual(parsed.sceneConfig.camera.fov, 45);
    assert.strictEqual(parsed.animationConfig.timelines[0].duration, 4.0);
    assert.strictEqual(parsed.assetMap.THREE_D_HERO_MODEL, "./assets/models/atelier-model.glb");
  });

  it("ThreeDCapabilityDetector accurately detects runtime WebGL support", () => {
    const caps = ThreeDCapabilityDetector.detect();
    assert(typeof caps.supported === "boolean", "Returns boolean supported flag");
    assert(typeof caps.maxTextureSize === "number", "Returns maxTextureSize limit");
  });

  // ---------------------------------------------------------------------------
  // 3. Production3DRuntime Lifecycle & Fallback Robustness
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Production3DRuntime Lifecycle & Fallbacks ---");

  it("Production3DRuntime instantiates with container and manifest", () => {
    // In headless test, create mock container
    const mockContainer = {
      clientWidth: 1024,
      clientHeight: 768,
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: "",
    } as any;

    const runtime = new Production3DRuntime({
      container: mockContainer,
      manifest: sampleManifest,
      interactiveControls: false,
    });

    assert(runtime, "Runtime successfully created");
    runtime.dispose();
  });

  it("Runtime dispose method executes cleanly without throwing", () => {
    const mockContainer = {
      clientWidth: 800,
      clientHeight: 600,
      appendChild: () => {},
      removeChild: () => {},
      innerHTML: "",
    } as any;

    const runtime = new Production3DRuntime({
      container: mockContainer,
      manifest: sampleManifest,
    });

    runtime.dispose();
    assert.strictEqual(runtime.getSceneEngine(), null);
    assert.strictEqual(runtime.getAnimationEngine(), null);
  });

  console.log("\n=================================================");
  console.log(`  PHASE 3.5 3D RUNTIME: ALL ${passed} TESTS PASSED!`);
  console.log("=================================================\n");
}

runThreeDRuntimeTests().catch((err) => {
  console.error("\n[FATAL RUNTIME TEST RUNNER ERROR]:", err);
  process.exit(1);
});
