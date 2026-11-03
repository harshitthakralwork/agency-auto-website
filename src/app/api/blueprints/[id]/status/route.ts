import { NextRequest, NextResponse } from "next/server";
import { validateMutationOrigin } from "@/modules/intelligence";
import {
  blueprintService,
  BlueprintNotFoundError,
  InvalidStatusTransitionError,
} from "@/modules/blueprint";
import { TransitionStatusInputSchema } from "@/modules/blueprint/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateMutationOrigin(req);

    const { id } = await params;
    const body = await req.json();
    const parsed = TransitionStatusInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid status transition data" },
        { status: 400 }
      );
    }

    const { status, approvedBy, notes } = parsed.data;

    const updated = await blueprintService.transitionStatus(id, status, {
      approvedBy,
      changeSummary: notes,
    });

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
    if (err instanceof InvalidStatusTransitionError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update blueprint status" },
      { status: 500 }
    );
  }
}

