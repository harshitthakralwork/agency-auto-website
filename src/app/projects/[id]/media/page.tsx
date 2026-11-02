import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MediaStudioView } from "@/components/media-studio/media-studio-view";

export default async function MediaStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: {
      designConfig: true,
      assets: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return <MediaStudioView project={project} initialAssets={project.assets} />;
}
