import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LivePreviewClient } from "@/components/preview/live-preview-client";

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      designConfig: true,
      assets: true,
    },
  });

  if (!project) {
    notFound();
  }

  return <LivePreviewClient project={project} />;
}
