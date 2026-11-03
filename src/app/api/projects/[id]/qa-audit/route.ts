import { NextRequest, NextResponse } from "next/server";
import { QAService } from "@/modules/qa/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auditResult = await QAService.auditProject(id);
    return NextResponse.json(auditResult);
  } catch (error: any) {
    console.error("QA audit failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute QA audit" },
      { status: 500 }
    );
  }
}
