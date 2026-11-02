import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DesignStudioView } from "@/components/design-studio/design-studio-view";

export default async function ProjectDesignStudioPage({
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

  return <DesignStudioView project={project} />;
}
