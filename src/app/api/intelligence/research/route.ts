import { NextRequest, NextResponse } from "next/server";
import { websiteIntelligence, validateMutationOrigin } from "@/modules/intelligence";
import { z } from "zod";

const createResearchSchema = z.object({
  targetUrl: z
    .string()
    .max(2048, "Target URL must not exceed 2048 characters.")
    .url("A valid HTTP or HTTPS URL is required."),
  projectId: z.string().optional(),
  industry: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Enforce loopback Origin/Host validation for mutation endpoints (anti-CSRF)
    validateMutationOrigin(req);

    const body = await req.json();
    const parsed = createResearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const session = await websiteIntelligence.analyzeWebsite({
      targetUrl: parsed.data.targetUrl,
      projectId: parsed.data.projectId,
      industry: parsed.data.industry,
    });

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (err: any) {
    const statusCode =
      err.code === "UNTRUSTED_ORIGIN"
        ? 403
        : err.code === "CONCURRENCY_LIMIT_EXCEEDED"
        ? 429
        : err.code === "SSRF_BLOCKED" || err.code === "EGRESS_BLOCKED"
        ? 403
        : err.code === "EGRESS_PROXY_UNAVAILABLE"
        ? 503
        : err.code === "INVALID_URL"
        ? 400
        : err.code === "PROCESS_TIMEOUT"
        ? 504
        : 500;

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Website research failed",
        code: err.code || "INTERNAL_ERROR",
      },
      { status: statusCode }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const sessions = await websiteIntelligence.listSessions({ projectId, limit });

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list research sessions" },
      { status: 500 }
    );
  }
}

