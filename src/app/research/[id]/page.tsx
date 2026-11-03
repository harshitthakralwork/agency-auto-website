import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EvidenceInspectorView } from "@/components/research/evidence-inspector-view";

interface ResearchDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ResearchDetailPageProps) {
  const { id } = await params;
  const session = await db.researchSession.findUnique({ where: { id } });
  return {
    title: session
      ? `Evidence: ${session.targetDomain} | Research Studio`
      : "Research Session Not Found",
  };
}

export default async function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const { id } = await params;
  const session = await db.researchSession.findUnique({
    where: { id },
  });

  if (!session) {
    notFound();
  }

  const sessionData = {
    id: session.id,
    targetUrl: session.targetUrl,
    targetDomain: session.targetDomain,
    status: session.status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED",
    evidenceId: session.evidenceId,
    errorMessage: session.errorMessage,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    projectId: session.projectId,
    industry: session.industry,
    selectedFindingsJson: (session as any).selectedFindingsJson || "[]",
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <EvidenceInspectorView session={sessionData} />
    </div>
  );
}

