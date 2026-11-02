import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { VideoProcessingQueue } from "@/modules/cinematic/video/queue";

const createJobSchema = z.object({
  videoAssetId: z.string().min(1, "videoAssetId is required"),
  targetFps: z.number().int().min(1).max(30).optional().default(24),
  maxFrames: z.number().int().min(10).max(240).optional().default(60),
  quality: z.enum(["low", "medium", "high"]).optional().default("high"),
  outputFormat: z.enum(["webp", "jpg", "png"]).optional().default("webp"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { videoAssetId, targetFps, maxFrames, quality, outputFormat } = parsed.data;

    const jobId = await VideoProcessingQueue.createJob(projectId, videoAssetId, {
      targetFps,
      maxFrames,
      quality,
      outputFormat,
    });

    return NextResponse.json(
      {
        message: "Video extraction job created successfully",
        jobId,
        status: "QUEUED",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to create video job:", error);
    const sanitizedMsg = (error.message || "Failed to create video processing job")
      .replace(/[A-Za-z]:\\[^\s:]+/gi, "[internal path]")
      .replace(/\/[\w.-]+(\/[\w.-]+)+/g, "[internal path]");
    return NextResponse.json(
      { error: sanitizedMsg },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const jobs = await VideoProcessingQueue.listProjectJobs(projectId);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error("Failed to list video jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch video processing jobs" },
      { status: 500 }
    );
  }
}
