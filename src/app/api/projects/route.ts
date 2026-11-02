import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectCreateSchema } from "@/lib/validations/project";
import { slugify } from "@/lib/utils";
import { getCategoryPack, getDefaultSectionsForCategory } from "@/modules/categories/registry";
import { DESIGN_PRESETS } from "@/modules/design/presets";
import { DesignPresetId } from "@/modules/design/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const experienceLevel = searchParams.get("experienceLevel");
    const query = searchParams.get("q");

    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (experienceLevel && experienceLevel !== "all") {
      where.experienceLevel = experienceLevel;
    }
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { location: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const projects = await db.project.findMany({
      where,
      include: {
        designConfig: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = projectCreateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const baseSlug = slugify(data.name) || "project";
    let slug = baseSlug;
    let counter = 1;

    // Check slug uniqueness
    while (await db.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const categoryPack = getCategoryPack(data.category);
    const presetId = (data.preset || categoryPack.suggestedPreset || "cinematic") as Exclude<
      DesignPresetId,
      "custom"
    >;
    const preset = DESIGN_PRESETS[presetId] || DESIGN_PRESETS.cinematic;
    const defaultSections = getDefaultSectionsForCategory(data.category);
    const experienceLevel = data.experienceLevel || "CINEMATIC";

    // Atomically create Project and linked ProjectDesignConfig
    const newProject = await db.project.create({
      data: {
        name: data.name,
        slug,
        category: data.category,
        experienceLevel,
        location: data.location || null,
        description: data.description || null,
        services: data.services || "",
        targetAudience: data.targetAudience || null,
        status: data.status,
        designConfig: {
          create: {
            experienceLevel,
            preset: preset.id,
            primaryColor: preset.colors.primary,
            secondaryColor: preset.colors.secondary,
            accentColor: preset.colors.accent,
            backgroundColor: preset.colors.background,
            surfaceColor: preset.colors.surface,
            textColor: preset.colors.text,
            mutedTextColor: preset.colors.mutedText,
            headingFont: preset.typography.headingFont,
            bodyFont: preset.typography.bodyFont,
            baseFontSize: preset.typography.baseFontSize,
            layoutStyle: preset.layout.layoutStyle,
            borderRadius: preset.layout.borderRadius,
            containerWidth: preset.layout.containerWidth,
            animationIntensity: experienceLevel === "STANDARD" ? "subtle" : "cinematic",
            enableCanvasFx: experienceLevel !== "STANDARD",
            threeDPreferences: JSON.stringify({
              objectType: experienceLevel === "IMMERSIVE_3D" ? "product_model" : "none",
              scrollInteraction: experienceLevel === "IMMERSIVE_3D" ? "rotate_on_scroll" : "none",
              lightingEnvironment: "studio",
              wireframeMode: false,
              autoRotate: true,
            }),
            mediaPreferences: JSON.stringify({
              canvasFrameSequenceEnabled: experienceLevel === "CINEMATIC",
              beforeAfterComparisonEnabled: true,
            }),
            sectionsConfigJson: JSON.stringify(defaultSections),
            responsiveSettings: JSON.stringify({}),
          },
        },
      },
      include: {
        designConfig: true,
      },
    });

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}
