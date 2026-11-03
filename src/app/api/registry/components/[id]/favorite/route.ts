import { NextRequest, NextResponse } from "next/server";
import { RegistryService } from "@/modules/registry/service";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const isFavorite = await RegistryService.toggleFavorite(id);

    return NextResponse.json({
      success: true,
      componentId: id,
      isFavorite,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}

