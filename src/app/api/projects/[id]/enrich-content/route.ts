import { NextRequest, NextResponse } from "next/server";
import { ContentAssetService } from "@/modules/content-asset/service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const result = await ContentAssetService.enrichProjectCompositions(id);

    return NextResponse.json({
      success: true,
      projectId: id,
      count: result.enrichedSections.length,
      enrichedSections: result.enrichedSections,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to enrich content" },
      { status: 500 }
    );
  }
}
