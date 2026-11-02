import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { db } from "@/lib/db";
import { WebsiteExportEngine } from "@/modules/export/engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await db.project.findUnique({
      where: { id },
      select: { id: true, slug: true, name: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {}

    const defaultExportDir = path.join(
      process.cwd(),
      "dist",
      "exported-sites",
      project.slug
    );
    const outputDirectory = body.outputDirectory || defaultExportDir;

    const result = await WebsiteExportEngine.exportProject({
      projectId: id,
      outputDirectory,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to export standalone website",
      },
      { status: 500 }
    );
  }
}
