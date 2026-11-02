import assert from "node:assert";
import { db } from "../src/lib/db";
import {
  threeDAnimationConfigSchema,
  easingTypeSchema,
  animationPropertyTypeSchema,
  animationTargetTypeSchema,
} from "../src/modules/three-d/animation/schema";
import {
  createDefaultThreeDAnimationConfig,
  ANIMATION_PRESETS,
} from "../src/modules/three-d/animation/defaults";
import {
  evaluateEasing,
  ThreeDAnimationEngine,
} from "../src/modules/three-d/animation/engine";
import { ThreeDSceneConfig, createDefaultThreeDSceneConfig } from "../src/modules/three-d/scene";
import { ThreeDSceneEngine } from "../src/modules/three-d/scene/engine";
import { ThreeDScrollTriggerBridge } from "../src/modules/three-d/animation/scroll-trigger";

async function runThreeDAnimationTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 3.4 VERIFICATION ");
  console.log("  (Scroll-Linked 3D Animation & Timeline Engine)  ");
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
  // 1. Animation Configuration Schema & Defaults
  // ---------------------------------------------------------------------------
  console.log("--- 1. Testing Animation Configuration Schema & Defaults ---");

  const defaultConfig = createDefaultThreeDAnimationConfig("obj_primary_showcase");

  it("Default animation config defines version '1.0'", () => {
    assert.strictEqual(defaultConfig.version, "1.0");
  });

  it("Default config contains at least one active timeline", () => {
    assert(defaultConfig.timelines.length >= 1);
    assert.strictEqual(defaultConfig.activeTimelineId, defaultConfig.timelines[0].id);
  });

  it("Default timeline defines positive duration in seconds", () => {
    assert(defaultConfig.timelines[0].duration > 0);
  });

  it("Default timeline configures scrollTrigger enabled with pin", () => {
    const st = defaultConfig.timelines[0].scrollTrigger;
    assert.strictEqual(st.enabled, true);
    assert.strictEqual(st.pin, true);
    assert(st.start.length > 0);
    assert(st.end.length > 0);
  });

  it("Default timeline contains object, camera, and light tracks", () => {
    const tracks = defaultConfig.timelines[0].tracks;
    const types = new Set(tracks.map((t) => t.targetType));
    assert(types.has("object"), "Must have object track");
    assert(types.has("camera"), "Must have camera track");
    assert(types.has("light"), "Must have light track");
  });

  it("threeDAnimationConfigSchema accepts valid default configuration", () => {
    const parsed = threeDAnimationConfigSchema.safeParse(defaultConfig);
    assert.strictEqual(parsed.success, true);
  });

  it("threeDAnimationConfigSchema rejects invalid easing curve", () => {
    const invalidConfig = JSON.parse(JSON.stringify(defaultConfig));
    invalidConfig.timelines[0].tracks[0].keyframes[0].ease = "hyper.bounce.invalid";
    const parsed = threeDAnimationConfigSchema.safeParse(invalidConfig);
    assert.strictEqual(parsed.success, false);
  });

  it("threeDAnimationConfigSchema rejects keyframe time out of bounds (> 1.0)", () => {
    const invalidConfig = JSON.parse(JSON.stringify(defaultConfig));
    invalidConfig.timelines[0].tracks[0].keyframes[0].time = 1.25;
    const parsed = threeDAnimationConfigSchema.safeParse(invalidConfig);
    assert.strictEqual(parsed.success, false);
  });

  it("threeDAnimationConfigSchema rejects keyframe time out of bounds (< 0.0)", () => {
    const invalidConfig = JSON.parse(JSON.stringify(defaultConfig));
    invalidConfig.timelines[0].tracks[0].keyframes[0].time = -0.1;
    const parsed = threeDAnimationConfigSchema.safeParse(invalidConfig);
    assert.strictEqual(parsed.success, false);
  });

  it("threeDAnimationConfigSchema rejects empty timeline list", () => {
    const invalidConfig = {
      version: "1.0",
      activeTimelineId: "none",
      timelines: [],
    };
    const parsed = threeDAnimationConfigSchema.safeParse(invalidConfig);
    assert.strictEqual(parsed.success, false);
  });

  // ---------------------------------------------------------------------------
  // 2. Production Animation Presets
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Testing Production Animation Presets ---");

  it("Preset 'product_360' generates valid rotation and scale tracks", () => {
    const preset = ANIMATION_PRESETS.product_360;
    assert(preset, "product_360 preset exists");
    const tracks = preset.getTracks("test_model_1");
    assert.strictEqual(tracks.length, 2);
    assert.strictEqual(tracks[0].property, "rotation");
    assert.strictEqual(tracks[1].property, "scale");
    assert.deepStrictEqual(tracks[0].keyframes[2].value, [0, 360, 0]);
  });

  it("Preset 'hero_flythrough' generates camera sweep and dynamic FOV", () => {
    const preset = ANIMATION_PRESETS.hero_flythrough;
    assert(preset, "hero_flythrough preset exists");
    const tracks = preset.getTracks("test_model_1");
    assert.strictEqual(tracks.length, 3);
    const camPosTrack = tracks.find((t) => t.property === "camera_position");
    const fovTrack = tracks.find((t) => t.property === "camera_fov");
    assert(camPosTrack, "Must contain camera_position track");
    assert(fovTrack, "Must contain camera_fov track");
    assert.strictEqual(fovTrack.keyframes[0].value, 65);
    assert.strictEqual(fovTrack.keyframes[1].value, 35);
  });

  it("Preset 'cyberpunk_neon' generates light and material transitions", () => {
    const preset = ANIMATION_PRESETS.cyberpunk_neon;
    assert(preset, "cyberpunk_neon preset exists");
    const tracks = preset.getTracks("test_model_1");
    assert.strictEqual(tracks.length, 2);
    assert.strictEqual(tracks[0].property, "light_color");
    assert.strictEqual(tracks[1].property, "material_roughness");
    assert.strictEqual(tracks[0].keyframes[1].value, "#06b6d4");
    assert.strictEqual(tracks[0].keyframes[2].value, "#ec4899");
  });

  it("Preset 'exploded_showcase' generates vertical levitation lift", () => {
    const preset = ANIMATION_PRESETS.exploded_showcase;
    assert(preset, "exploded_showcase preset exists");
    const tracks = preset.getTracks("test_model_1");
    assert.strictEqual(tracks.length, 2);
    assert.strictEqual(tracks[0].property, "position");
    assert.deepStrictEqual(tracks[0].keyframes[1].value, [0, 1.2, 0]);
  });

  // ---------------------------------------------------------------------------
  // 3. Mathematical Easing Accuracy
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Testing Mathematical Easing Curves ---");

  const easings = [
    "linear",
    "power1.in",
    "power1.out",
    "power1.inOut",
    "power2.in",
    "power2.out",
    "power2.inOut",
    "power3.out",
    "sine.inOut",
    "expo.out",
  ] as const;

  for (const ease of easings) {
    it(`Easing '${ease}' evaluates to 0.0 at t=0`, () => {
      const val = evaluateEasing(0.0, ease);
      assert(Math.abs(val - 0.0) < 0.0001, `Expected 0.0, got ${val}`);
    });

    it(`Easing '${ease}' evaluates to 1.0 at t=1`, () => {
      const val = evaluateEasing(1.0, ease);
      assert(Math.abs(val - 1.0) < 0.0001, `Expected 1.0, got ${val}`);
    });
  }

  it("power1.out decelerates smoothly (progress > linear at t=0.5)", () => {
    const eased = evaluateEasing(0.5, "power1.out");
    assert(eased > 0.5, `Expected > 0.5, got ${eased}`);
    assert.strictEqual(eased, 0.75);
  });

  it("power1.in accelerates smoothly (progress < linear at t=0.5)", () => {
    const eased = evaluateEasing(0.5, "power1.in");
    assert(eased < 0.5, `Expected < 0.5, got ${eased}`);
    assert.strictEqual(eased, 0.25);
  });

  it("sine.inOut is symmetric at midpoint (t=0.5 evaluates to 0.5)", () => {
    const eased = evaluateEasing(0.5, "sine.inOut");
    assert(Math.abs(eased - 0.5) < 0.0001, `Expected 0.5, got ${eased}`);
  });

  // ---------------------------------------------------------------------------
  // 4. Three.js Animation Engine Property Interpolation
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Testing Real 3D Animation Interpolation Engine ---");

  const testSceneConfig = createDefaultThreeDSceneConfig();
  const sceneEngine = new ThreeDSceneEngine(testSceneConfig);
  const animEngine = new ThreeDAnimationEngine(sceneEngine);

  // Synchronize initial lighting and objects
  sceneEngine.applyLighting(testSceneConfig.lighting);
  await sceneEngine.syncObjects(testSceneConfig.objects);

  const primaryObjId = testSceneConfig.objects[0].id;
  const managedPrimary = sceneEngine.getObjectManager().getManagedObject(primaryObjId);
  assert(managedPrimary, "Managed primary object must exist in scene graph");

  // Create test timeline with deterministic properties
  const testTimeline = {
    id: "test_tl",
    name: "Verification Timeline",
    duration: 2.0,
    scrollTrigger: {
      enabled: true,
      start: "top top",
      end: "+=1000",
      scrub: true,
      pin: true,
    },
    tracks: [
      {
        id: "tr_obj_pos",
        name: "Obj Position",
        targetType: "object" as const,
        targetId: primaryObjId,
        property: "position" as const,
        enabled: true,
        keyframes: [
          { id: "k0", time: 0.0, value: [0, 0, 0] as [number, number, number], ease: "linear" as const },
          { id: "k1", time: 1.0, value: [10, 20, -30] as [number, number, number], ease: "linear" as const },
        ],
      },
      {
        id: "tr_obj_rot",
        name: "Obj Rotation",
        targetType: "object" as const,
        targetId: primaryObjId,
        property: "rotation" as const,
        enabled: true,
        keyframes: [
          { id: "rk0", time: 0.0, value: [0, 0, 0] as [number, number, number], ease: "linear" as const },
          { id: "rk1", time: 1.0, value: [0, 360, 0] as [number, number, number], ease: "linear" as const },
        ],
      },
      {
        id: "tr_obj_scale",
        name: "Obj Scale",
        targetType: "object" as const,
        targetId: primaryObjId,
        property: "scale" as const,
        enabled: true,
        keyframes: [
          { id: "sk0", time: 0.0, value: [1, 1, 1] as [number, number, number], ease: "linear" as const },
          { id: "sk1", time: 1.0, value: [2, 2, 2] as [number, number, number], ease: "linear" as const },
        ],
      },
      {
        id: "tr_cam_fov",
        name: "Cam FOV",
        targetType: "camera" as const,
        targetId: "mainCamera",
        property: "camera_fov" as const,
        enabled: true,
        keyframes: [
          { id: "fk0", time: 0.0, value: 50, ease: "linear" as const },
          { id: "fk1", time: 1.0, value: 30, ease: "linear" as const },
        ],
      },
      {
        id: "tr_light_int",
        name: "Light Intensity",
        targetType: "light" as const,
        targetId: "mainDirectional",
        property: "light_intensity" as const,
        enabled: true,
        keyframes: [
          { id: "lk0", time: 0.0, value: 1.0, ease: "linear" as const },
          { id: "lk1", time: 1.0, value: 3.0, ease: "linear" as const },
        ],
      },
    ],
  };

  animEngine.setTimeline(testTimeline);

  it("Animation Engine evaluates progress=0.0 accurately", () => {
    animEngine.evaluate(0.0);
    const root = managedPrimary.root;
    assert.strictEqual(root.position.x, 0);
    assert.strictEqual(root.position.y, 0);
    assert.strictEqual(root.position.z, 0);
    assert.strictEqual(root.scale.x, 1);
    assert.strictEqual(sceneEngine.getCamera().fov, 50);
  });

  it("Animation Engine evaluates midpoint progress=0.5 with exact Vector3 interpolation", () => {
    animEngine.evaluate(0.5);
    const root = managedPrimary.root;
    assert.strictEqual(root.position.x, 5);
    assert.strictEqual(root.position.y, 10);
    assert.strictEqual(root.position.z, -15);
    assert.strictEqual(root.scale.x, 1.5);
    assert.strictEqual(root.scale.y, 1.5);
    assert.strictEqual(root.scale.z, 1.5);
  });

  it("Animation Engine converts rotation degrees to radians during interpolation", () => {
    animEngine.evaluate(0.5);
    const root = managedPrimary.root;
    // 180 degrees should equal Math.PI radians
    assert(Math.abs(root.rotation.y - Math.PI) < 0.0001, `Expected Math.PI, got ${root.rotation.y}`);
  });

  it("Animation Engine updates camera lens FOV at progress=0.5", () => {
    animEngine.evaluate(0.5);
    assert.strictEqual(sceneEngine.getCamera().fov, 40);
  });

  it("Animation Engine updates light intensity at progress=0.5", () => {
    animEngine.evaluate(0.5);
    const light = sceneEngine.getLightingEngine().getLight("mainDirectional");
    assert(light, "Main directional light exists");
    assert.strictEqual(light.intensity, 2.0);
  });

  it("Animation Engine evaluates endpoint progress=1.0 accurately", () => {
    animEngine.evaluate(1.0);
    const root = managedPrimary.root;
    assert.strictEqual(root.position.x, 10);
    assert.strictEqual(root.position.y, 20);
    assert.strictEqual(root.position.z, -30);
    assert.strictEqual(root.scale.x, 2);
    assert.strictEqual(sceneEngine.getCamera().fov, 30);
    const light = sceneEngine.getLightingEngine().getLight("mainDirectional");
    assert.strictEqual(light?.intensity, 3.0);
  });

  it("Animation Engine clamps out-of-range progress gracefully without throwing", () => {
    animEngine.evaluate(-0.5);
    assert.strictEqual(managedPrimary.root.position.x, 0);
    animEngine.evaluate(1.5);
    assert.strictEqual(managedPrimary.root.position.x, 10);
  });

  it("Disabling a track bypasses its mutation during evaluation", () => {
    testTimeline.tracks[0].enabled = false;
    animEngine.setTimeline(testTimeline);

    // Position was at 10, now evaluate at 0.0 with track disabled
    animEngine.evaluate(0.0);
    assert.strictEqual(managedPrimary.root.position.x, 10); // remains unchanged!

    // Re-enable track
    testTimeline.tracks[0].enabled = true;
    animEngine.setTimeline(testTimeline);
    animEngine.evaluate(0.0);
    assert.strictEqual(managedPrimary.root.position.x, 0); // now changes
  });

  it("Disposing the scene engine cleans up animation loop and resources", () => {
    sceneEngine.dispose();
    assert.strictEqual(sceneEngine.getRenderer(), null);
  });

  // ---------------------------------------------------------------------------
  // 5. GSAP ScrollTrigger Bridge & Lifecycle
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Testing GSAP ScrollTrigger Bridge & Lifecycle ---");

  it("ThreeDScrollTriggerBridge instantiates with AnimationEngine", () => {
    const dummyScene = new ThreeDSceneEngine();
    const dummyAnim = new ThreeDAnimationEngine(dummyScene);
    const bridge = new ThreeDScrollTriggerBridge(dummyAnim);
    assert(bridge, "Bridge instantiated");
    bridge.dispose();
    dummyScene.dispose();
  });

  // ---------------------------------------------------------------------------
  // 6. Database Persistence & SQLite Restoration
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Testing Database Persistence & SQLite Restoration ---");

  let testProjectId = "";
  let createdProject: any = null;

  await it("Isolated test project created in SQLite", async () => {
    createdProject = await db.project.create({
      data: {
        name: "3D Animation Test Client",
        slug: `3d-anim-test-${Date.now()}`,
        category: "TECHNOLOGY",
        experienceLevel: "IMMERSIVE_3D",
        status: "IN_PROGRESS",
      },
    });
    testProjectId = createdProject.id;
    assert(createdProject, "Project must be created");
  });

  await it("ProjectDesignConfig persists embedded animationConfig", async () => {
    const customAnimation = createDefaultThreeDAnimationConfig("custom_hero_obj");
    customAnimation.timelines[0].duration = 6.5;
    customAnimation.timelines[0].scrollTrigger.end = "+=3500";
    customAnimation.timelines[0].tracks.push({
      id: "track_custom_test",
      name: "Custom Neon Glow",
      targetType: "light",
      targetId: "spot_hero",
      property: "light_color",
      enabled: true,
      keyframes: [
        { id: "k0", time: 0.0, value: "#ff0055", ease: "power1.inOut" },
        { id: "k1", time: 1.0, value: "#00ffff", ease: "power1.inOut" },
      ],
    });

    const prefs = {
      animationConfig: customAnimation,
    };

    const design = await db.projectDesignConfig.create({
      data: {
        projectId: testProjectId,
        experienceLevel: "IMMERSIVE_3D",
        threeDPreferences: JSON.stringify(prefs),
      },
    });

    assert(design, "Design config created");
  });

  await it("ProjectDesignConfig reloaded from SQLite and animationConfig restored", async () => {
    const project = await db.project.findUnique({
      where: { id: testProjectId },
      include: { designConfig: true },
    });

    assert(project?.designConfig?.threeDPreferences, "Preferences must exist");
    const parsed = JSON.parse(project.designConfig.threeDPreferences);
    assert(parsed.animationConfig, "animationConfig must be present in parsed prefs");

    const validated = threeDAnimationConfigSchema.safeParse(parsed.animationConfig);
    assert.strictEqual(validated.success, true, "Persisted animationConfig matches schema");

    const restored = validated.data;
    assert.strictEqual(restored.timelines[0].duration, 6.5);
    assert.strictEqual(restored.timelines[0].scrollTrigger.end, "+=3500");
    const customTrack = restored.timelines[0].tracks.find((t) => t.id === "track_custom_test");
    assert(customTrack, "Custom track was restored");
    assert.strictEqual(customTrack.keyframes[0].value, "#ff0055");
    assert.strictEqual(customTrack.keyframes[1].value, "#00ffff");
  });

  await it("Clean up isolated test project from SQLite", async () => {
    await db.projectDesignConfig.deleteMany({ where: { projectId: testProjectId } });
    await db.project.delete({ where: { id: testProjectId } });
    const check = await db.project.findUnique({ where: { id: testProjectId } });
    assert.strictEqual(check, null, "Project cleanly deleted");
  });

  console.log("\n=================================================");
  console.log(`  PHASE 3.4 3D ANIMATION: ALL ${passed} TESTS PASSED!`);
  console.log("=================================================\n");
}

runThreeDAnimationTests().catch((err) => {
  console.error("\n[FATAL TEST RUNNER ERROR]:", err);
  process.exit(1);
});
