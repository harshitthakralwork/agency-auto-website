import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { designUpdateSchema } from "@/lib/validations/design";

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
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project,
        designConfig: project.designConfig,
      },
    });
  } catch (error) {
    console.error("GET /api/projects/[id]/design error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch design configuration" },
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
    const json = await req.json();
    const parsed = designUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
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

    const {
      experienceLevel,
      preset,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      mutedTextColor,
      headingFont,
      bodyFont,
      baseFontSize,
      layoutStyle,
      borderRadius,
      containerWidth,
      animationIntensity,
      enableCanvasFx,
      threeD,
      media,
      sections,
    } = parsed.data;

    const updatedConfig = await db.projectDesignConfig.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        experienceLevel: experienceLevel || project.experienceLevel,
        preset,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        surfaceColor,
        textColor,
        mutedTextColor,
        headingFont,
        bodyFont,
        baseFontSize,
        layoutStyle,
        borderRadius,
        containerWidth,
        animationIntensity,
        enableCanvasFx,
        threeDPreferences: JSON.stringify(threeD || {}),
        mediaPreferences: JSON.stringify(media || {}),
        sectionsConfigJson: JSON.stringify(sections),
      },
      update: {
        experienceLevel: experienceLevel || project.experienceLevel,
        preset,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        surfaceColor,
        textColor,
        mutedTextColor,
        headingFont,
        bodyFont,
        baseFontSize,
        layoutStyle,
        borderRadius,
        containerWidth,
        animationIntensity,
        enableCanvasFx,
        threeDPreferences: JSON.stringify(threeD || {}),
        mediaPreferences: JSON.stringify(media || {}),
        sectionsConfigJson: JSON.stringify(sections),
      },
    });

    // Also sync project table experienceLevel and updatedAt
    await db.project.update({
      where: { id },
      data: {
        experienceLevel: experienceLevel || project.experienceLevel,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error("PATCH /api/projects/[id]/design error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update design configuration" },
      { status: 500 }
    );
  }
}
