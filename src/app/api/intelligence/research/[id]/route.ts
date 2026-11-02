import { NextRequest, NextResponse } from "next/server";
import { websiteIntelligence } from "@/modules/intelligence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await websiteIntelligence.getSession(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: `Research session "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve research session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await websiteIntelligence.deleteSession(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Research session "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Research session "${id}" and associated evidence deleted.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete research session" },
      { status: 500 }
    );
  }
}
