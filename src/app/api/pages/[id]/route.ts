import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";
import { UpdatePageInputSchema } from "@/modules/composition/schema";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const page = await CompositionService.getPageComposition(id);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error: any) {
    const status = error.name === "PageNotFoundError" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch page" },
      { status }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parseResult = UpdatePageInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid update payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const page = await CompositionService.updatePage(id, parseResult.data);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error: any) {
    const status = error.name === "PageNotFoundError" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update page" },
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
    const deleted = await CompositionService.deletePage(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Failed to delete page" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pageId: id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete page" },
      { status: 500 }
    );
  }
}

