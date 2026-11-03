import { db } from "@/lib/db";
import { RegistryService } from "../registry/service";
import { ContentSynthesizer, BlueprintContentContext } from "./copy-synthesizer";
import { AssetSlotMatcher, getComponentSlotRequirements } from "./slot-matcher";
import {
  ProjectAssetAuditSummary,
  PageAssetAuditReport,
  MatchedSlotResult,
  ContentEnrichmentResult,
} from "./types";

export class ContentAssetService {
  /**
   * Enriches all composed pages for a project by synthesizing tailored copy from the linked Blueprint & Research.
   */
  public static async enrichProjectCompositions(
    projectId: string
  ): Promise<{ enrichedSections: ContentEnrichmentResult[] }> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        blueprints: {
          orderBy: { version: "desc" },
          take: 1,
        },
        pageCompositions: {
          include: {
            sections: true,
          },
        },
      },
    });

    if (!project) throw new Error(`Project '${projectId}' not found`);

    const latestBlueprint = project.blueprints[0];
    const profile = latestBlueprint?.businessProfileJson
      ? JSON.parse(latestBlueprint.businessProfileJson)
      : {};

    const context: BlueprintContentContext = {
      companyName: profile.companyName || project.name,
      tagline: profile.tagline || "Precision & Distinction",
      description: profile.description || project.description || "",
      industry: project.category,
      targetAudience: profile.targetAudience || project.targetAudience || "Discerning Clients",
      services: Array.isArray(profile.services)
        ? profile.services
        : project.services
        ? project.services.split(",").map((s) => s.trim())
        : [],
      usps: Array.isArray(profile.usps) ? profile.usps : [],
      contactChannels: profile.contactChannels || {},
    };

    const enrichedResults: ContentEnrichmentResult[] = [];

    for (const page of project.pageCompositions) {
      for (const section of page.sections) {
        const compDef = RegistryService.getDefinitionById(section.componentId);
        if (!compDef) continue;

        const { props, enrichmentResult } = ContentSynthesizer.enrichComponentCopy(
          compDef,
          context
        );

        if (enrichmentResult.enrichedFields.length > 0) {
          const currentProps = section.propsOverrideJson
            ? JSON.parse(section.propsOverrideJson)
            : {};
          const mergedProps = { ...currentProps, ...props };

          await db.pageSectionComposition.update({
            where: { id: section.id },
            data: { propsOverrideJson: JSON.stringify(mergedProps) },
          });

          enrichmentResult.pageId = page.id;
          enrichmentResult.sectionId = section.id;
          enrichedResults.push(enrichmentResult);
        }
      }
    }

    return { enrichedSections: enrichedResults };
  }

  /**
   * Audits media slot fulfillment across all pages and injects matched assets or SVG fallbacks.
   */
  public static async auditAndMatchProjectAssetSlots(
    projectId: string
  ): Promise<ProjectAssetAuditSummary> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        assets: true,
        pageCompositions: {
          include: {
            sections: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!project) throw new Error(`Project '${projectId}' not found`);

    const pageReports: PageAssetAuditReport[] = [];
    let totalReq = 0;
    let totalMatched = 0;

    for (const page of project.pageCompositions) {
      const slotDetails: MatchedSlotResult[] = [];

      for (const section of page.sections) {
        const reqs = getComponentSlotRequirements(section.componentId);

        for (const req of reqs) {
          if (req.required) totalReq++;

          const match = AssetSlotMatcher.matchSlot(
            req,
            project.assets,
            project.category,
            project.name
          );

          if (match.status === "MATCHED") {
            if (req.required) totalMatched++;
          }

          slotDetails.push(match);

          // Inject asset URL or fallback data URI into section propsOverride
          const currentProps = section.propsOverrideJson
            ? JSON.parse(section.propsOverrideJson)
            : {};

          const assetUrlToUse = match.assetUrl || match.fallbackSvgDataUri;

          if (assetUrlToUse) {
            let propKey = "imageUrl";
            if (req.slotName === "HERO_BACKGROUND") propKey = "imageUrl";
            else if (req.slotName === "BEFORE_SLOT") propKey = "beforeImage";
            else if (req.slotName === "AFTER_SLOT") propKey = "afterImage";
            else if (req.slotName === "POSTER_FALLBACK") propKey = "posterUrl";

            currentProps[propKey] = assetUrlToUse;

            await db.pageSectionComposition.update({
              where: { id: section.id },
              data: { propsOverrideJson: JSON.stringify(currentProps) },
            });
          }
        }
      }

      const matchedCount = slotDetails.filter((s) => s.status === "MATCHED").length;
      pageReports.push({
        pageId: page.id,
        pageTitle: page.title,
        slug: page.slug,
        totalSlots: slotDetails.length,
        matchedSlots: matchedCount,
        missingSlots: slotDetails.length - matchedCount,
        slotDetails,
      });
    }

    const overallFulfillment =
      totalReq > 0 ? Math.round((totalMatched / totalReq) * 100) : 100;

    return {
      projectId: project.id,
      projectName: project.name,
      overallFulfillmentPercent: overallFulfillment,
      totalRequiredSlots: totalReq,
      totalMatchedSlots: totalMatched,
      pages: pageReports,
    };
  }
}

