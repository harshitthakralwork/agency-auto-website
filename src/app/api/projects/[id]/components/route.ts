import { NextRequest, NextResponse } from "next/server";
import { RegistryService } from "@/modules/registry/service";
import { ProjectComponentBindingSchema } from "@/modules/registry/schema";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const library = await RegistryService.getProjectComponentLibrary(id);

    return NextResponse.json({
      success: true,
      projectId: id,
      count: library.length,
      library,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project library" },
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

    const parseResult = ProjectComponentBindingSchema.safeParse({
      ...body,
      projectId: id,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid component binding payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { componentId, variantId, customProps } = parseResult.data;

    const binding = await RegistryService.addComponentToProject(
      id,
      componentId,
      variantId,
      customProps
    );

    return NextResponse.json({
      success: true,
      binding,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to bind component to project" },
      { status: 500 }
    );
  }
}

