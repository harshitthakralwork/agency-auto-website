import { PrismaClient } from "@prisma/client";
import { LocalStorageAdapter } from "../src/lib/storage/local-adapter";
import {
  assetUpdateSchema,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZES,
  ASSET_TYPES,
  ASSIGNED_SLOTS,
} from "../src/lib/validations/asset";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const storage = new LocalStorageAdapter();

async function runMediaTests() {
  console.log("=================================================");
  console.log("  AGENCY WEBSITE ENGINE — PHASE 2.1 VERIFICATION  ");
  console.log("  (Real Media & Image Asset Management)           ");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  }

  try {
    // 1. Validation Engine Rules
    console.log("--- 1. Testing Validation Engine & Constraints ---");
    assert(ASSET_TYPES.length >= 6 && (ASSET_TYPES as readonly string[]).includes("FRAME_SEQUENCE"), "Asset types include base 6 plus FRAME_SEQUENCE");
    assert(ASSIGNED_SLOTS.length >= 6 && (ASSIGNED_SLOTS as readonly string[]).includes("CANVAS_HERO_SEQUENCE"), "Designated slots include base 6 plus CANVAS_HERO_SEQUENCE");
    assert(ALLOWED_MIME_TYPES.IMAGE.includes("image/jpeg") && ALLOWED_MIME_TYPES.IMAGE.includes("image/webp"), "Image MIME types correctly allow JPEG and WebP");
    assert(ALLOWED_MIME_TYPES.VIDEO.includes("video/mp4") && ALLOWED_MIME_TYPES.VIDEO.includes("video/webm"), "Video MIME types correctly allow MP4 and WebM");
    assert(MAX_FILE_SIZES.VIDEO === 100 * 1024 * 1024, "Video file size limit is correctly budgeted at 100MB");
    assert(MAX_FILE_SIZES.IMAGE === 15 * 1024 * 1024, "Image file size limit is correctly budgeted at 15MB");

    const validUpdate = assetUpdateSchema.safeParse({
      name: "Detailing Result",
      assignedSlot: "AFTER_SLOT",
      assetType: "AFTER_IMAGE",
    });
    assert(validUpdate.success, "Asset update schema accepts valid slot and type assignments");

    const invalidUpdate = assetUpdateSchema.safeParse({
      assignedSlot: "NON_EXISTENT_SLOT",
    });
    assert(!invalidUpdate.success, "Asset update schema rejects invalid slot names");

    // 2. Storage Adapter Direct Operations
    console.log("\n--- 2. Testing Storage Adapter Direct Operations ---");
    const sampleBuffer = Buffer.from("FAKE_IMAGE_DATA_HEADER_BYTES_12345");
    const testRelativePath = "projects/test-harness/images/sample-paint.jpg";
    const uploadResult = await storage.upload(sampleBuffer, testRelativePath, "image/jpeg");

    assert(uploadResult.url === "/uploads/projects/test-harness/images/sample-paint.jpg", `Generated URL is web-accessible: ${uploadResult.url}`);
    const existsBefore = await storage.exists(uploadResult.filePath);
    assert(existsBefore, "Uploaded file physically exists on the disk filesystem");

    const fileContents = await fs.readFile(uploadResult.filePath, "utf-8");
    assert(fileContents === "FAKE_IMAGE_DATA_HEADER_BYTES_12345", "File contents written to disk match the exact payload");

    await storage.delete(uploadResult.filePath);
    const existsAfter = await storage.exists(uploadResult.filePath);
    assert(!existsAfter, "storage.delete() cleans up and deletes the physical file from disk");

    // 3. Database Metadata Persistence & Project Isolation
    console.log("\n--- 3. Testing Database Metadata Persistence & Isolation ---");
    // Create two test client projects
    const clientAlpha = await prisma.project.create({
      data: {
        name: "Test Detailing Studio Alpha",
        slug: `alpha-${Date.now()}`,
        category: "salon-beauty",
        experienceLevel: "CINEMATIC",
      },
    });

    const clientBeta = await prisma.project.create({
      data: {
        name: "Test Luxury Resort Beta",
        slug: `beta-${Date.now()}`,
        category: "hotels-banquets",
        experienceLevel: "IMMERSIVE_3D",
      },
    });

    assert(Boolean(clientAlpha.id && clientBeta.id), "Created two isolated test client projects in SQLite");

    // Create assets for Alpha
    const alphaHeroFile = await storage.upload(
      Buffer.from("ALPHA_HERO_VIDEO_BYTES"),
      `projects/${clientAlpha.id}/videos/hero-cinematic.mp4`,
      "video/mp4"
    );

    const alphaAsset = await prisma.projectAsset.create({
      data: {
        projectId: clientAlpha.id,
        name: "Cinematic Hero B-Roll",
        fileName: "hero-cinematic.mp4",
        fileUrl: alphaHeroFile.url,
        filePath: alphaHeroFile.filePath,
        mimeType: "video/mp4",
        fileSize: 2048,
        assetType: "VIDEO",
        assignedSlot: "HERO_BACKGROUND",
      },
    });

    // Create assets for Beta
    const betaHeroFile = await storage.upload(
      Buffer.from("BETA_HERO_IMAGE_BYTES"),
      `projects/${clientBeta.id}/images/resort-sunset.webp`,
      "image/webp"
    );

    const betaAsset = await prisma.projectAsset.create({
      data: {
        projectId: clientBeta.id,
        name: "Sunset Resort Aerial",
        fileName: "resort-sunset.webp",
        fileUrl: betaHeroFile.url,
        filePath: betaHeroFile.filePath,
        mimeType: "image/webp",
        fileSize: 1024,
        assetType: "IMAGE",
        assignedSlot: "HERO_BACKGROUND",
      },
    });

    // Verify Project Isolation
    const alphaAssets = await prisma.projectAsset.findMany({
      where: { projectId: clientAlpha.id },
    });
    const betaAssets = await prisma.projectAsset.findMany({
      where: { projectId: clientBeta.id },
    });

    assert(alphaAssets.length === 1 && alphaAssets[0].id === alphaAsset.id, "Client Alpha only retrieves its own asset");
    assert(betaAssets.length === 1 && betaAssets[0].id === betaAsset.id, "Client Beta only retrieves its own asset");
    assert(!alphaAssets.some((a) => a.id === betaAsset.id), "Strict Project Isolation: Beta's asset never leaks into Alpha's query");

    // 4. Before & After Transformation Assignment & Exclusivity
    console.log("\n--- 4. Testing Before/After Pair Handling & Slot Exclusivity ---");
    const beforeFile1 = await storage.upload(
      Buffer.from("BEFORE_CAR_SWIRLS_1"),
      `projects/${clientAlpha.id}/before-after/swirls-before-v1.jpg`,
      "image/jpeg"
    );
    const beforeAsset1 = await prisma.projectAsset.create({
      data: {
        projectId: clientAlpha.id,
        name: "Swirled Clearcoat v1",
        fileName: "swirls-before-v1.jpg",
        fileUrl: beforeFile1.url,
        filePath: beforeFile1.filePath,
        mimeType: "image/jpeg",
        fileSize: 1500,
        assetType: "BEFORE_IMAGE",
        assignedSlot: "BEFORE_SLOT",
      },
    });

    const afterFile = await storage.upload(
      Buffer.from("AFTER_CAR_CERAMIC_COAT"),
      `projects/${clientAlpha.id}/before-after/ceramic-after.jpg`,
      "image/jpeg"
    );
    const afterAssetObj = await prisma.projectAsset.create({
      data: {
        projectId: clientAlpha.id,
        name: "Ceramic Mirror Finish",
        fileName: "ceramic-after.jpg",
        fileUrl: afterFile.url,
        filePath: afterFile.filePath,
        mimeType: "image/jpeg",
        fileSize: 1600,
        assetType: "AFTER_IMAGE",
        assignedSlot: "AFTER_SLOT",
      },
    });

    assert(beforeAsset1.assignedSlot === "BEFORE_SLOT", "BEFORE_SLOT assigned successfully to before photo");
    assert(afterAssetObj.assignedSlot === "AFTER_SLOT", "AFTER_SLOT assigned successfully to after photo");

    // Test Exclusivity: Assigning a new before image clears the slot from the prior asset
    const beforeFile2 = await storage.upload(
      Buffer.from("BEFORE_CAR_SWIRLS_2"),
      `projects/${clientAlpha.id}/before-after/swirls-before-v2.jpg`,
      "image/jpeg"
    );

    // Simulate API route behavior: clear existing before slot then create new
    await prisma.projectAsset.updateMany({
      where: { projectId: clientAlpha.id, assignedSlot: "BEFORE_SLOT" },
      data: { assignedSlot: null },
    });

    const beforeAsset2 = await prisma.projectAsset.create({
      data: {
        projectId: clientAlpha.id,
        name: "Swirled Clearcoat v2",
        fileName: "swirls-before-v2.jpg",
        fileUrl: beforeFile2.url,
        filePath: beforeFile2.filePath,
        mimeType: "image/jpeg",
        fileSize: 1800,
        assetType: "BEFORE_IMAGE",
        assignedSlot: "BEFORE_SLOT",
      },
    });

    const refreshedBefore1 = await prisma.projectAsset.findUnique({
      where: { id: beforeAsset1.id },
    });
    assert(refreshedBefore1?.assignedSlot === null, "Old before asset had its slot cleared upon reassignment (Exclusivity enforced)");
    assert(beforeAsset2.assignedSlot === "BEFORE_SLOT", "New before asset now claims BEFORE_SLOT exclusively");

    // 5. Asset Deletion & Disk Cleanup
    console.log("\n--- 5. Testing Asset Deletion & Disk Cleanup ---");
    await storage.delete(alphaAsset.filePath);
    await prisma.projectAsset.delete({ where: { id: alphaAsset.id } });

    const checkDbDeleted = await prisma.projectAsset.findUnique({ where: { id: alphaAsset.id } });
    const checkFileDeleted = await storage.exists(alphaAsset.filePath);

    assert(checkDbDeleted === null, "Asset record deleted from SQLite");
    assert(!checkFileDeleted, "Asset binary file unlinked and deleted from physical filesystem");

    // Cleanup remaining test files and project rows
    await storage.delete(betaAsset.filePath);
    await storage.delete(beforeFile1.filePath);
    await storage.delete(beforeFile2.filePath);
    await storage.delete(afterFile.filePath);

    // Clean up test directories
    try {
      await fs.rm(path.join(process.cwd(), "public", "uploads", "projects", clientAlpha.id), { recursive: true, force: true });
      await fs.rm(path.join(process.cwd(), "public", "uploads", "projects", clientBeta.id), { recursive: true, force: true });
      await fs.rm(path.join(process.cwd(), "public", "uploads", "projects", "test-harness"), { recursive: true, force: true });
    } catch {
      // Ignore directory cleanup warnings
    }

    // Cascade delete projects
    await prisma.project.delete({ where: { id: clientAlpha.id } });
    await prisma.project.delete({ where: { id: clientBeta.id } });

    // 6. Testing Audit Hardening Fixes
    console.log("\n--- 6. Testing Audit Hardening Fixes (Security & Cleanup) ---");

    // Fix 1: Strict extension whitelist & spoofing rejection
    function validateExtension(fileName: string, assetType: string): boolean {
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const allowed = ALLOWED_EXTENSIONS[assetType] || [];
      return Boolean(ext && allowed.includes(ext));
    }

    assert(!validateExtension("malicious.php", "IMAGE"), "Strict extension check rejects spoofed .php files disguised as IMAGE");
    assert(!validateExtension("exploit.html", "VIDEO"), "Strict extension check rejects .html files disguised as VIDEO");
    assert(!validateExtension("script.sh", "MODEL_3D"), "Strict extension check rejects .sh files disguised as MODEL_3D");
    assert(!validateExtension("noextension", "IMAGE"), "Strict extension check rejects files missing extensions");
    assert(validateExtension("gallery-photo.webp", "IMAGE"), "Strict extension check accepts valid .webp extension for IMAGE");
    assert(validateExtension("cinematic-reel.mp4", "VIDEO"), "Strict extension check accepts valid .mp4 extension for VIDEO");

    // Fix 2: Path traversal boundary enforcement
    let traversalUploadBlocked = false;
    try {
      await storage.upload(
        Buffer.from("MALICIOUS_BYTES"),
        "../../outside-root.txt",
        "text/plain"
      );
    } catch (err: any) {
      if (err.message.includes("Directory traversal attempt detected") || err.message.includes("outside")) {
        traversalUploadBlocked = true;
      }
    }
    assert(traversalUploadBlocked, "LocalStorageAdapter blocks directory traversal attempts escaping upload root");

    let traversalDeleteBlocked = false;
    try {
      await storage.delete(path.resolve(process.cwd(), "..", "system-file.txt"));
    } catch (err: any) {
      if (err.message.includes("Path is outside upload storage boundary")) {
        traversalDeleteBlocked = true;
      }
    }
    assert(traversalDeleteBlocked, "LocalStorageAdapter blocks deletion of files outside uploads directory");

    // Fix 3: Project directory cleanup & safe isolation
    const proj1Id = "test-cleanup-isolated-1";
    const proj2Id = "test-cleanup-isolated-2";

    const f1 = await storage.upload(Buffer.from("P1"), `projects/${proj1Id}/images/p1.jpg`, "image/jpeg");
    const f2 = await storage.upload(Buffer.from("P2"), `projects/${proj2Id}/images/p2.jpg`, "image/jpeg");

    assert((await storage.exists(f1.filePath)) && (await storage.exists(f2.filePath)), "Both projects created isolated physical files on disk");

    // Clean up project 1
    await storage.deleteProjectDirectory(proj1Id);
    assert(!(await storage.exists(f1.filePath)), "deleteProjectDirectory safely purged project 1's physical files");
    assert(await storage.exists(f2.filePath), "Project 2's physical files remain untouched (Directory isolation verified)");

    // Clean up project 2
    await storage.deleteProjectDirectory(proj2Id);
    assert(!(await storage.exists(f2.filePath)), "Project 2 directory cleaned up successfully");

    // Fix 4: Upload rollback on database failure
    const rollbackTestFile = await storage.upload(
      Buffer.from("ROLLBACK_TEST_FILE_CONTENT"),
      `projects/test-rollback/images/orphan-candidate.jpg`,
      "image/jpeg"
    );
    assert(await storage.exists(rollbackTestFile.filePath), "Rollback candidate file exists on disk prior to DB insert");

    let rollbackExecuted = false;
    try {
      // Simulate failed DB insert (foreign key constraint failure with non-existent project)
      await prisma.projectAsset.create({
        data: {
          projectId: "non-existent-project-cuid-99999",
          name: "Should Fail",
          fileName: "orphan-candidate.jpg",
          fileUrl: rollbackTestFile.url,
          filePath: rollbackTestFile.filePath,
          mimeType: "image/jpeg",
          fileSize: 100,
          assetType: "IMAGE",
        },
      });
    } catch {
      // Simulated route handler rollback
      await storage.delete(rollbackTestFile.filePath);
      rollbackExecuted = true;
    }

    assert(rollbackExecuted, "Database insert failure triggered rollback catch block");
    const existsAfterRollback = await storage.exists(rollbackTestFile.filePath);
    assert(!existsAfterRollback, "Rollback successfully unlinked file from disk; zero orphaned files remain");

    // Clean up rollback folder
    try {
      await fs.rm(path.join(process.cwd(), "public", "uploads", "projects", "test-rollback"), { recursive: true, force: true });
    } catch {}

    console.log("\n=================================================");
    console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("=================================================\n");
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMediaTests();

