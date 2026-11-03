import React from "react";
import { notFound } from "next/navigation";
import { blueprintService, BlueprintNotFoundError } from "@/modules/blueprint";
import { BlueprintEditorView } from "@/components/blueprint/blueprint-editor-view";

export const dynamic = "force-dynamic";

interface BlueprintPageProps {
  params: Promise<{ id: string }>;
}

export default async function BlueprintDetailPage({ params }: BlueprintPageProps) {
  const { id } = await params;

  try {
    const blueprint = await blueprintService.getBlueprint(id);
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 max-w-7xl mx-auto">
        <BlueprintEditorView initialBlueprint={blueprint} />
      </div>
    );
  } catch (err: any) {
    if (err instanceof BlueprintNotFoundError) {
      notFound();
    }
    throw err;
  }
}

