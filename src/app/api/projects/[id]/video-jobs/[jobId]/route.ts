import { NextRequest, NextResponse } from "next/server";
import { VideoProcessingQueue } from "@/modules/cinematic/video/queue";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: projectId, jobId } = await params;

    const job = await VideoProcessingQueue.getJob(jobId, projectId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Failed to fetch job:", error);
    return NextResponse.json(
      { error: "Failed to fetch video processing job status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  try {
    const { id: projectId, jobId } = await params;

    await VideoProcessingQueue.deleteJob(jobId, projectId);

    return NextResponse.json({ message: "Job cancelled and removed" });
  } catch (error: any) {
    console.error("Failed to delete job:", error);
    const sanitizedMsg = (error.message || "Failed to delete video processing job")
      .replace(/[A-Za-z]:\\[^\s:]+/gi, "[internal path]")
      .replace(/\/[\w.-]+(\/[\w.-]+)+/g, "[internal path]");
    return NextResponse.json(
      { error: sanitizedMsg },
      { status: 500 }
    );
  }
}

