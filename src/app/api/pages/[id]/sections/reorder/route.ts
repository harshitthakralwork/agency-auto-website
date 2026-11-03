import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";
import { ReorderSectionsInputSchema } from "@/modules/composition/schema";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parseResult = ReorderSectionsInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reorder payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const sections = await CompositionService.reorderSections(
      id,
      parseResult.data.orderedSectionIds
    );

    return NextResponse.json({
      success: true,
      pageId: id,
      sections,
    });
  } catch (error: any) {
    const status = error.name === "PageNotFoundError" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reorder sections" },
      { status }
    );
  }
}

