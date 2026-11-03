import { NextRequest, NextResponse } from "next/server";
import { RegistryService } from "@/modules/registry/service";
import { ComponentFamily, ExperienceLevel } from "@/modules/registry/types";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const family = (url.searchParams.get("family") || "ALL") as ComponentFamily | "ALL";
    const experienceLevel = (url.searchParams.get("experienceLevel") || "ALL") as
      | ExperienceLevel
      | "ALL";
    const searchQuery = url.searchParams.get("search") || undefined;
    const favoritesOnly = url.searchParams.get("favorites") === "true";

    const components = await RegistryService.queryComponents({
      family,
      experienceLevel,
      searchQuery,
      favoritesOnly,
    });

    return NextResponse.json({
      success: true,
      count: components.length,
      components,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to query components" },
      { status: 500 }
    );
  }
}

