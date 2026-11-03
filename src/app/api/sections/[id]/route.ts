import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";
import { UpdateSectionInputSchema } from "@/modules/composition/schema";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parseResult = UpdateSectionInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid section update payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const section = await CompositionService.updateSection(id, parseResult.data);

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error: any) {
    const status = error.name === "SectionNotFoundError" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update section" },
      { status }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const removed = await CompositionService.removeSection(id);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Section not found or could not be removed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sectionId: id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove section" },
      { status: 500 }
    );
  }
}

