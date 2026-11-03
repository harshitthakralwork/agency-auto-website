import { db } from "@/lib/db";
import { generateEvidenceBackedBlueprint } from "./generator";
import {
  BlueprintStatus,
  ExperienceLevel,
  WebsiteBlueprintData,
  BusinessProfile,
  BrandDirection,
  WebsiteStrategy,
  SitemapItem,
  PageHierarchyItem,
  DesignSystemTokens,
  ExperienceRequirements,
  SeoAccessibilityRules,
  ProvenanceMetadata,
  DesignDirection,
} from "./types";
import {
  CreateBlueprintInputSchema,
  UpdateBlueprintInputSchema,
  TransitionStatusInputSchema,
} from "./schema";

export class BlueprintNotFoundError extends Error {
  constructor(id: string) {
    super(`Blueprint not found with id: ${id}`);
    this.name = "BlueprintNotFoundError";
  }
}

export class BlueprintApprovedImmutableError extends Error {
  constructor(id: string, version: number) {
    super(
      `Blueprint ${id} (version ${version}) is APPROVED and immutable. Create a new version branch to modify it.`
    );
    this.name = "BlueprintApprovedImmutableError";
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: BlueprintStatus, to: BlueprintStatus) {
    super(`Invalid status transition from ${from} to ${to}`);
    this.name = "InvalidStatusTransitionError";
  }
}

function parseJsonField<T>(field: string | null | undefined, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

export function parseBlueprintRecord(record: any): WebsiteBlueprintData {
  return {
    id: record.id,
    projectId: record.projectId,
    researchSessionId: record.researchSessionId,
    title: record.title,
    slug: record.slug,
    version: record.version,
    parentBlueprintId: record.parentBlueprintId,
    status: record.status as BlueprintStatus,
    industry: record.industry,
    experienceLevel: record.experienceLevel as ExperienceLevel,

    businessProfile: parseJsonField<BusinessProfile>(record.businessProfileJson, {} as any),
    brandDirection: parseJsonField<BrandDirection>(record.brandDirectionJson, {} as any),
    websiteStrategy: parseJsonField<WebsiteStrategy>(record.websiteStrategyJson, {} as any),
    sitemap: parseJsonField<SitemapItem[]>(record.sitemapJson, []),
    pageHierarchy: parseJsonField<PageHierarchyItem[]>(record.pageHierarchyJson, []),
    designSystem: parseJsonField<DesignSystemTokens>(record.designSystemJson, {} as any),
    experienceRequirements: parseJsonField<ExperienceRequirements>(
      record.experienceRequirementsJson,
      {} as any
    ),
    seoAccessibility: parseJsonField<SeoAccessibilityRules>(
      record.seoAccessibilityJson,
      {} as any
    ),

    provenanceMetadata: parseJsonField<ProvenanceMetadata>(
      record.provenanceMetadataJson,
      {}
    ),
    designDirections: parseJsonField<DesignDirection[]>(
      record.designDirectionsJson,
      []
    ),
    activeDirectionId: record.activeDirectionId,

    changeSummary: record.changeSummary,
    approvedAt: record.approvedAt ? record.approvedAt.toISOString() : null,
    approvedBy: record.approvedBy,

    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class BlueprintService {
  /**
   * List blueprints with optional filters
   */
  async listBlueprints(filter?: {
    projectId?: string;
    status?: BlueprintStatus;
    industry?: string;
  }): Promise<WebsiteBlueprintData[]> {
    const where: any = {};
    if (filter?.projectId) where.projectId = filter.projectId;
    if (filter?.status) where.status = filter.status;
    if (filter?.industry) where.industry = filter.industry;

    const records = await db.websiteBlueprint.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        project: { select: { id: true, name: true, slug: true } },
        researchSession: { select: { id: true, targetDomain: true, targetUrl: true } },
      },
    });

    return records.map(parseBlueprintRecord);
  }

  /**
   * Get single blueprint by ID
   */
  async getBlueprint(id: string): Promise<WebsiteBlueprintData & { project?: any; researchSession?: any }> {
    const record = await db.websiteBlueprint.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, slug: true, category: true } },
        researchSession: {
          select: {
            id: true,
            targetDomain: true,
            targetUrl: true,
            evidenceSha256: true,
            status: true,
          },
        },
      },
    });

    if (!record) {
      throw new BlueprintNotFoundError(id);
    }

    const parsed = parseBlueprintRecord(record);
    return {
      ...parsed,
      project: record.project,
      researchSession: record.researchSession,
    };
  }

  /**
   * Create a blueprint from an existing completed Research Session
   */
  async createBlueprintFromResearch(params: {
    researchSessionId: string;
    projectId?: string;
    title?: string;
    experienceLevel?: ExperienceLevel;
  }): Promise<WebsiteBlueprintData> {
    const session = await db.researchSession.findUnique({
      where: { id: params.researchSessionId },
    });

    if (!session) {
      throw new Error(`ResearchSession not found: ${params.researchSessionId}`);
    }

    const observedFacts = parseJsonField(session.observedFactsJson, {});
    const heuristicDetections = parseJsonField(session.heuristicDetectionsJson, {});
    const selectedFindings = parseJsonField<any[]>(session.selectedFindingsJson, []);

    const generated = generateEvidenceBackedBlueprint({
      title: params.title || (session.title ? `${session.title}` : `${session.targetDomain} Architecture`),
      industry: session.industry || "healthcare",
      experienceLevel: params.experienceLevel || "CINEMATIC",
      projectId: params.projectId || session.projectId,
      researchSessionId: session.id,
      observedFacts,
      heuristicDetections,
      selectedFindings,
    });

    const record = await db.websiteBlueprint.create({
      data: {
        projectId: generated.projectId,
        researchSessionId: generated.researchSessionId,
        title: generated.title,
        slug: `${generated.slug}-${Date.now().toString(36)}`,
        version: 1,
        parentBlueprintId: null,
        status: "DRAFT",
        industry: generated.industry,
        experienceLevel: generated.experienceLevel,

        businessProfileJson: JSON.stringify(generated.businessProfile),
        brandDirectionJson: JSON.stringify(generated.brandDirection),
        websiteStrategyJson: JSON.stringify(generated.websiteStrategy),
        sitemapJson: JSON.stringify(generated.sitemap),
        pageHierarchyJson: JSON.stringify(generated.pageHierarchy),
        designSystemJson: JSON.stringify(generated.designSystem),
        experienceRequirementsJson: JSON.stringify(generated.experienceRequirements),
        seoAccessibilityJson: JSON.stringify(generated.seoAccessibility),

        provenanceMetadataJson: JSON.stringify(generated.provenanceMetadata),
        designDirectionsJson: JSON.stringify(generated.designDirections),
        activeDirectionId: generated.activeDirectionId,

        changeSummary: "Initial version generated from Research Session evidence.",
      },
    });

    return parseBlueprintRecord(record);
  }

  /**
   * Create a blueprint from scratch using category pack recommendations
   */
  async createBlueprintFromScratch(params: {
    industry: string;
    title: string;
    projectId?: string;
    experienceLevel?: ExperienceLevel;
  }): Promise<WebsiteBlueprintData> {
    const validated = CreateBlueprintInputSchema.parse(params);

    const generated = generateEvidenceBackedBlueprint({
      title: validated.title,
      industry: validated.industry,
      experienceLevel: validated.experienceLevel as ExperienceLevel,
      projectId: validated.projectId,
    });

    const record = await db.websiteBlueprint.create({
      data: {
        projectId: generated.projectId,
        researchSessionId: null,
        title: generated.title,
        slug: `${generated.slug}-${Date.now().toString(36)}`,
        version: 1,
        parentBlueprintId: null,
        status: "DRAFT",
        industry: generated.industry,
        experienceLevel: generated.experienceLevel,

        businessProfileJson: JSON.stringify(generated.businessProfile),
        brandDirectionJson: JSON.stringify(generated.brandDirection),
        websiteStrategyJson: JSON.stringify(generated.websiteStrategy),
        sitemapJson: JSON.stringify(generated.sitemap),
        pageHierarchyJson: JSON.stringify(generated.pageHierarchy),
        designSystemJson: JSON.stringify(generated.designSystem),
        experienceRequirementsJson: JSON.stringify(generated.experienceRequirements),
        seoAccessibilityJson: JSON.stringify(generated.seoAccessibility),

        provenanceMetadataJson: JSON.stringify(generated.provenanceMetadata),
        designDirectionsJson: JSON.stringify(generated.designDirections),
        activeDirectionId: generated.activeDirectionId,

        changeSummary: "Initial version generated from industry category pack.",
      },
    });

    return parseBlueprintRecord(record);
  }

  /**
   * Update an existing draft blueprint.
   * Enforces immutability: Rejects update if blueprint is APPROVED.
   */
  async updateBlueprint(
    id: string,
    updates: any
  ): Promise<WebsiteBlueprintData> {
    const existing = await db.websiteBlueprint.findUnique({ where: { id } });
    if (!existing) {
      throw new BlueprintNotFoundError(id);
    }

    if (existing.status === "APPROVED") {
      throw new BlueprintApprovedImmutableError(id, existing.version);
    }

    const validated = UpdateBlueprintInputSchema.parse(updates);

    const data: any = {
      updatedAt: new Date(),
    };

    if (validated.title) data.title = validated.title;
    if (validated.experienceLevel) data.experienceLevel = validated.experienceLevel;
    if (validated.changeSummary) data.changeSummary = validated.changeSummary;
    if (validated.activeDirectionId !== undefined) data.activeDirectionId = validated.activeDirectionId;

    if (validated.businessProfile) {
      const current = parseJsonField(existing.businessProfileJson, {});
      data.businessProfileJson = JSON.stringify({ ...current, ...validated.businessProfile });
    }
    if (validated.brandDirection) {
      const current = parseJsonField(existing.brandDirectionJson, {});
      data.brandDirectionJson = JSON.stringify({ ...current, ...validated.brandDirection });
    }
    if (validated.websiteStrategy) {
      const current = parseJsonField(existing.websiteStrategyJson, {});
      data.websiteStrategyJson = JSON.stringify({ ...current, ...validated.websiteStrategy });
    }
    if (validated.sitemap) {
      data.sitemapJson = JSON.stringify(validated.sitemap);
    }
    if (validated.pageHierarchy) {
      data.pageHierarchyJson = JSON.stringify(validated.pageHierarchy);
    }
    if (validated.designSystem) {
      const current = parseJsonField(existing.designSystemJson, {});
      data.designSystemJson = JSON.stringify({ ...current, ...validated.designSystem });
    }
    if (validated.experienceRequirements) {
      const current = parseJsonField(existing.experienceRequirementsJson, {});
      data.experienceRequirementsJson = JSON.stringify({
        ...current,
        ...validated.experienceRequirements,
      });
    }
    if (validated.seoAccessibility) {
      const current = parseJsonField(existing.seoAccessibilityJson, {});
      data.seoAccessibilityJson = JSON.stringify({ ...current, ...validated.seoAccessibility });
    }
    if (validated.provenanceMetadata) {
      const current = parseJsonField(existing.provenanceMetadataJson, {});
      data.provenanceMetadataJson = JSON.stringify({ ...current, ...validated.provenanceMetadata });
    }
    if (validated.designDirections) {
      data.designDirectionsJson = JSON.stringify(validated.designDirections);
    }

    const updated = await db.websiteBlueprint.update({
      where: { id },
      data,
    });

    return parseBlueprintRecord(updated);
  }

  /**
   * Branch a new version from any existing blueprint.
   * Clones all blueprint contents, sets parentBlueprintId, bumps version, and resets status to DRAFT.
   */
  async branchNewVersion(
    id: string,
    changeSummary: string
  ): Promise<WebsiteBlueprintData> {
    const parent = await db.websiteBlueprint.findUnique({ where: { id } });
    if (!parent) {
      throw new BlueprintNotFoundError(id);
    }

    // Determine next version number
    const nextVersion = parent.version + 1;

    const record = await db.websiteBlueprint.create({
      data: {
        projectId: parent.projectId,
        researchSessionId: parent.researchSessionId,
        title: parent.title,
        slug: parent.slug,
        version: nextVersion,
        parentBlueprintId: parent.id,
        status: "DRAFT",
        industry: parent.industry,
        experienceLevel: parent.experienceLevel,

        businessProfileJson: parent.businessProfileJson,
        brandDirectionJson: parent.brandDirectionJson,
        websiteStrategyJson: parent.websiteStrategyJson,
        sitemapJson: parent.sitemapJson,
        pageHierarchyJson: parent.pageHierarchyJson,
        designSystemJson: parent.designSystemJson,
        experienceRequirementsJson: parent.experienceRequirementsJson,
        seoAccessibilityJson: parent.seoAccessibilityJson,

        provenanceMetadataJson: parent.provenanceMetadataJson,
        designDirectionsJson: parent.designDirectionsJson,
        activeDirectionId: parent.activeDirectionId,

        changeSummary: changeSummary || `Branched from version ${parent.version}`,
        approvedAt: null,
        approvedBy: null,
      },
    });

    return parseBlueprintRecord(record);
  }

  /**
   * Transition blueprint status
   */
  async transitionStatus(
    id: string,
    newStatus: BlueprintStatus,
    metadata?: { approvedBy?: string; changeSummary?: string }
  ): Promise<WebsiteBlueprintData> {
    const existing = await db.websiteBlueprint.findUnique({ where: { id } });
    if (!existing) {
      throw new BlueprintNotFoundError(id);
    }

    const currentStatus = existing.status as BlueprintStatus;

    // Allowed state transitions:
    // DRAFT -> REVIEW, ARCHIVED
    // REVIEW -> DRAFT, APPROVED, ARCHIVED
    // APPROVED -> ARCHIVED
    // ARCHIVED -> DRAFT
    const allowedTransitions: Record<BlueprintStatus, BlueprintStatus[]> = {
      DRAFT: ["REVIEW", "ARCHIVED"],
      REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
      APPROVED: ["ARCHIVED"],
      ARCHIVED: ["DRAFT"],
    };

    if (currentStatus !== newStatus && !allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new InvalidStatusTransitionError(currentStatus, newStatus);
    }

    const data: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "APPROVED") {
      data.approvedAt = new Date();
      data.approvedBy = metadata?.approvedBy || "Lead Agency Architect";
    } else if (newStatus === "DRAFT" && currentStatus === "ARCHIVED") {
      data.approvedAt = null;
      data.approvedBy = null;
    }

    if (metadata?.changeSummary) {
      data.changeSummary = metadata.changeSummary;
    }

    const updated = await db.websiteBlueprint.update({
      where: { id },
      data,
    });

    return parseBlueprintRecord(updated);
  }

  /**
   * Apply one of the 3 Strategic Design Directions to the active Blueprint tokens
   */
  async applyDesignDirection(
    id: string,
    directionId: string
  ): Promise<WebsiteBlueprintData> {
    const existing = await db.websiteBlueprint.findUnique({ where: { id } });
    if (!existing) {
      throw new BlueprintNotFoundError(id);
    }

    if (existing.status === "APPROVED") {
      throw new BlueprintApprovedImmutableError(id, existing.version);
    }

    const directions = parseJsonField<DesignDirection[]>(existing.designDirectionsJson, []);
    const matched = directions.find((d) => d.id === directionId);
    if (!matched) {
      throw new Error(`Design direction '${directionId}' not found in blueprint.`);
    }

    const currentDesignSystem = parseJsonField<DesignSystemTokens>(existing.designSystemJson, {} as any);
    const currentBrandDirection = parseJsonField<BrandDirection>(existing.brandDirectionJson, {} as any);

    // Update tokens with the selected direction
    const updatedDesignSystem: DesignSystemTokens = {
      ...currentDesignSystem,
      colors: {
        ...currentDesignSystem.colors,
        ...matched.colors,
      },
      typography: {
        ...currentDesignSystem.typography,
        headingFont: matched.typography.headingFont,
        bodyFont: matched.typography.bodyFont,
      },
      motion: {
        ...currentDesignSystem.motion,
        animationIntensity: matched.motionIntensity,
      },
    };

    const updatedBrandDirection: BrandDirection = {
      ...currentBrandDirection,
      stylePreset: matched.preset,
    };

    const updated = await db.websiteBlueprint.update({
      where: { id },
      data: {
        activeDirectionId: directionId,
        designSystemJson: JSON.stringify(updatedDesignSystem),
        brandDirectionJson: JSON.stringify(updatedBrandDirection),
        changeSummary: `Applied design direction: ${matched.name}`,
        updatedAt: new Date(),
      },
    });

    return parseBlueprintRecord(updated);
  }

  /**
   * Delete blueprint
   */
  async deleteBlueprint(id: string): Promise<void> {
    const existing = await db.websiteBlueprint.findUnique({ where: { id } });
    if (!existing) {
      throw new BlueprintNotFoundError(id);
    }

    await db.websiteBlueprint.delete({ where: { id } });
  }
}

export const blueprintService = new BlueprintService();

