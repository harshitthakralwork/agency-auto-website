import { NextRequest, NextResponse } from "next/server";
import { validateMutationOrigin } from "@/modules/intelligence";
import { blueprintService } from "@/modules/blueprint";
import { z } from "zod";

const createBlueprintRequestSchema = z.object({
  researchSessionId: z.string().optional(),
  title: z.string().optional(),
  industry: z.string().optional(),
  projectId: z.string().optional(),
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const status = searchParams.get("status") || undefined;
    const industry = searchParams.get("industry") || undefined;

    const blueprints = await blueprintService.listBlueprints({
      projectId,
      status: status as any,
      industry,
    });

    return NextResponse.json({
      success: true,
      data: blueprints,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list blueprints" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    validateMutationOrigin(req);

    const body = await req.json();
    const parsed = createBlueprintRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { researchSessionId, title, industry, projectId, experienceLevel } = parsed.data;

    let blueprint;
    if (researchSessionId) {
      blueprint = await blueprintService.createBlueprintFromResearch({
        researchSessionId,
        projectId,
        title,
        experienceLevel,
      });
    } else {
      if (!industry || !title) {
        return NextResponse.json(
          { success: false, error: "Both 'industry' and 'title' are required when creating without a research session" },
          { status: 400 }
        );
      }
      blueprint = await blueprintService.createBlueprintFromScratch({
        industry,
        title,
        projectId,
        experienceLevel,
      });
    }

    return NextResponse.json({
      success: true,
      data: blueprint,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create blueprint" },
      { status: 500 }
    );
  }
}

