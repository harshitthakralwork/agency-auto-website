import { z } from "zod";

export const projectCreateSchema = z.object({
  name: z.string().min(2, "Client/business name must be at least 2 characters").max(100),
  category: z.enum([
    "healthcare",
    "hotels-banquets",
    "schools-coaching",
    "food-restaurants",
    "fitness-sports",
    "salon-beauty",
  ], {
    message: "Please select a valid business category",
  }),
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional().default("CINEMATIC"),
  location: z.string().max(100).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  services: z.string().max(1000).optional().default(""),
  targetAudience: z.string().max(500).optional().default(""),
  status: z.enum([
    "DRAFT",
    "IN_PROGRESS",
    "READY_FOR_REVIEW",
    "COMPLETED",
    "ARCHIVED",
  ]).optional().default("DRAFT"),
  preset: z.enum([
    "cinematic",
    "minimal",
    "luxury",
    "creative",
    "corporate",
  ]).optional().default("cinematic"),
});

export const projectUpdateSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100).optional(),
  category: z.enum([
    "healthcare",
    "hotels-banquets",
    "schools-coaching",
    "food-restaurants",
    "fitness-sports",
    "salon-beauty",
  ]).optional(),
  experienceLevel: z.enum(["STANDARD", "CINEMATIC", "IMMERSIVE_3D"]).optional(),
  location: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  services: z.string().max(1000).optional(),
  targetAudience: z.string().max(500).optional().nullable(),
  status: z.enum([
    "DRAFT",
    "IN_PROGRESS",
    "READY_FOR_REVIEW",
    "COMPLETED",
    "ARCHIVED",
  ]).optional(),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
