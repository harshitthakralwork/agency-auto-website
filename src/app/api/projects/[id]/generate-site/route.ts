import { NextRequest, NextResponse } from "next/server";
import { WebsiteGeneratorService } from "@/modules/generator/service";
import { z } from "zod";

const generateSchema = z.object({
  experienceTierOverride: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional(),
  outputDirectory: z.string().optional(),
  zip: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid generation options", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await WebsiteGeneratorService.generateWebsite(id, {
      projectId: id,
      ...parsed.data,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Website generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate website" },
      { status: 500 }
    );
  }
}

