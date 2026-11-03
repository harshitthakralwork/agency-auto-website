import { NextRequest, NextResponse } from "next/server";
import { CompositionService } from "@/modules/composition/service";
import { AddSectionInputSchema } from "@/modules/composition/schema";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const parseResult = AddSectionInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid add section payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const section = await CompositionService.addSection(id, parseResult.data);

    return NextResponse.json({
      success: true,
      section,
    });
  } catch (error: any) {
    const status = error.name === "PageNotFoundError" ? 404 : 500;
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add section" },
      { status }
    );
  }
}

