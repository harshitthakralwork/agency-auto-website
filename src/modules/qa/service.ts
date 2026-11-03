import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { QAValidator } from "./validator";
import { QAAuditResult } from "./types";
import { WebsiteGeneratorService } from "../generator/service";

export class QAService {
  /**
   * Executes a full QA validation audit for a project website.
   * Uses existing build output or generates a fresh build if none exists.
   */
  public static async auditProject(
    projectId: string,
    buildDirectory?: string
  ): Promise<QAAuditResult> {
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error(`Project with ID "${projectId}" not found.`);
    }

    let targetDir = buildDirectory;

    if (!targetDir) {
      const generatedBase = path.resolve(process.cwd(), "storage", "generated", projectId);
      if (fs.existsSync(generatedBase)) {
        const builds = fs.readdirSync(generatedBase).filter((f) => {
          return (
            fs.statSync(path.join(generatedBase, f)).isDirectory() &&
            f.startsWith("build_")
          );
        });

        if (builds.length > 0) {
          builds.sort().reverse();
          targetDir = path.join(generatedBase, builds[0]);
        }
      }
    }

    // If no existing build was found, generate one now
    if (!targetDir || !fs.existsSync(/*turbopackIgnore: true*/ targetDir)) {
      const genResult = await WebsiteGeneratorService.generateWebsite(projectId, {
        projectId,
        zip: false,
      });
      targetDir = genResult.outputDirectory;
    }

    return QAValidator.auditBuildDirectory(project.id, project.name, targetDir);
  }
}
