import { db } from "@/lib/db";
import { ProjectCatalog } from "@/components/projects/project-catalog";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      designConfig: {
        select: {
          preset: true,
          primaryColor: true,
          headingFont: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Client Projects Catalog
        </h1>
        <p className="text-sm text-slate-400">
          Manage, search, configure, and review all active client website builds across all 6 industry packs.
        </p>
      </div>

      <ProjectCatalog initialProjects={projects} />
    </div>
  );
}
