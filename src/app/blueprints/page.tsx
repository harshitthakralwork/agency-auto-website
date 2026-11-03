import React from "react";
import { db } from "@/lib/db";
import { BlueprintCatalogView } from "@/components/blueprint/blueprint-catalog-view";

export const dynamic = "force-dynamic";

export default async function BlueprintsPage() {
  const [blueprints, sessions] = await Promise.all([
    db.websiteBlueprint.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        researchSession: {
          select: { id: true, targetDomain: true, targetUrl: true },
        },
      },
    }),
    db.researchSession.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 20,
      select: {
        id: true,
        targetDomain: true,
        targetUrl: true,
        industry: true,
        status: true,
      },
    }),
  ]);

  const serializedBlueprints = blueprints.map((bp) => ({
    id: bp.id,
    title: bp.title,
    slug: bp.slug,
    version: bp.version,
    status: bp.status as any,
    industry: bp.industry,
    experienceLevel: bp.experienceLevel as any,
    researchSessionId: bp.researchSessionId,
    activeDirectionId: bp.activeDirectionId,
    changeSummary: bp.changeSummary,
    createdAt: bp.createdAt.toISOString(),
    updatedAt: bp.updatedAt.toISOString(),
    project: bp.project,
    researchSession: bp.researchSession,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 max-w-7xl mx-auto">
      <BlueprintCatalogView
        initialBlueprints={serializedBlueprints}
        availableSessions={sessions}
      />
    </div>
  );
}

