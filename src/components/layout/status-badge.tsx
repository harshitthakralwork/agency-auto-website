import React from "react";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "IN_PROGRESS":
      return <Badge variant="primary">In Production</Badge>;
    case "READY_FOR_REVIEW":
      return <Badge variant="amber">Review Ready</Badge>;
    case "COMPLETED":
      return <Badge variant="emerald">Live / Deployed</Badge>;
    case "ARCHIVED":
      return <Badge variant="muted">Archived</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="default">Draft Spec</Badge>;
  }
}

export function CategoryBadge({ categoryId }: { categoryId: string }) {
  const map: Record<string, { label: string; variant: "emerald" | "amber" | "indigo" | "rose" | "orange" | "pink" | "default" }> = {
    healthcare: { label: "Healthcare", variant: "emerald" },
    "hotels-banquets": { label: "Hotels & Banquets", variant: "amber" },
    "schools-coaching": { label: "Schools & Coaching", variant: "indigo" },
    "food-restaurants": { label: "Food & Dining", variant: "rose" },
    "fitness-sports": { label: "Fitness & Sports", variant: "orange" },
    "salon-beauty": { label: "Salon & Beauty", variant: "pink" },
  };

  const item = map[categoryId] || { label: categoryId, variant: "default" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
