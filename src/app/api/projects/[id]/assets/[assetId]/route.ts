import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage/local-adapter";
import { assetUpdateSchema, ASSIGNED_SLOTS } from "@/lib/validations/asset";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;

    const asset = await db.projectAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    console.error("GET /api/projects/[id]/assets/[assetId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch asset" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;
    const json = await req.json();
    const parsed = assetUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const asset = await db.projectAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    const { assignedSlot, name, assetType, metadataJson } = parsed.data;

    // Handle slot exclusivity
    const exclusiveSlots = ["HERO_BACKGROUND", "BEFORE_SLOT", "AFTER_SLOT", "POSTER_FALLBACK"];
    if (assignedSlot && exclusiveSlots.includes(assignedSlot)) {
      await db.projectAsset.updateMany({
        where: {
          projectId,
          assignedSlot,
          id: { not: assetId },
        },
        data: { assignedSlot: null },
      });
    }

    const updated = await db.projectAsset.update({
      where: { id: assetId },
      data: {
        ...(name !== undefined && { name }),
        ...(assignedSlot !== undefined && { assignedSlot }),
        ...(assetType !== undefined && { assetType }),
        ...(metadataJson !== undefined && { metadataJson }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/projects/[id]/assets/[assetId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  try {
    const { id: projectId, assetId } = await params;

    const asset = await db.projectAsset.findFirst({
      where: { id: assetId, projectId },
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    // Delete physical file from disk
    if (asset.filePath) {
      await storage.delete(asset.filePath);
    }

    // Delete record from database
    await db.projectAsset.delete({
      where: { id: assetId },
    });

    return NextResponse.json({
      success: true,
      message: "Asset and physical file deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/projects/[id]/assets/[assetId] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
