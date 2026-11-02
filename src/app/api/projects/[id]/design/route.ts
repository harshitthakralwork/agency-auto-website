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
      sections,
    } = parsed.data;

    const updatedConfig = await db.projectDesignConfig.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
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
        sectionsConfigJson: JSON.stringify(sections),
      },
      update: {
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
        sectionsConfigJson: JSON.stringify(sections),
      },
    });

    // Touch project updatedAt
    await db.project.update({
      where: { id },
      data: { updatedAt: new Date() },
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
