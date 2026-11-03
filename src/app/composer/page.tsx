import React from "react";
import { db } from "@/lib/db";
import { RegistryService } from "@/modules/registry/service";
import { CompositionService } from "@/modules/composition/service";
import { PageComposerView } from "@/components/composer/page-composer-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Page Composition Engine | Agency Website Engine",
  description: "Visual Page Composer mapping blueprints and components into multi-page site architectures.",
};

export default async function ComposerPage(props: {
  searchParams: Promise<{ project?: string }>;
}) {
  const searchParams = await props.searchParams;

  let projects: any[] = [];
  try {
    projects = await db.project.findMany({
      select: { id: true, name: true, category: true, experienceLevel: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not load projects from database:", err);
  }

  const selectedProjectId = searchParams.project || projects[0]?.id || "";

  let blueprints: any[] = [];
  try {
    blueprints = await db.websiteBlueprint.findMany({
      select: { id: true, title: true, projectId: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.warn("Could not load blueprints from database:", err);
  }

  const componentDefinitions = RegistryService.getAllDefinitions();

  let initialPages: any[] = [];
  if (selectedProjectId) {
    try {
      initialPages = await CompositionService.getProjectCompositions(selectedProjectId);
    } catch (err) {
      console.warn("Could not load compositions from database:", err);
    }
  }

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

