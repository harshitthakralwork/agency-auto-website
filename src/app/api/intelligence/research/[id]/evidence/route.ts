import { NextRequest, NextResponse } from "next/server";
import { websiteIntelligence } from "@/modules/intelligence";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const sliceParam = searchParams.get("slice") || "summary";
    const slice = (["all", "dom", "accessibility", "summary"].includes(sliceParam)
      ? sliceParam
      : "summary") as "all" | "dom" | "accessibility" | "summary";

    const evidence = await websiteIntelligence.getEvidence(id, slice);

    // Enforce Content-Type application/json and nosniff to prevent HTML/JS execution
    return new NextResponse(JSON.stringify({ success: true, data: evidence }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve evidence" },
      { status: 404 }
    );
  }
}
