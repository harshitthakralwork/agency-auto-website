import { CategoryPack } from "./types";
import { healthcarePack } from "./packs/healthcare";
import { hotelsBanquetsPack } from "./packs/hotels-banquets";
import { schoolsCoachingPack } from "./packs/schools-coaching";
import { foodRestaurantsPack } from "./packs/food-restaurants";
import { fitnessSportsPack } from "./packs/fitness-sports";
import { salonBeautyPack } from "./packs/salon-beauty";

export const CATEGORY_PACKS: Record<string, CategoryPack> = {
  healthcare: healthcarePack,
  "hotels-banquets": hotelsBanquetsPack,
  "schools-coaching": schoolsCoachingPack,
  "food-restaurants": foodRestaurantsPack,
  "fitness-sports": fitnessSportsPack,
  "salon-beauty": salonBeautyPack,
};

export const ALL_CATEGORY_PACKS: CategoryPack[] = Object.values(CATEGORY_PACKS);

export function getCategoryPack(categoryId: string): CategoryPack {
  return CATEGORY_PACKS[categoryId] || healthcarePack;
}

export function isValidCategory(categoryId: string): boolean {
  return categoryId in CATEGORY_PACKS;
}

export function getDefaultSectionsForCategory(categoryId: string) {
  const pack = getCategoryPack(categoryId);
  return pack.recommendedSections.map((section) => ({
    id: section.id,
    name: section.name,
    enabled: section.defaultEnabled,
    order: section.order,
    description: section.description,
  }));
}
