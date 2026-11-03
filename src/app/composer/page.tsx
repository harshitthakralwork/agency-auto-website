import React from "react";
import { db } from "@/lib/db";
import { RegistryService } from "@/modules/registry/service";
import { CompositionService } from "@/modules/composition/service";
import { PageComposerView } from "@/components/composer/page-composer-view";

export const metadata = {
  title: "Page Composition Engine | Agency Website Engine",
  description: "Visual Page Composer mapping blueprints and components into multi-page site architectures.",
};

export default async function ComposerPage(props: {
  searchParams: Promise<{ project?: string }>;
}) {
  const searchParams = await props.searchParams;
  const projects = await db.project.findMany({
    select: { id: true, name: true, category: true, experienceLevel: true },
    orderBy: { updatedAt: "desc" },
  });

  const selectedProjectId = searchParams.project || projects[0]?.id || "";

  const blueprints = await db.websiteBlueprint.findMany({
    select: { id: true, title: true, projectId: true },
    orderBy: { updatedAt: "desc" },
  });

  const componentDefinitions = RegistryService.getAllDefinitions();

  const initialPages = selectedProjectId
    ? await CompositionService.getProjectCompositions(selectedProjectId)
    : [];

  return (
    <PageComposerView
      initialPages={initialPages}
      projects={projects}
      blueprints={blueprints}
      componentDefinitions={componentDefinitions}
      currentProjectId={selectedProjectId}
    />
  );
}

