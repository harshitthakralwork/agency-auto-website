import * as THREE from "three";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";
import {
  ModelAssetValidator,
  ThreeDModelNormalizer,
  ThreeDModelLoader,
} from "../src/modules/three-d";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  ASSIGNED_SLOTS,
  MAX_FILE_SIZES,
  assetUpdateSchema,
} from "../src/lib/validations/asset";

const prisma = new PrismaClient();
const storage = new LocalStorageAdapter();

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

/**
 * Creates a valid binary GLB v2 buffer in memory.
 */
function createValidGLB(customJson?: Record<string, any>): Buffer {
  const json = JSON.stringify(
    customJson || {
      asset: { version: "2.0", generator: "AgencyWebsiteEngine" },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{ name: "HeroMesh", primitives: [{ attributes: {} }] }],
      materials: [{ name: "HeroMaterial" }],
    }
  );
  let jsonBuffer = Buffer.from(json, "utf-8");
  const padding = (4 - (jsonBuffer.length % 4)) % 4;
  if (padding > 0) {
    jsonBuffer = Buffer.concat([jsonBuffer, Buffer.alloc(padding, 0x20)]);
  }

  const chunk0Length = jsonBuffer.length;
  const totalLength = 12 + 8 + chunk0Length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF" magic
  header.writeUInt32LE(2, 4); // version 2
  header.writeUInt32LE(totalLength, 8); // total length

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(chunk0Length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON" chunk type

  return Buffer.concat([header, chunkHeader, jsonBuffer]);
}

async function runThreeDAssetTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 3.2 VERIFICATION ");
  console.log("  (Real 3D Asset Management & GLTF Model Engine) ");
  console.log("=================================================\n");

  let testProjectId = "";

  try {
    // -------------------------------------------------------------
    // 1. Validation Schema & Slot Definition Extensions
    // -------------------------------------------------------------
    console.log("--- 1. Testing Validation Rules & 3D Slot Expansion ---");
    assert(
      (ASSIGNED_SLOTS as readonly string[]).includes("THREE_D_HERO_MODEL"),
      "Assigned slots include THREE_D_HERO_MODEL"
    );
    assert(
      (ASSIGNED_SLOTS as readonly string[]).includes("THREE_D_SHOWCASE_MODEL"),
      "Assigned slots include THREE_D_SHOWCASE_MODEL"
    );
    assert(
      (ASSIGNED_SLOTS as readonly string[]).includes("THREE_D_ENVIRONMENT_MAP"),
      "Assigned slots include THREE_D_ENVIRONMENT_MAP"
    );
    assert(
      (ALLOWED_EXTENSIONS.MODEL_3D as readonly string[]).includes("glb") &&
        (ALLOWED_EXTENSIONS.MODEL_3D as readonly string[]).includes("gltf"),
      "Allowed extensions for MODEL_3D include .glb and .gltf"
    );
    assert(
      MAX_FILE_SIZES.MODEL_3D === 50 * 1024 * 1024,
      "MODEL_3D file size limit budgeted at 50MB"
    );

    const validSlotUpdate = assetUpdateSchema.safeParse({
      assignedSlot: "THREE_D_HERO_MODEL",
    });
    assert(
      validSlotUpdate.success,
      "assetUpdateSchema accepts assignment to THREE_D_HERO_MODEL"
    );

    // -------------------------------------------------------------
    // 2. Binary GLB Header & Container Validation
    // -------------------------------------------------------------
    console.log("\n--- 2. Testing Server-Side GLB Binary Validation ---");
    const validGLB = createValidGLB();
    const validGLBResult = await ModelAssetValidator.validate(validGLB, "glb");
    assert(validGLBResult.valid === true, "Valid GLB container passes validator");
    assert(validGLBResult.format === "glb", "GLB format correctly identified as 'glb'");
    assert(validGLBResult.meshCount === 1, "Mesh count correctly extracted (1)");
    assert(validGLBResult.materialCount === 1, "Material count correctly extracted (1)");
    assert(
      validGLBResult.dracoCompressed === false,
      "Draco compression accurately identified as false"
    );

    // Corrupt magic bytes
    const corruptMagic = Buffer.from(validGLB);
    corruptMagic.writeUInt32LE(0x12345678, 0);
    const corruptMagicRes = await ModelAssetValidator.validate(corruptMagic, "glb");
    assert(
      corruptMagicRes.valid === false &&
        corruptMagicRes.error?.includes("Invalid GLB magic header"),
      "Validator rejects corrupt GLB magic bytes"
    );

    // Corrupt version
    const corruptVersion = Buffer.from(validGLB);
    corruptVersion.writeUInt32LE(1, 4); // glTF v1
    const corruptVersionRes = await ModelAssetValidator.validate(corruptVersion, "glb");
    assert(
      corruptVersionRes.valid === false &&
        corruptVersionRes.error?.includes("Unsupported glTF container version"),
      "Validator rejects unsupported GLB version 1"
    );

    // Truncated length mismatch
    const truncatedGLB = validGLB.subarray(0, validGLB.length - 10);
    const truncatedRes = await ModelAssetValidator.validate(truncatedGLB, "glb");
    assert(
      truncatedRes.valid === false &&
        truncatedRes.error?.includes("Truncated GLB container"),
      "Validator rejects truncated GLB where actual length differs from header"
    );

    // Buffer under 12 bytes
    const tinyBuffer = Buffer.alloc(8);
    const tinyRes = await ModelAssetValidator.validate(tinyBuffer, "glb");
    assert(
      tinyRes.valid === false &&
        tinyRes.error?.includes("smaller than the minimum 12-byte header"),
      "Validator rejects GLB file smaller than header minimum (12 bytes)"
    );

    // -------------------------------------------------------------
    // 3. glTF JSON Security & Path Traversal Prevention
    // -------------------------------------------------------------
    console.log("\n--- 3. Testing glTF JSON Security & URI Boundary Enforcement ---");
    const validGLTFJson = {
      asset: { version: "2.0", generator: "AgencyWebsiteEngine" },
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0 }],
      meshes: [{ name: "GLTFMesh", primitives: [{ attributes: {} }] }],
      buffers: [{ byteLength: 100, uri: "data:application/octet-stream;base64,AAAA" }],
    };
    const validGLTFBuf = Buffer.from(JSON.stringify(validGLTFJson), "utf-8");
    const validGLTFRes = await ModelAssetValidator.validate(validGLTFBuf, "gltf");
    assert(validGLTFRes.valid === true, "Valid glTF JSON with base64 data URI passes validation");
    assert(validGLTFRes.format === "gltf", "glTF format identified as 'gltf'");

    // Missing asset.version
    const missingVersionJson = { scenes: [] };
    const missingVersionBuf = Buffer.from(JSON.stringify(missingVersionJson), "utf-8");
    const missingVersionRes = await ModelAssetValidator.validate(missingVersionBuf, "gltf");
    assert(
      missingVersionRes.valid === false &&
        missingVersionRes.error?.includes("asset.version"),
      "Validator rejects glTF missing asset.version"
    );

    // Malformed JSON syntax
    const malformedJsonBuf = Buffer.from("{ asset: '2.0', unclosed: ", "utf-8");
    const malformedJsonRes = await ModelAssetValidator.validate(malformedJsonBuf, "gltf");
    assert(
      malformedJsonRes.valid === false &&
        malformedJsonRes.error?.includes("Content is not valid JSON"),
      "Validator rejects malformed glTF JSON syntax"
    );

    // Path traversal in buffer URI (../)
    const traversalBufferJson = {
      asset: { version: "2.0" },
      buffers: [{ byteLength: 50, uri: "../../etc/passwd" }],
    };
    const traversalBufferRes = await ModelAssetValidator.validate(
      Buffer.from(JSON.stringify(traversalBufferJson)),
      "gltf"
    );
    assert(
      traversalBufferRes.valid === false &&
        traversalBufferRes.error?.includes("Path traversal"),
      "Validator rejects relative path traversal in glTF buffer URI"
    );

    // Path traversal in image URI (..\)
    const traversalImageJson = {
      asset: { version: "2.0" },
      images: [{ uri: "..\\Windows\\System32\\cmd.exe" }],
    };
    const traversalImageRes = await ModelAssetValidator.validate(
      Buffer.from(JSON.stringify(traversalImageJson)),
      "gltf"
    );
    assert(
      traversalImageRes.valid === false &&
        traversalImageRes.error?.includes("Path traversal"),
      "Validator rejects Windows backslash path traversal in glTF image URI"
    );

    // External HTTP URL rejection in buffers
    const externalHttpJson = {
      asset: { version: "2.0" },
      buffers: [{ byteLength: 100, uri: "http://malicious.network/payload.bin" }],
    };
    const externalHttpRes = await ModelAssetValidator.validate(
      Buffer.from(JSON.stringify(externalHttpJson)),
      "gltf"
    );
    assert(
      externalHttpRes.valid === false &&
        externalHttpRes.error?.includes("External URI schemes are forbidden"),
      "Validator rejects external HTTP URI in glTF buffer reference"
    );

    // External HTTPS URL rejection in images
    const externalHttpsJson = {
      asset: { version: "2.0" },
      images: [{ uri: "https://evil.org/phishing_texture.jpg" }],
    };
    const externalHttpsRes = await ModelAssetValidator.validate(
      Buffer.from(JSON.stringify(externalHttpsJson)),
      "gltf"
    );
    assert(
      externalHttpsRes.valid === false &&
        externalHttpsRes.error?.includes("External URI schemes are forbidden"),
      "Validator rejects external HTTPS URI in glTF image reference"
    );

    // -------------------------------------------------------------
    // 4. Model Normalization Engine
    // -------------------------------------------------------------
    console.log("\n--- 4. Testing 3D Model Normalization & Bounds Computation ---");
    const testRoot = new THREE.Group();
    // Add a child mesh offset in space: Box(4, 8, 2) positioned at (10, 20, 30)
    const boxGeom = new THREE.BoxGeometry(4, 8, 2);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const boxMesh = new THREE.Mesh(boxGeom, boxMat);
    boxMesh.position.set(10, 20, 30);
    testRoot.add(boxMesh);

    // Target max dimension = 2.0
    const normStats = ThreeDModelNormalizer.normalize(testRoot, 2.0);
    const boxAfter = new THREE.Box3().setFromObject(testRoot);
    const sizeAfter = new THREE.Vector3();
    boxAfter.getSize(sizeAfter);
    const scaledMaxDim = Math.max(sizeAfter.x, sizeAfter.y, sizeAfter.z);
    assert(
      Math.abs(scaledMaxDim - 2.0) < 0.001,
      "Normalizer scales root model to exact target dimension (2.0)"
    );
    assert(
      normStats.maxDimension === 8.0 && normStats.scaleFactor === 0.25,
      "Normalizer records accurate original max dimension (8.0) and scale factor (0.25)"
    );
    assert(
      boxMesh.castShadow === true && boxMesh.receiveShadow === true,
      "Normalizer automatically configures shadow casting & receiving"
    );
    assert(normStats.meshCount === 1, "Normalizer correctly counts 1 mesh in scene graph");
    assert(normStats.vertexCount > 0, `Normalizer counted ${normStats.vertexCount} vertices`);

    // Verify root is centered at world (0, 0, 0)
    const boundsAfter = new THREE.Box3().setFromObject(testRoot);
    const centerAfter = new THREE.Vector3();
    boundsAfter.getCenter(centerAfter);
    assert(
      centerAfter.length() < 0.001,
      "Normalizer positions root model center exactly at origin (0, 0, 0)"
    );

    // -------------------------------------------------------------
    // 5. Model Loader Parsing & Resource Disposal
    // -------------------------------------------------------------
    console.log("\n--- 5. Testing ThreeDModelLoader In-Memory Parsing & Clean Disposal ---");
    // Parse valid GLB via ThreeDModelLoader
    const parsedModel = await ThreeDModelLoader.parse(
      validGLB.buffer.slice(
        validGLB.byteOffset,
        validGLB.byteOffset + validGLB.byteLength
      ) as ArrayBuffer,
      ""
    );
    assert(parsedModel.scene instanceof THREE.Group, "GLTFLoader parsed valid GLB into THREE.Group");
    assert(parsedModel.stats.meshCount === 1, "Parsed GLB contains 1 mesh in stats");
    assert(typeof parsedModel.dispose === "function", "Parsed model returns a dispose cleanup function");

    // Execute disposal
    let disposalSucceeded = false;
    try {
      parsedModel.dispose();
      disposalSucceeded = true;
    } catch (e) {
      disposalSucceeded = false;
    }
    assert(disposalSucceeded, "Parsed model dispose() executes cleanly without runtime errors");

    // -------------------------------------------------------------
    // 6. Database & Local Storage Persistence Pipeline
    // -------------------------------------------------------------
    console.log("\n--- 6. Testing Real 3D Asset Storage & Slot Isolation ---");
    // Create isolated test project
    const testProject = await prisma.project.create({
      data: {
        name: "Test 3D Studio Project",
        slug: `test-3d-${Date.now()}`,
        category: "AUTOMOTIVE",
        experienceLevel: "EXPERIENCE_3D",
        status: "DRAFT",
      },
    });
    testProjectId = testProject.id;
    assert(Boolean(testProjectId), `Isolated test project created (${testProjectId})`);

    // Store GLB file physically via storage adapter
    const glbFileName = `hero-chassis-${Date.now()}.glb`;
    const relativePath = path.join("projects", testProjectId, "models", glbFileName);
    const storedFile = await storage.upload(validGLB, relativePath, "model/gltf-binary");
    const fileExists = await storage.exists(storedFile.filePath);
    assert(fileExists === true, "Physical GLB file safely saved in project storage directory");

    // Validate and extract metadata
    const validationResult = await ModelAssetValidator.validate(validGLB, "glb");
    assert(validationResult.valid, "Validator approves storage test GLB");

    // Persist asset in SQLite via Prisma
    const assetRecord = await prisma.projectAsset.create({
      data: {
        projectId: testProjectId,
        name: "Automotive 3D Chassis",
        fileName: glbFileName,
        fileUrl: storedFile.url,
        filePath: storedFile.filePath,
        mimeType: "model/gltf-binary",
        fileSize: validGLB.length,
        assetType: "MODEL_3D",
        assignedSlot: "THREE_D_HERO_MODEL",
        metadataJson: JSON.stringify({
          format: validationResult.format,
          meshCount: validationResult.meshCount,
          materialCount: validationResult.materialCount,
          dracoCompressed: validationResult.dracoCompressed,
        }),
      },
    });
    assert(assetRecord.id.length > 0, `Asset record created in SQLite with ID ${assetRecord.id}`);
    assert(
      assetRecord.assignedSlot === "THREE_D_HERO_MODEL",
      "Asset assigned to THREE_D_HERO_MODEL slot"
    );

    // Verify metadata stored
    const parsedDbMeta = JSON.parse(assetRecord.metadataJson);
    assert(parsedDbMeta.format === "glb", "SQLite metadataJson correctly retains format 'glb'");
    assert(parsedDbMeta.meshCount === 1, "SQLite metadataJson correctly retains meshCount");

    // Test exclusive slot reassignment:
    // Create second 3D asset assigned to THREE_D_HERO_MODEL
    const secondGLBName = `second-model-${Date.now()}.glb`;
    const secondRelativePath = path.join("projects", testProjectId, "models", secondGLBName);
    const secondStored = await storage.upload(validGLB, secondRelativePath, "model/gltf-binary");
    const secondAsset = await prisma.projectAsset.create({
      data: {
        projectId: testProjectId,
        name: "Second 3D Model",
        fileName: secondGLBName,
        fileUrl: secondStored.url,
        filePath: secondStored.filePath,
        mimeType: "model/gltf-binary",
        fileSize: validGLB.length,
        assetType: "MODEL_3D",
        assignedSlot: null,
      },
    });

    // Simulate slot assignment API route exclusivity:
    // When secondAsset is assigned to THREE_D_HERO_MODEL, previous holder is cleared
    await prisma.projectAsset.updateMany({
      where: {
        projectId: testProjectId,
        assignedSlot: "THREE_D_HERO_MODEL",
        id: { not: secondAsset.id },
      },
      data: { assignedSlot: null },
    });
    await prisma.projectAsset.update({
      where: { id: secondAsset.id },
      data: { assignedSlot: "THREE_D_HERO_MODEL" },
    });

    const refreshedFirst = await prisma.projectAsset.findUnique({
      where: { id: assetRecord.id },
    });
    const refreshedSecond = await prisma.projectAsset.findUnique({
      where: { id: secondAsset.id },
    });
    assert(
      refreshedFirst?.assignedSlot === null,
      "First asset had THREE_D_HERO_MODEL slot cleared due to slot exclusivity"
    );
    assert(
      refreshedSecond?.assignedSlot === "THREE_D_HERO_MODEL",
      "Second asset successfully claimed THREE_D_HERO_MODEL slot"
    );

    // Cleanup assets and file
    await storage.delete(storedFile.filePath);
    await storage.delete(secondStored.filePath);
    const firstExistsAfter = await storage.exists(storedFile.filePath);
    const secondExistsAfter = await storage.exists(secondStored.filePath);
    assert(!firstExistsAfter && !secondExistsAfter, "Physical model files cleaned up cleanly");

    console.log("\n=================================================");
    console.log(`  PHASE 3.2 3D ASSETS: ALL ${passedCount} / ${totalCount} TESTS PASSED!`);
    console.log("=================================================\n");
  } finally {
    if (testProjectId) {
      await prisma.projectAsset.deleteMany({ where: { projectId: testProjectId } });
      await prisma.project.delete({ where: { id: testProjectId } });
      await storage.deleteProjectDirectory(testProjectId);
    }
    await prisma.$disconnect();
  }
}

runThreeDAssetTests().catch((err) => {
  console.error("\n[FATAL TEST RUNNER ERROR]:", err);
  process.exit(1);
});
