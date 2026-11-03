export type RoutePriority = "HIGH" | "MEDIUM" | "LOW";
export type NavigationPlacement = "PRIMARY" | "FOOTER" | "UTILITY" | "HIDDEN";

export interface ResponsiveSettings {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  paddingY?: "none" | "small" | "medium" | "large";
  customCssClass?: string;
}

export interface PageSectionCompositionData {
  id: string;
  pageCompositionId: string;
  componentId: string;
  variantId?: string | null;
  order: number;
  enabled: boolean;
  customName?: string | null;
  propsOverride: Record<string, unknown>;
  responsiveSettings: ResponsiveSettings;
  createdAt: string;
  updatedAt: string;
}

export interface PageCompositionData {
  id: string;
  projectId: string;
  blueprintId?: string | null;
  slug: string;
  title: string;
  routePriority: RoutePriority;
  navigationPlacement: NavigationPlacement;
  seoTitle?: string | null;
  seoDescription?: string | null;
  sections: PageSectionCompositionData[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  projectId: string;
  blueprintId?: string;
  slug: string;
  title: string;
  routePriority?: RoutePriority;
  navigationPlacement?: NavigationPlacement;
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  routePriority?: RoutePriority;
  navigationPlacement?: NavigationPlacement;
  seoTitle?: string;
  seoDescription?: string;
}

export interface AddSectionInput {
  componentId: string;
  variantId?: string;
  customName?: string;
  order?: number;
  propsOverride?: Record<string, unknown>;
  responsiveSettings?: ResponsiveSettings;
}

export interface UpdateSectionInput {
  variantId?: string;
  customName?: string;
  enabled?: boolean;
  order?: number;
  propsOverride?: Record<string, unknown>;
  responsiveSettings?: ResponsiveSettings;
}

