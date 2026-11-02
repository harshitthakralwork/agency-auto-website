import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TimelineStudioView } from "@/components/three-d-animation/TimelineStudioView";

export default async function ProjectThreeDAnimationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <TimelineStudioView projectId={project.id} />
    </div>
  );
}
