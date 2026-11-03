import { NextRequest, NextResponse } from "next/server";
import { validateMutationOrigin } from "@/modules/intelligence";
import {
  blueprintService,
  BlueprintNotFoundError,
  BlueprintApprovedImmutableError,
} from "@/modules/blueprint";
import { z } from "zod";

const applyDirectionSchema = z.object({
  directionId: z.string().min(1, "directionId is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateMutationOrigin(req);

    const { id } = await params;
    const body = await req.json();
    const parsed = applyDirectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid direction payload" },
        { status: 400 }
      );
    }

    const updated = await blueprintService.applyDesignDirection(id, parsed.data.directionId);

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
      { success: false, error: err.message || "Failed to apply design direction" },
      { status: 400 }
    );
  }
}

