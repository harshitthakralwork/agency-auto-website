import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  ThreeDSceneConfig,
  createDefaultThreeDSceneConfig,
  threeDSceneConfigSchema,
} from "@/modules/three-d/scene";
import { SceneStudioView } from "@/components/three-d-studio/SceneStudioView";

export default async function ProjectThreeDStudioPage({
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
        where: {
          assetType: "MODEL_3D",
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Parse sceneConfig or generate standard defaults
  let sceneConfig: ThreeDSceneConfig = createDefaultThreeDSceneConfig();

  if (project.designConfig?.threeDPreferences) {
    try {
      const parsedPrefs = JSON.parse(project.designConfig.threeDPreferences);
      if (parsedPrefs && parsedPrefs.sceneConfig) {
        const validated = threeDSceneConfigSchema.safeParse(parsedPrefs.sceneConfig);
        if (validated.success) {
          sceneConfig = validated.data;
        }
      }
    } catch {
      // Fallback to default
    }
  }

  const availableModels = project.assets.map((a) => ({
    id: a.id,
    name: a.name,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    assignedSlot: a.assignedSlot,
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <SceneStudioView
        project={{
          id: project.id,
          name: project.name,
          slug: project.slug,
          category: project.category,
          experienceLevel: project.experienceLevel,
        }}
        initialConfig={sceneConfig}
        availableModels={availableModels}
      />
    </div>
  );
}
