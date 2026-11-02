import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectDetailView } from "@/components/projects/project-detail-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      designConfig: true,
    },
  });

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
