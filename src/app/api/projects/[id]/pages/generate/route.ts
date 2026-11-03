import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { blueprintId } = body;
    if (!blueprintId) {
      return NextResponse.json(
        { success: false, error: "Missing required 'blueprintId' in request body" },
        { status: 400 }
      );
    }

    const pages = await CompositionService.generateFromBlueprint(blueprintId, id);

    return NextResponse.json({
      success: true,
      projectId: id,
      blueprintId,
      count: pages.length,
      pages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate pages from blueprint" },
      { status: 500 }
    );
  }
}

