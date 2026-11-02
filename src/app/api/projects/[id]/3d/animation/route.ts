import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  threeDAnimationConfigSchema,
  createDefaultThreeDAnimationConfig,
  ThreeDAnimationConfig,
} from "@/modules/three-d/animation";
import { createDefaultThreeDSceneConfig, ThreeDSceneConfig } from "@/modules/three-d/scene";

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
            assetType: "MODEL_3D",
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

    let parsedPrefs: Record<string, any> = {};
    if (project.designConfig?.threeDPreferences) {
      try {
        parsedPrefs = JSON.parse(project.designConfig.threeDPreferences);
      } catch {
        parsedPrefs = {};
      }
    }

    // Retrieve sceneConfig to know target objects
    const sceneConfig: ThreeDSceneConfig = parsedPrefs.sceneConfig || createDefaultThreeDSceneConfig();

    // Determine primary object ID
    const primaryObjectId = sceneConfig.objects?.[0]?.id || "obj_primary_showcase";

    // Retrieve or create default animationConfig
    let animationConfig: ThreeDAnimationConfig = createDefaultThreeDAnimationConfig(primaryObjectId);
    if (parsedPrefs && parsedPrefs.animationConfig) {
      const validated = threeDAnimationConfigSchema.safeParse(parsedPrefs.animationConfig);
      if (validated.success) {
        animationConfig = validated.data;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        animationConfig,
        sceneConfig,
        modelAssets: project.assets.map((a) => ({
          id: a.id,
          name: a.name,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
        })),
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
    console.error("GET /api/projects/[id]/3d/animation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch 3D animation configuration" },
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

    const parsed = threeDAnimationConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid 3D animation configuration",
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

    // Merge animationConfig into threeDPreferences JSON
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
      animationConfig: parsed.data,
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
    console.error("PATCH /api/projects/[id]/3d/animation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save 3D animation configuration" },
      { status: 500 }
    );
  }
}
