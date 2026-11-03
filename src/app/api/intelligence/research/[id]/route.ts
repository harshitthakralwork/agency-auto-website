import { NextRequest, NextResponse } from "next/server";
import { websiteIntelligence, validateMutationOrigin } from "@/modules/intelligence";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Enforce loopback Origin/Host validation for mutation endpoints (anti-CSRF)
    validateMutationOrigin(req);

    const { id } = await params;
    const body = await req.json();

    if (!Array.isArray(body.selectedFindings)) {
      return NextResponse.json(
        { success: false, error: "selectedFindings must be an array of strings" },
        { status: 400 }
      );
    }

    const updated = await websiteIntelligence.updateSelectedFindings(
      id,
      body.selectedFindings
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    const statusCode = err.code === "UNTRUSTED_ORIGIN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update findings", code: err.code || "INTERNAL_ERROR" },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Enforce loopback Origin/Host validation for mutation endpoints (anti-CSRF)
    validateMutationOrigin(req);

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
    const statusCode = err.code === "UNTRUSTED_ORIGIN" ? 403 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete research session", code: err.code || "INTERNAL_ERROR" },
      { status: statusCode }
    );
  }
}

