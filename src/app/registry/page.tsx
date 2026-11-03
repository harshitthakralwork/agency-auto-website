import React from "react";
import { RegistryService } from "@/modules/registry/service";
import { db } from "@/lib/db";
import { RegistryStudioView } from "@/components/registry/registry-studio-view";

export const metadata = {
  title: "Component Registry | Agency Website Engine",
  description: "Production Component Registry across 7 families with adaptive category & token preview.",
};

export default async function RegistryPage() {
  const definitions = await RegistryService.queryComponents();
  const projects = await db.project.findMany({
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return <RegistryStudioView initialDefinitions={definitions} projects={projects} />;
}

