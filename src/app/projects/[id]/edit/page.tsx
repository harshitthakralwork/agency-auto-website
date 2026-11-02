import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProjectEditForm } from "@/components/projects/project-edit-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  return <ProjectEditForm project={project} />;
}
