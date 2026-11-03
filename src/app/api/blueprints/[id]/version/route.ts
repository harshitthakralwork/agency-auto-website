import { NextRequest, NextResponse } from "next/server";
import { validateMutationOrigin } from "@/modules/intelligence";
import { blueprintService, BlueprintNotFoundError } from "@/modules/blueprint";
import { BranchVersionInputSchema } from "@/modules/blueprint/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    validateMutationOrigin(req);

    const { id } = await params;
    const body = await req.json();
    const parsed = BranchVersionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid version branch data" },
        { status: 400 }
      );
    }

    const branched = await blueprintService.branchNewVersion(id, parsed.data.changeSummary);

    return NextResponse.json({
      success: true,
      data: branched,
    });
  } catch (err: any) {
    if (err instanceof BlueprintNotFoundError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to branch new blueprint version" },
      { status: 500 }
    );
  }
}

