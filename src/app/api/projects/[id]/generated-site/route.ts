import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectGeneratedDir = path.resolve(process.cwd(), "storage", "generated", id);

    if (!fs.existsSync(projectGeneratedDir)) {
      return NextResponse.json(
        { error: "No generated site found for this project" },
        { status: 404 }
      );
    }

    // Find latest build directory
    const builds = fs.readdirSync(projectGeneratedDir).filter((f) => {
      return (
        fs.statSync(path.join(projectGeneratedDir, f)).isDirectory() &&
        f.startsWith("build_")
      );
    });

    if (builds.length === 0) {
      return NextResponse.json(
        { error: "No completed builds found for this project" },
        { status: 404 }
      );
    }

    // Sort descending by time
    builds.sort().reverse();
    const latestBuild = builds[0];
    const buildPath = path.join(projectGeneratedDir, latestBuild);
    const manifestPath = path.join(buildPath, "build-manifest.json");

    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json(
        { error: "Build manifest missing" },
        { status: 404 }
      );
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

    // Check if download of zip requested
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.get("download") === "true") {
      const zipFiles = fs
        .readdirSync(projectGeneratedDir)
        .filter((f) => f.endsWith(".zip") && f.includes(latestBuild));

      if (zipFiles.length > 0) {
        const zipFile = path.join(projectGeneratedDir, zipFiles[0]);
        const zipBuffer = fs.readFileSync(zipFile);
        return new NextResponse(zipBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${zipFiles[0]}"`,
          },
        });
      }
    }

    return NextResponse.json({
      latestBuild,
      buildPath,
      manifest,
    });
  } catch (error: any) {
    console.error("Failed to retrieve generated site:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve generated site" },
      { status: 500 }
    );
  }
}

