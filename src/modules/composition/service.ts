import { db } from "@/lib/db";
import { RegistryService } from "../registry/service";
import {
  PageCompositionData,
  PageSectionCompositionData,
  CreatePageInput,
  UpdatePageInput,
  AddSectionInput,
  UpdateSectionInput,
  ResponsiveSettings,
} from "./types";

export class PageNotFoundError extends Error {
  constructor(id: string) {
    super(`Page composition with ID '${id}' not found`);
    this.name = "PageNotFoundError";
  }
}

export class SectionNotFoundError extends Error {
  constructor(id: string) {
    super(`Section composition with ID '${id}' not found`);
    this.name = "SectionNotFoundError";
  }
}

// Maps blueprint section types to optimal registered component IDs
function resolveDefaultComponent(sectionType: string, experienceLevel: string): string {
  const t = sectionType.toLowerCase().trim();

  if (t === "hero") {
    if (experienceLevel === "IMMERSIVE_3D") return "hero-3d";
    if (experienceLevel === "CINEMATIC") return "hero-cinematic";
    return "hero-split";
  }
  if (t === "about") return "business-about";
  if (t === "services") return "business-services";
  if (t === "features") return "business-features";
  if (t === "benefits") return "business-benefits";
  if (t === "process") return "business-process";
  if (t === "stats") return "business-stats";
  if (t === "team") return "business-team";
  if (t === "trust-badges" || t === "certifications") return "business-trust-badges";
  if (t === "contact" || t === "inquiry") return "conversion-contact-form";
  if (t === "lead-capture" || t === "guide") return "conversion-lead-capture";
  if (t === "booking" || t === "reservation") return "conversion-booking-cta";
  if (t === "consultation") return "conversion-consultation-cta";
  if (t === "pricing" || t === "pricing-table") return "content-pricing-table";
  if (t === "pricing-cta") return "conversion-pricing-cta";
  if (t === "whatsapp") return "conversion-whatsapp-cta";
  if (t === "testimonials") return "social-proof-testimonials-carousel";
  if (t === "reviews") return "social-proof-reviews-grid";
  if (t === "case-studies") return "social-proof-case-studies";
  if (t === "gallery") return "media-gallery-grid";
  if (t === "masonry") return "media-masonry-gallery";
  if (t === "before-after" || t === "comparison") return "media-before-after-slider";
  if (t === "video" || t === "video-showcase") return "media-video-showcase";
  if (t === "faq") return "content-faq-accordion";
  if (t === "blog" || t === "articles") return "content-blog-preview";
  if (t === "location" || t === "map") return "content-location-map";
  if (t === "opening-hours" || t === "schedule") return "content-opening-hours";
  if (t === "3d-model" || t === "model") return "advanced-interactive-3d-model";
  if (t === "scroll-storytelling") return "advanced-scroll-storytelling";
  if (t === "canvas-sequence") return "advanced-canvas-frame-sequences";

  return "business-features";
}

function mapSectionRow(r: any): PageSectionCompositionData {
  return {
    id: r.id,
    pageCompositionId: r.pageCompositionId,
    componentId: r.componentId,
    variantId: r.variantId,
    order: r.order,
    enabled: r.enabled,
    customName: r.customName,
    propsOverride: r.propsOverrideJson ? JSON.parse(r.propsOverrideJson) : {},
    responsiveSettings: r.responsiveSettingsJson ? JSON.parse(r.responsiveSettingsJson) : {},
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function mapPageRow(p: any): PageCompositionData {
  return {
    id: p.id,
    projectId: p.projectId,
    blueprintId: p.blueprintId,
    slug: p.slug,
    title: p.title,
    routePriority: p.routePriority,
    navigationPlacement: p.navigationPlacement,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    sections: (p.sections || []).map(mapSectionRow),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export class CompositionService {
  /**
   * Generates or syncs full page composition trees directly from an approved or draft WebsiteBlueprint.
   */
  public static async generateFromBlueprint(
    blueprintId: string,
    projectId: string
  ): Promise<PageCompositionData[]> {
    const blueprint = await db.websiteBlueprint.findUnique({
      where: { id: blueprintId },
    });

    if (!blueprint) {
      throw new Error(`Blueprint '${blueprintId}' not found`);
    }

    // Ensure components in registry are synced in DB
    await RegistryService.syncDatabase();

    const sitemap = blueprint.sitemapJson ? JSON.parse(blueprint.sitemapJson) : [];
    const pageHierarchy = blueprint.pageHierarchyJson
      ? JSON.parse(blueprint.pageHierarchyJson)
      : [];

    const pagesToGenerate = sitemap.length > 0 ? sitemap : [
      { id: "home", title: "Home", slug: "/", routePriority: "HIGH", navigationPlacement: "PRIMARY" },
      { id: "services", title: "Services", slug: "/services", routePriority: "MEDIUM", navigationPlacement: "PRIMARY" },
      { id: "contact", title: "Contact", slug: "/contact", routePriority: "HIGH", navigationPlacement: "PRIMARY" },
    ];

    const results: PageCompositionData[] = [];

    for (const pageItem of pagesToGenerate) {
      const slug = pageItem.slug || "/";
      const title = pageItem.title || "Page";

      // Upsert page composition
      const pageRow = await db.pageComposition.upsert({
        where: {
          projectId_slug: {
            projectId,
            slug,
          },
        },
        update: {
          title,
          blueprintId,
          routePriority: pageItem.routePriority || "MEDIUM",
          navigationPlacement: pageItem.navigationPlacement || "PRIMARY",
          seoTitle: `${title} | Agency Production`,
          seoDescription: `Official ${title} page composed from blueprint.`,
        },
        create: {
          projectId,
          blueprintId,
          slug,
          title,
          routePriority: pageItem.routePriority || "MEDIUM",
          navigationPlacement: pageItem.navigationPlacement || "PRIMARY",
          seoTitle: `${title} | Agency Production`,
          seoDescription: `Official ${title} page composed from blueprint.`,
        },
      });

      // Find section requirements from pageHierarchy or construct sensible defaults
      const hierarchyItem = pageHierarchy.find(
        (h: any) => h.slug === slug || h.pageId === pageItem.id
      );

      let sectionsToCreate: Array<{ sectionType: string; name: string }> = [];

      if (hierarchyItem && Array.isArray(hierarchyItem.sections) && hierarchyItem.sections.length > 0) {
        sectionsToCreate = hierarchyItem.sections.map((s: any) => ({
          sectionType: s.sectionType || "features",
          name: s.name || s.heading || "Section",
        }));
      } else {
        // Sensible default section templates by route slug
        if (slug === "/" || slug === "") {
          sectionsToCreate = [
            { sectionType: "hero", name: "Hero Main" },
            { sectionType: "about", name: "About Story" },
            { sectionType: "services", name: "Core Services" },
            { sectionType: "testimonials", name: "Client Testimonials" },
            { sectionType: "contact", name: "Inquiry Contact" },
          ];
        } else if (slug.includes("service")) {
          sectionsToCreate = [
            { sectionType: "hero", name: "Services Overview Hero" },
            { sectionType: "services", name: "Comprehensive Offerings" },
            { sectionType: "pricing", name: "Transparent Tiers" },
            { sectionType: "faq", name: "Service FAQs" },
            { sectionType: "contact", name: "Book Consultation" },
          ];
        } else if (slug.includes("contact")) {
          sectionsToCreate = [
            { sectionType: "hero", name: "Contact Header" },
            { sectionType: "contact", name: "Confidential Inquiry Form" },
            { sectionType: "location", name: "Directions & Campus Map" },
            { sectionType: "opening-hours", name: "Operating Hours" },
          ];
        } else {
          sectionsToCreate = [
            { sectionType: "hero", name: `${title} Header` },
            { sectionType: "features", name: "Key Features" },
            { sectionType: "contact", name: "Inquire Now" },
          ];
        }
      }

      // Check existing sections count
      const existingSections = await db.pageSectionComposition.findMany({
        where: { pageCompositionId: pageRow.id },
      });

      if (existingSections.length === 0) {
        let order = 0;
        for (const sec of sectionsToCreate) {
          const compId = resolveDefaultComponent(sec.sectionType, blueprint.experienceLevel);
          const compDef = RegistryService.getDefinitionById(compId);
          const defaultVariant = compDef?.variants[0]?.id || null;

          await db.pageSectionComposition.create({
            data: {
              pageCompositionId: pageRow.id,
              componentId: compId,
              variantId: defaultVariant,
              order,
              enabled: true,
              customName: sec.name,
              propsOverrideJson: JSON.stringify({}),
              responsiveSettingsJson: JSON.stringify({
                paddingY: "medium",
                hideOnMobile: false,
              }),
            },
          });
          order++;
        }
      }

      const fullPage = await db.pageComposition.findUnique({
        where: { id: pageRow.id },
        include: {
          sections: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (fullPage) {
        results.push(mapPageRow(fullPage));
      }
    }

    return results;
  }

  /**
   * Get all page compositions for a project
   */
  public static async getProjectCompositions(projectId: string): Promise<PageCompositionData[]> {
    const pages = await db.pageComposition.findMany({
      where: { projectId },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return pages.map(mapPageRow);
  }

  /**
   * Get single page composition by ID
   */
  public static async getPageComposition(pageId: string): Promise<PageCompositionData> {
    const page = await db.pageComposition.findUnique({
      where: { id: pageId },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!page) {
      throw new PageNotFoundError(pageId);
    }

    return mapPageRow(page);
  }

  /**
   * Create custom page composition
   */
  public static async createPage(input: CreatePageInput): Promise<PageCompositionData> {
    const page = await db.pageComposition.create({
      data: {
        projectId: input.projectId,
        blueprintId: input.blueprintId || null,
        slug: input.slug,
        title: input.title,
        routePriority: input.routePriority || "MEDIUM",
        navigationPlacement: input.navigationPlacement || "PRIMARY",
        seoTitle: input.seoTitle || `${input.title} | Agency Site`,
        seoDescription: input.seoDescription || `Page ${input.title}`,
      },
      include: {
        sections: true,
      },
    });

    return mapPageRow(page);
  }

  /**
   * Update page metadata
   */
  public static async updatePage(
    pageId: string,
    input: UpdatePageInput
  ): Promise<PageCompositionData> {
    const existing = await db.pageComposition.findUnique({ where: { id: pageId } });
    if (!existing) throw new PageNotFoundError(pageId);

    const updated = await db.pageComposition.update({
      where: { id: pageId },
      data: {
        title: input.title !== undefined ? input.title : existing.title,
        slug: input.slug !== undefined ? input.slug : existing.slug,
        routePriority: input.routePriority !== undefined ? input.routePriority : existing.routePriority,
        navigationPlacement: input.navigationPlacement !== undefined ? input.navigationPlacement : existing.navigationPlacement,
        seoTitle: input.seoTitle !== undefined ? input.seoTitle : existing.seoTitle,
        seoDescription: input.seoDescription !== undefined ? input.seoDescription : existing.seoDescription,
      },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });

    return mapPageRow(updated);
  }

  /**
   * Delete a page composition and cascade its sections
   */
  public static async deletePage(pageId: string): Promise<boolean> {
    try {
      await db.pageComposition.delete({
        where: { id: pageId },
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Add a section to an existing page
   */
  public static async addSection(
    pageId: string,
    input: AddSectionInput
  ): Promise<PageSectionCompositionData> {
    const page = await db.pageComposition.findUnique({ where: { id: pageId } });
    if (!page) throw new PageNotFoundError(pageId);

    // Compute order if not specified
    let targetOrder = input.order;
    if (targetOrder === undefined) {
      const highest = await db.pageSectionComposition.findFirst({
        where: { pageCompositionId: pageId },
        orderBy: { order: "desc" },
      });
      targetOrder = highest ? highest.order + 1 : 0;
    }

    const compDef = RegistryService.getDefinitionById(input.componentId);
    const variantId = input.variantId || compDef?.variants[0]?.id || null;

    const row = await db.pageSectionComposition.create({
      data: {
        pageCompositionId: pageId,
        componentId: input.componentId,
        variantId,
        order: targetOrder,
        enabled: true,
        customName: input.customName || compDef?.name || "Section",
        propsOverrideJson: JSON.stringify(input.propsOverride || {}),
        responsiveSettingsJson: JSON.stringify(
          input.responsiveSettings || { paddingY: "medium", hideOnMobile: false }
        ),
      },
    });

    return mapSectionRow(row);
  }

  /**
   * Update an existing section
   */
  public static async updateSection(
    sectionId: string,
    input: UpdateSectionInput
  ): Promise<PageSectionCompositionData> {
    const existing = await db.pageSectionComposition.findUnique({ where: { id: sectionId } });
    if (!existing) throw new SectionNotFoundError(sectionId);

    const updated = await db.pageSectionComposition.update({
      where: { id: sectionId },
      data: {
        variantId: input.variantId !== undefined ? input.variantId : existing.variantId,
        customName: input.customName !== undefined ? input.customName : existing.customName,
        enabled: input.enabled !== undefined ? input.enabled : existing.enabled,
        order: input.order !== undefined ? input.order : existing.order,
        propsOverrideJson: input.propsOverride !== undefined ? JSON.stringify(input.propsOverride) : existing.propsOverrideJson,
        responsiveSettingsJson: input.responsiveSettings !== undefined ? JSON.stringify(input.responsiveSettings) : existing.responsiveSettingsJson,
      },
    });

    return mapSectionRow(updated);
  }

  /**
   * Reorder all sections for a page
   */
  public static async reorderSections(
    pageId: string,
    orderedSectionIds: string[]
  ): Promise<PageSectionCompositionData[]> {
    const page = await db.pageComposition.findUnique({ where: { id: pageId } });
    if (!page) throw new PageNotFoundError(pageId);

    for (let index = 0; index < orderedSectionIds.length; index++) {
      const sectionId = orderedSectionIds[index];
      await db.pageSectionComposition.update({
        where: { id: sectionId },
        data: { order: index },
      });
    }

    const updatedSections = await db.pageSectionComposition.findMany({
      where: { pageCompositionId: pageId },
      orderBy: { order: "asc" },
    });

    return updatedSections.map(mapSectionRow);
  }

  /**
   * Toggle section enabled state
   */
  public static async toggleSectionEnabled(sectionId: string): Promise<boolean> {
    const section = await db.pageSectionComposition.findUnique({ where: { id: sectionId } });
    if (!section) throw new SectionNotFoundError(sectionId);

    const newState = !section.enabled;
    await db.pageSectionComposition.update({
      where: { id: sectionId },
      data: { enabled: newState },
    });

    return newState;
  }

  /**
   * Remove a section from a page
   */
  public static async removeSection(sectionId: string): Promise<boolean> {
    try {
      await db.pageSectionComposition.delete({
        where: { id: sectionId },
      });
      return true;
    } catch {
      return false;
    }
  }
}

