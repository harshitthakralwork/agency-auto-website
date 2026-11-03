import { NextRequest, NextResponse } from "next/server";
import { validateMutationOrigin } from "@/modules/intelligence";
import {
  blueprintService,
  BlueprintNotFoundError,
  BlueprintApprovedImmutableError,
} from "@/modules/blueprint";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blueprint = await blueprintService.getBlueprint(id);

    return NextResponse.json({
      success: true,
      data: blueprint,
    });
  } catch (err: any) {
    if (err instanceof BlueprintNotFoundError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve blueprint" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateMutationOrigin(req);

    const { id } = await params;
    const body = await req.json();

    const updated = await blueprintService.updateBlueprint(id, body);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    if (err instanceof BlueprintNotFoundError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    if (err instanceof BlueprintApprovedImmutableError) {
      return NextResponse.json(
        { success: false, error: err.message, code: "APPROVED_IMMUTABLE" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update blueprint" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateMutationOrigin(req);

    const { id } = await params;
    await blueprintService.deleteBlueprint(id);

    return NextResponse.json({
      success: true,
      message: `Blueprint "${id}" deleted successfully.`,
    });
  } catch (err: any) {
    if (err instanceof BlueprintNotFoundError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete blueprint" },
      { status: 500 }
    );
  }
}

