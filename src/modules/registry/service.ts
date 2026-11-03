import { db } from "@/lib/db";
import { allComponentDefinitions } from "./definitions";
import {
  ComponentDefinition,
  RegistryFilterOptions,
  ProjectComponentBinding,
} from "./types";

export class RegistryService {
  /**
   * Return all in-memory static component definitions
   */
  public static getAllDefinitions(): ComponentDefinition[] {
    return allComponentDefinitions;
  }

  /**
   * Find definition by ID
   */
  public static getDefinitionById(id: string): ComponentDefinition | null {
    return allComponentDefinitions.find((c) => c.id === id) || null;
  }

  /**
   * Seed / Sync component definitions to SQLite ComponentRegistryItem table
   */
  public static async syncDatabase(): Promise<number> {
    let synced = 0;
    for (const def of allComponentDefinitions) {
      await db.componentRegistryItem.upsert({
        where: { id: def.id },
        update: {
          name: def.name,
          family: def.family,
          sectionType: def.sectionType,
          description: def.description,
          supportedExperienceLevels: JSON.stringify(def.supportedExperienceLevels),
          requiredPropsJson: JSON.stringify(def.requiredProps),
          defaultPropsJson: JSON.stringify(def.defaultProps),
          variantsJson: JSON.stringify(def.variants),
          tagsJson: JSON.stringify(def.tags),
        },
        create: {
          id: def.id,
          name: def.name,
          family: def.family,
          sectionType: def.sectionType,
          description: def.description,
          supportedExperienceLevels: JSON.stringify(def.supportedExperienceLevels),
          requiredPropsJson: JSON.stringify(def.requiredProps),
          defaultPropsJson: JSON.stringify(def.defaultProps),
          variantsJson: JSON.stringify(def.variants),
          tagsJson: JSON.stringify(def.tags),
          isFavorite: false,
        },
      });
      synced++;
    }
    return synced;
  }

  /**
   * Query components with filters and database favorites state
   */
  public static async queryComponents(
    options: RegistryFilterOptions = {}
  ): Promise<ComponentDefinition[]> {
    // Ensure DB has definitions
    try {
      const count = await db.componentRegistryItem.count();
      if (count === 0) {
        await this.syncDatabase();
      }
    } catch {
      // Ignore if DB not reachable
    }

    // Retrieve favorites map from DB
    let favoritesMap: Record<string, boolean> = {};
    try {
      const rows = await db.componentRegistryItem.findMany({
        select: { id: true, isFavorite: true },
      });
      favoritesMap = Object.fromEntries(rows.map((r) => [r.id, r.isFavorite]));
    } catch {
      // Fallback to empty
    }

    let results = allComponentDefinitions.map((def) => ({
      ...def,
      isFavorite: !!favoritesMap[def.id],
    }));

    // Filter by family
    if (options.family && options.family !== "ALL") {
      results = results.filter((c) => c.family === options.family);
    }

    // Filter by experience level
    if (options.experienceLevel && options.experienceLevel !== "ALL") {
      results = results.filter((c) =>
        c.supportedExperienceLevels.includes(options.experienceLevel as any)
      );
    }

    // Filter by favorites only
    if (options.favoritesOnly) {
      results = results.filter((c) => c.isFavorite);
    }

    // Search query
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const q = options.searchQuery.toLowerCase().trim();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.sectionType.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results;
  }

  /**
   * Toggle isFavorite state for a component
   */
  public static async toggleFavorite(id: string): Promise<boolean> {
    const item = await db.componentRegistryItem.findUnique({
      where: { id },
    });

    if (!item) {
      // If not in DB yet, sync first
      await this.syncDatabase();
    }

    const current = await db.componentRegistryItem.findUnique({
      where: { id },
    });

    const newState = current ? !current.isFavorite : true;

    await db.componentRegistryItem.upsert({
      where: { id },
      update: { isFavorite: newState },
      create: {
        id,
        name: id,
        family: "HERO",
        sectionType: "hero",
        description: "",
        isFavorite: newState,
      },
    });

    return newState;
  }

  /**
   * Get components bound to a specific project library
   */
  public static async getProjectComponentLibrary(
    projectId: string
  ): Promise<ProjectComponentBinding[]> {
    const rows = await db.projectComponentLibrary.findMany({
      where: { projectId },
      include: { component: true },
    });

    return rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      componentId: r.componentId,
      variantId: r.variantId || undefined,
      customProps: r.customPropsJson ? JSON.parse(r.customPropsJson) : {},
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  /**
   * Add or update component binding in a project library
   */
  public static async addComponentToProject(
    projectId: string,
    componentId: string,
    variantId?: string,
    customProps: Record<string, unknown> = {}
  ): Promise<ProjectComponentBinding> {
    // Ensure item exists in ComponentRegistryItem
    const item = await db.componentRegistryItem.findUnique({
      where: { id: componentId },
    });
    if (!item) {
      await this.syncDatabase();
    }

    const row = await db.projectComponentLibrary.upsert({
      where: {
        projectId_componentId: {
          projectId,
          componentId,
        },
      },
      update: {
        variantId: variantId || null,
        customPropsJson: JSON.stringify(customProps),
      },
      create: {
        projectId,
        componentId,
        variantId: variantId || null,
        customPropsJson: JSON.stringify(customProps),
      },
    });

    return {
      id: row.id,
      projectId: row.projectId,
      componentId: row.componentId,
      variantId: row.variantId || undefined,
      customProps,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  /**
   * Remove a component from a project library
   */
  public static async removeComponentFromProject(
    projectId: string,
    componentId: string
  ): Promise<boolean> {
    try {
      await db.projectComponentLibrary.delete({
        where: {
          projectId_componentId: {
            projectId,
            componentId,
          },
        },
      });
      return true;
    } catch {
      return false;
    }
  }
}

