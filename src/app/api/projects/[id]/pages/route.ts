import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";
import { CreatePageInputSchema } from "@/modules/composition/schema";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const pages = await CompositionService.getProjectCompositions(id);

    return NextResponse.json({
      success: true,
      projectId: id,
      count: pages.length,
      pages,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project pages" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parseResult = CreatePageInputSchema.safeParse({
      ...body,
      projectId: id,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid page creation payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const page = await CompositionService.createPage(parseResult.data);

    return NextResponse.json({
      success: true,
      page,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create page" },
      { status: 500 }
    );
  }
}

