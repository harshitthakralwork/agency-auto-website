import { NextRequest, NextResponse } from "next/server";
import { ContentAssetService } from "@/modules/content-asset/service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auditSummary = await ContentAssetService.auditAndMatchProjectAssetSlots(id);

    return NextResponse.json({
      success: true,
      auditSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to audit and match asset slots" },
      { status: 500 }
    );
  }
}
