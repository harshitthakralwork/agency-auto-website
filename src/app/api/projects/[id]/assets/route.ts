import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage/local-adapter";
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZES,
  ASSET_TYPES,
  ASSIGNED_SLOTS,
} from "@/lib/validations/asset";
import { ModelAssetValidator } from "@/modules/three-d/assets/validator";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const assets = await db.projectAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: assets });
  } catch (error) {
    console.error("GET /api/projects/[id]/assets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch project assets" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestedType = (formData.get("assetType") as string) || "IMAGE";
    const requestedSlot = formData.get("assignedSlot") as string | null;
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded" },
        { status: 400 }
      );
    }

    const assetType = (ASSET_TYPES as readonly string[]).includes(requestedType)
      ? requestedType
      : "IMAGE";

    const assignedSlot =
      requestedSlot && (ASSIGNED_SLOTS as readonly string[]).includes(requestedSlot)
        ? requestedSlot
        : null;

    // Validate file extension against strict whitelist for assetType
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowedExts = ALLOWED_EXTENSIONS[assetType] || [];
    if (!ext || !allowedExts.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file extension ".${ext}". Allowed extensions for ${assetType}: ${allowedExts.map((e) => `.${e}`).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedMimes = ALLOWED_MIME_TYPES[assetType] || [];
    if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid MIME type "${file.type}". Allowed for ${assetType}: ${allowedMimes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate File Size
    const maxSize = MAX_FILE_SIZES[assetType] || 15 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxMb = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the maximum allowed ${maxMb}MB for ${assetType}`,
        },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Deep server-side validation for 3D models (GLB container headers, GLTF schema, security checks)
    let modelMetadata: Record<string, any> = {};
    if (assetType === "MODEL_3D") {
      const validation = ModelAssetValidator.validate(buffer, ext);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error || "Invalid 3D model file",
          },
          { status: 400 }
        );
      }
      modelMetadata = {
        format: validation.format,
        version: validation.version,
        meshCount: validation.meshCount,
        materialCount: validation.materialCount,
        animationCount: validation.animationCount,
        textureCount: validation.textureCount,
        dracoCompressed: validation.dracoCompressed,
        extensionsUsed: validation.extensionsUsed,
      };
    }

    // Sanitize filename and create unique storage path
    const sanitizedOriginal = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedOriginal}`;
    const folder = assetType.toLowerCase().replace(/_/g, "-");
    const relativeStoragePath = `projects/${projectId}/${folder}/${uniqueFileName}`;

    // Upload via Storage Adapter
    const stored = await storage.upload(buffer, relativeStoragePath, file.type);

    try {
      // If exclusive slot is specified, unassign existing assets for that slot in this project
      const exclusiveSlots = [
        "HERO_BACKGROUND",
        "BEFORE_SLOT",
        "AFTER_SLOT",
        "POSTER_FALLBACK",
        "THREE_D_HERO_MODEL",
        "THREE_D_SHOWCASE_MODEL",
        "THREE_D_ENVIRONMENT_MAP",
      ];
      if (assignedSlot && exclusiveSlots.includes(assignedSlot)) {
        await db.projectAsset.updateMany({
          where: { projectId, assignedSlot },
          data: { assignedSlot: null },
        });
      }

      // Persist asset metadata
      const asset = await db.projectAsset.create({
        data: {
          projectId,
          name: customName || file.name,
          fileName: uniqueFileName,
          fileUrl: stored.url,
          filePath: stored.filePath,
          mimeType: file.type || (ext === "glb" ? "model/gltf-binary" : "model/gltf+json"),
          fileSize: file.size,
          assetType,
          assignedSlot,
          metadataJson: JSON.stringify({
            originalName: file.name,
            lastModified: file.lastModified,
            ...modelMetadata,
          }),
        },
      });

      return NextResponse.json({ success: true, data: asset }, { status: 201 });
    } catch (dbError) {
      // Rollback physical file if DB creation fails
      try {
        await storage.delete(stored.filePath);
      } catch (cleanupErr) {
        console.error("Failed to delete orphaned file during rollback:", cleanupErr);
      }
      throw dbError;
    }
  } catch (error) {
    console.error("POST /api/projects/[id]/assets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload and save project asset" },
      { status: 500 }
    );
  }
}

