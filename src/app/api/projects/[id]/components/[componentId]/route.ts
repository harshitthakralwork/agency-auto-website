import { NextRequest, NextResponse } from "next/server";
import { RegistryService } from "@/modules/registry/service";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; componentId: string }> }
) {
  try {
    const { id, componentId } = await context.params;
    const removed = await RegistryService.removeComponentFromProject(id, componentId);

    if (!removed) {
      return NextResponse.json(
        { success: false, error: "Component not found in project library" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      projectId: id,
      componentId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove component from project" },
      { status: 500 }
    );
  }
}

