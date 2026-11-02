import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  threeDSceneConfigSchema,
  createDefaultThreeDSceneConfig,
  ThreeDSceneConfig,
} from "@/modules/three-d/scene";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      include: {
        designConfig: true,
        assets: {
          where: {
            assetType: {
              in: ["MODEL_3D", "IMAGE"],
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse sceneConfig from threeDPreferences or generate defaults
    let sceneConfig: ThreeDSceneConfig = createDefaultThreeDSceneConfig();

    if (project.designConfig?.threeDPreferences) {
      try {
        const parsedPrefs = JSON.parse(project.designConfig.threeDPreferences);
        if (parsedPrefs && parsedPrefs.sceneConfig) {
          const validated = threeDSceneConfigSchema.safeParse(parsedPrefs.sceneConfig);
          if (validated.success) {
            sceneConfig = validated.data;
          }
        }
      } catch {
        // Fallback to default
      }
    }

    // Filter available 3D models and environment maps
    const modelAssets = project.assets
      .filter((a) => a.assetType === "MODEL_3D")
      .map((a) => ({
        id: a.id,
        name: a.name,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        assignedSlot: a.assignedSlot,
        metadataJson: a.metadataJson,
      }));

    return NextResponse.json({
      success: true,
      data: {
        sceneConfig,
        modelAssets,
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          category: project.category,
          experienceLevel: project.experienceLevel,
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id]/3d/scene error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch 3D scene configuration" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    let body: any;
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed or empty JSON payload" },
        { status: 400 }
      );
    }

    const parsed = threeDSceneConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid 3D scene configuration",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      include: { designConfig: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Merge sceneConfig into threeDPreferences JSON
    let existingPrefs: Record<string, any> = {};
    if (project.designConfig?.threeDPreferences) {
      try {
        existingPrefs = JSON.parse(project.designConfig.threeDPreferences);
      } catch {
        existingPrefs = {};
      }
    }

    const updatedPrefs = {
      ...existingPrefs,
      sceneConfig: parsed.data,
      lightingEnvironment: parsed.data.lighting.preset,
    };

    const updatedDesign = await db.projectDesignConfig.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        experienceLevel: project.experienceLevel,
        threeDPreferences: JSON.stringify(updatedPrefs),
      },
      update: {
        threeDPreferences: JSON.stringify(updatedPrefs),
      },
    });

    await db.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: parsed.data,
      updatedAt: updatedDesign.updatedAt,
    });
  } catch (error: any) {
    console.error("PATCH /api/projects/[id]/3d/scene error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save 3D scene configuration" },
      { status: 500 }
    );
  }
}
