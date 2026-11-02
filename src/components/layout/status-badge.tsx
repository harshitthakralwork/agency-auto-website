import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Box, Layout } from "lucide-react";

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

export function ExperienceBadge({ level }: { level: string }) {
  switch (level) {
    case "IMMERSIVE_3D":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950 text-violet-300 border border-violet-800 font-mono">
          <Box className="h-3 w-3 text-violet-400" />
          <span>Level 3 • Immersive 3D</span>
        </span>
      );
    case "CINEMATIC":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Level 2 • Cinematic</span>
        </span>
      );
    case "STANDARD":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 font-mono">
          <Layout className="h-3 w-3 text-slate-400" />
          <span>Level 1 • Standard</span>
        </span>
      );
  }
}
