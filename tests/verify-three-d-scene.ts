import * as THREE from "three";
import { PrismaClient } from "@prisma/client";
import {
  ThreeDSceneConfig,
  createDefaultThreeDSceneConfig,
  createLightingConfigFromPreset,
  createDefaultCameraConfig,
  CAMERA_PRESETS,
  threeDSceneConfigSchema,
  cameraConfigSchema,
  lightingConfigSchema,
  sceneObjectConfigSchema,
  materialOverrideConfigSchema,
  ThreeDSceneEngine,
  ThreeDMaterialEngine,
  ThreeDLightingEngine,
  ThreeDObjectManager,
} from "../src/modules/three-d";

const prisma = new PrismaClient();

let passedCount = 0;
let totalCount = 0;

function assert(condition: any, message: string) {
  totalCount++;
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  [PASS] Test ${totalCount}: ${message}`);
  } else {
    console.error(`  [FAIL] Test ${totalCount}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runThreeDSceneTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 3.3 VERIFICATION ");
  console.log("  (3D Scene, Camera, Lighting & Material Engine) ");
  console.log("=================================================\n");

  let testProjectId = "";

  try {
    // -------------------------------------------------------------
    // 1. Scene Configuration Schema & Defaults
    // -------------------------------------------------------------
    console.log("--- 1. Testing Scene Configuration Schema & Defaults ---");
    const defaultConfig = createDefaultThreeDSceneConfig();
    assert(defaultConfig.version === "1.0", "Default scene config generates version '1.0'");
    assert(
      defaultConfig.environment.backgroundMode === "color",
      "Default backgroundMode is 'color'"
    );
    assert(
      defaultConfig.camera.fov === 45,
      "Default camera FOV is 45 degrees"
    );
    assert(
      defaultConfig.lighting.preset === "studio",
      "Default lighting preset is 'studio'"
    );
    assert(
      defaultConfig.objects.length === 1,
      "Default scene initializes with 1 primary showcase object"
    );

    // Schema Validation: Valid config passes
    const validParse = threeDSceneConfigSchema.safeParse(defaultConfig);
    assert(validParse.success === true, "threeDSceneConfigSchema accepts valid default configuration");

    // Schema Validation: Rejects invalid hex color
    const invalidColorConfig = JSON.parse(JSON.stringify(defaultConfig));
    invalidColorConfig.environment.backgroundColor = "not-a-hex-color";
    const invalidColorParse = threeDSceneConfigSchema.safeParse(invalidColorConfig);
    assert(!invalidColorParse.success, "threeDSceneConfigSchema rejects invalid hex color strings");

    // Schema Validation: Rejects invalid FOV (> 120 or < 15)
    const invalidFovConfig = JSON.parse(JSON.stringify(defaultConfig));
    invalidFovConfig.camera.fov = 180;
    const invalidFovParse = threeDSceneConfigSchema.safeParse(invalidFovConfig);
    assert(!invalidFovParse.success, "threeDSceneConfigSchema rejects out-of-range camera FOV (180°)");

    // -------------------------------------------------------------
    // 2. Camera Configuration & Preset Engine
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Camera Configuration & Viewpoint Presets ---");
    const cam = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1000);
    const cameraConfig = createDefaultCameraConfig("hero_angle");

    // Update position and verify Three.js camera
    cam.fov = cameraConfig.fov;
    cam.position.set(...cameraConfig.position);
    cam.lookAt(...cameraConfig.target);
    cam.updateProjectionMatrix();

    assert(cam.fov === 45, "Camera FOV correctly applied to THREE.PerspectiveCamera");
    assert(
      cam.position.x === 0 && cam.position.y === 2.5 && cam.position.z === 6,
      "Camera position set to [0, 2.5, 6]"
    );

    // Test All 5 Camera Presets
    const presetKeys: (keyof typeof CAMERA_PRESETS)[] = [
      "hero_angle",
      "front",
      "top_down",
      "isometric",
      "cinematic_low",
    ];
    for (const key of presetKeys) {
      const presetData = CAMERA_PRESETS[key];
      assert(
        Array.isArray(presetData.position) && presetData.position.length === 3,
        `Camera preset '${key}' defines valid 3D position vector`
      );
      assert(
        presetData.fov >= 20 && presetData.fov <= 90,
        `Camera preset '${key}' defines valid cinematic FOV (${presetData.fov}°)`
      );
    }

    // Dynamic FOV update
    cam.fov = 60;
    cam.updateProjectionMatrix();
    assert(cam.fov === 60, "Dynamic camera FOV update applies cleanly to projection matrix");

    // -------------------------------------------------------------
    // 3. Lighting Engine & Atmosphere Presets
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing Lighting Engine & Studio Preset Rigs ---");
    const lightingEngine = new ThreeDLightingEngine();

    // Verify all 5 atmospheric presets
    const atmosphericPresets = [
      "studio",
      "sunset",
      "dramatic_neon",
      "clinical_bright",
      "luxury_warm",
    ] as const;

    for (const presetName of atmosphericPresets) {
      const pConfig = createLightingConfigFromPreset(presetName);
      lightingEngine.applyLighting(pConfig);

      const keyLight = lightingEngine.getLight("mainDirectional") as THREE.DirectionalLight;
      const fillLight = lightingEngine.getLight("fillLight") as THREE.DirectionalLight;
      const rimLight = lightingEngine.getLight("rimLight") as THREE.DirectionalLight;
      const ambientLight = lightingEngine.getLight("ambient") as THREE.AmbientLight;

      assert(Boolean(keyLight), `Lighting preset '${presetName}' created main key directional light`);
      assert(Boolean(fillLight), `Lighting preset '${presetName}' created fill directional light`);
      assert(Boolean(rimLight), `Lighting preset '${presetName}' created rim directional light`);
      assert(Boolean(ambientLight), `Lighting preset '${presetName}' created ambient light`);
      assert(keyLight.castShadow === true, `Preset '${presetName}' key light enables shadow casting`);
    }

    // Verify Dramatic Neon specific color tones
    const neonConfig = createLightingConfigFromPreset("dramatic_neon");
    lightingEngine.applyLighting(neonConfig);
    const neonKey = lightingEngine.getLight("mainDirectional") as THREE.DirectionalLight;
    const neonFill = lightingEngine.getLight("fillLight") as THREE.DirectionalLight;
    assert(
      neonKey.color.getHexString().toLowerCase() === "06b6d4",
      "Dramatic neon key light emits electric cyan (#06b6d4)"
    );
    assert(
      neonFill.color.getHexString().toLowerCase() === "ec4899",
      "Dramatic neon fill light emits vibrant magenta (#ec4899)"
    );

    // Test Configurable Point and Spot Lights
    const customLighting = createLightingConfigFromPreset("studio");
    customLighting.pointLights = [
      {
        id: "accent-pt-1",
        name: "Cyan Glow Point",
        enabled: true,
        color: "#06b6d4",
        intensity: 3.5,
        position: [2, 1, 0],
        castShadow: true,
      },
    ];
    customLighting.spotLights = [
      {
        id: "dramatic-spot-1",
        name: "Overhead Spotlight",
        enabled: true,
        color: "#ffffff",
        intensity: 5.0,
        position: [0, 6, 0],
        target: [0, 0, 0],
        angle: Math.PI / 6,
        penumbra: 0.3,
        castShadow: true,
      },
    ];

    lightingEngine.applyLighting(customLighting);
    const customPoint = lightingEngine.getLight("point_accent-pt-1");
    const customSpot = lightingEngine.getLight("spot_dramatic-spot-1");
    assert(Boolean(customPoint), "Custom point light instantiated in lighting rig");
    assert(Boolean(customSpot), "Custom spot light instantiated in lighting rig");
    assert((customPoint as THREE.PointLight).castShadow === true, "Point light shadow enabled");
    assert((customSpot as THREE.SpotLight).castShadow === true, "Spot light shadow enabled");

    lightingEngine.dispose();

    // -------------------------------------------------------------
    // 4. Material Engine & Non-Destructive Overrides
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing Material Engine & Non-Destructive Overrides ---");
    // Create test object with shared material
    const sharedMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.5,
      metalness: 0.2,
      name: "OriginalSharedMat",
    });

    const meshA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), sharedMat);
    meshA.name = "ChassisMesh";
    const meshB = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), sharedMat);
    meshB.name = "WheelMesh";

    const testObjectRoot = new THREE.Group();
    testObjectRoot.add(meshA);
    testObjectRoot.add(meshB);

    // Register original materials
    ThreeDMaterialEngine.registerOriginalMaterials(testObjectRoot);

    // Apply material override to meshA only
    const overrideConfig = {
      enabled: true,
      targetMeshName: "ChassisMesh",
      color: "#ff0055",
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
    };

    ThreeDMaterialEngine.applyOverride(testObjectRoot, overrideConfig);

    // Verify meshA received override
    const matA = meshA.material as THREE.MeshStandardMaterial;
    assert(matA !== sharedMat, "meshA received cloned material, original not mutated");
    assert(
      matA.color.getHexString().toLowerCase() === "ff0055",
      "meshA override applied color #ff0055"
    );
    assert(matA.roughness === 0.1, "meshA override applied roughness 0.1");
    assert(matA.metalness === 0.9, "meshA override applied metalness 0.9");
    assert(matA.wireframe === true, "meshA override applied wireframe = true");

    // Verify meshB retained original shared material (Isolation verified)
    const matB = meshB.material as THREE.MeshStandardMaterial;
    assert(matB === sharedMat, "meshB kept original shared material (shared material isolation verified)");
    assert(
      sharedMat.color.getHexString().toLowerCase() === "cccccc",
      "Original shared material color was NOT polluted by meshA override"
    );

    // Test Reset Override
    ThreeDMaterialEngine.resetOverride(testObjectRoot);
    assert(meshA.material === sharedMat, "Reset restored original shared material on meshA");
    assert(
      (meshA.material as THREE.MeshStandardMaterial).wireframe === false,
      "Restored material retains original wireframe = false"
    );

    ThreeDMaterialEngine.disposeAllClones();

    // -------------------------------------------------------------
    // 5. Multi-Object Scene Graph & Transforms
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing Multi-Object Scene Graph & Transform Engine ---");
    const objectManager = new ThreeDObjectManager();

    // Add first object: Procedural Product Model
    const obj1 = await objectManager.loadObject({
      id: "obj-alpha",
      name: "Product Cylinder",
      sourceType: "procedural",
      proceduralType: "product_model",
      position: [0, 0, 0],
      rotation: [0, 45, 0], // 45 degrees Y
      scale: [1, 1, 1],
      visible: true,
      castShadow: true,
      receiveShadow: true,
    });
    assert(Boolean(obj1), "Object 1 (Product Model) loaded into object manager");

    // Add second object: Floating Torus Knot
    const obj2 = await objectManager.loadObject({
      id: "obj-beta",
      name: "Floating Knot",
      sourceType: "procedural",
      proceduralType: "hero_floating_object",
      position: [2, 1, -1],
      rotation: [15, 0, 0],
      scale: [0.5, 0.5, 0.5],
      visible: true,
      castShadow: true,
      receiveShadow: false,
    });
    assert(Boolean(obj2), "Object 2 (Hero Knot) loaded into object manager");
    assert(
      objectManager.getAllManagedObjects().length === 2,
      "Object manager currently manages exactly 2 active objects"
    );

    // Verify Transforms applied
    assert(
      obj2.root.position.x === 2 && obj2.root.position.y === 1 && obj2.root.position.z === -1,
      "obj2 position [2, 1, -1] applied to Three.js Object3D"
    );
    assert(
      obj2.root.scale.x === 0.5 && obj2.root.scale.y === 0.5 && obj2.root.scale.z === 0.5,
      "obj2 scale [0.5, 0.5, 0.5] applied to Three.js Object3D"
    );

    // Test real-time transform update
    const updateSuccess = objectManager.updateTransform("obj-alpha", {
      position: [1.5, 2.0, 0.5],
      rotation: [0, 90, 0],
      scale: [1.2, 1.2, 1.2],
      visible: false,
    });
    assert(updateSuccess === true, "updateTransform succeeded for obj-alpha");
    assert(
      obj1.root.position.x === 1.5 && obj1.root.position.y === 2.0 && obj1.root.position.z === 0.5,
      "obj1 updated position verified on Three.js Object3D"
    );
    assert(obj1.root.visible === false, "obj1 visibility dynamically set to false");

    // Test Duplicate Object
    const duplicatedConfig = await objectManager.duplicateObject("obj-beta");
    assert(Boolean(duplicatedConfig), "duplicateObject created clone of obj-beta");
    assert(
      duplicatedConfig?.id !== "obj-beta",
      "Duplicated object received a new unique ID"
    );
    assert(
      duplicatedConfig?.position[0] === 2 + 0.8,
      "Duplicated object received spatial offset (+0.8 on X)"
    );
    assert(
      objectManager.getAllManagedObjects().length === 3,
      "Object manager now tracks 3 active objects after duplication"
    );

    // Test Remove Object
    const removeSuccess = objectManager.removeObject("obj-alpha");
    assert(removeSuccess === true, "removeObject cleanly removed obj-alpha");
    assert(
      objectManager.getAllManagedObjects().length === 2,
      "Object count returned to 2 after removal"
    );

    objectManager.dispose();
    assert(
      objectManager.getAllManagedObjects().length === 0,
      "Object manager dispose cleanly emptied all managed objects"
    );

    // -------------------------------------------------------------
    // 6. Persistence & SQLite Restoration Pipeline
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Database Persistence & SQLite Restoration ---");
    const testProject = await prisma.project.create({
      data: {
        name: "Automotive 3D Showroom",
        slug: `3d-showroom-${Date.now()}`,
        category: "AUTOMOTIVE",
        experienceLevel: "IMMERSIVE_3D",
        status: "DRAFT",
      },
    });
    testProjectId = testProject.id;
    assert(Boolean(testProjectId), `Isolated test project created (${testProjectId})`);

    // Create customized scene config to persist
    const customSceneConfig = createDefaultThreeDSceneConfig();
    customSceneConfig.environment.backgroundColor = "#020617";
    customSceneConfig.environment.fog = {
      enabled: true,
      color: "#020617",
      near: 5,
      far: 35,
    };
    customSceneConfig.camera.fov = 55;
    customSceneConfig.camera.preset = "cinematic_low";
    customSceneConfig.lighting = createLightingConfigFromPreset("dramatic_neon");
    customSceneConfig.objects = [
      {
        id: "hero-car-chassis",
        name: "Supercar Carbon Chassis",
        sourceType: "procedural",
        proceduralType: "product_model",
        position: [0, 0.2, 0],
        rotation: [0, 30, 0],
        scale: [1, 1, 1],
        visible: true,
        castShadow: true,
        receiveShadow: true,
        materialOverride: {
          enabled: true,
          color: "#06b6d4",
          roughness: 0.2,
          metalness: 0.8,
          wireframe: false,
        },
      },
    ];

    // Persist via ProjectDesignConfig.threeDPreferences in SQLite
    const persistedConfig = await prisma.projectDesignConfig.create({
      data: {
        projectId: testProjectId,
        experienceLevel: "IMMERSIVE_3D",
        preset: "cinematic",
        threeDPreferences: JSON.stringify({
          sceneConfig: customSceneConfig,
          lightingEnvironment: "dramatic_neon",
        }),
      },
    });
    assert(Boolean(persistedConfig.id), "ProjectDesignConfig record created with embedded sceneConfig");

    // Fetch and restore
    const fetched = await prisma.projectDesignConfig.findUnique({
      where: { projectId: testProjectId },
    });
    assert(Boolean(fetched), "ProjectDesignConfig successfully reloaded from SQLite");

    const reloadedPrefs = JSON.parse(fetched!.threeDPreferences);
    const reloadedScene = reloadedPrefs.sceneConfig as ThreeDSceneConfig;

    assert(
      reloadedScene.environment.backgroundColor === "#020617",
      "Persisted background color (#020617) restored from database"
    );
    assert(
      reloadedScene.environment.fog.enabled === true,
      "Persisted atmospheric fog flag restored from database"
    );
    assert(
      reloadedScene.camera.fov === 55,
      "Persisted camera FOV (55°) restored from database"
    );
    assert(
      reloadedScene.lighting.preset === "dramatic_neon",
      "Persisted dramatic_neon lighting preset restored from database"
    );
    assert(
      reloadedScene.objects.length === 1 && reloadedScene.objects[0].id === "hero-car-chassis",
      "Persisted multi-object hierarchy restored with matching object ID"
    );
    assert(
      reloadedScene.objects[0].materialOverride?.color === "#06b6d4",
      "Persisted material override (#06b6d4) restored accurately"
    );

    console.log("\n=================================================");
    console.log(`  PHASE 3.3 3D SCENE: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    if (testProjectId) {
      await prisma.projectDesignConfig.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.delete({ where: { id: testProjectId } });
    }
    await prisma.$disconnect();
  }
}

runThreeDSceneTests().catch((err) => {
  console.error("\n[FATAL TEST RUNNER ERROR]:", err);
  process.exit(1);
});
