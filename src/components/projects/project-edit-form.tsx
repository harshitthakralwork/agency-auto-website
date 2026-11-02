"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";

interface ProjectEditProps {
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    experienceLevel: string;
    location: string | null;
    description: string | null;
    services: string;
    targetAudience: string | null;
    status: string;
  };
}

export function ProjectEditForm({ project }: ProjectEditProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(project.name);
  const [category, setCategory] = useState(project.category);
  const [experienceLevel, setExperienceLevel] = useState(project.experienceLevel || "CINEMATIC");
  const [location, setLocation] = useState(project.location || "");
  const [description, setDescription] = useState(project.description || "");
  const [services, setServices] = useState(project.services);
  const [targetAudience, setTargetAudience] = useState(project.targetAudience || "");
  const [status, setStatus] = useState(project.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          experienceLevel,
          location,
          description,
          services,
          targetAudience,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to update project metadata");
        setIsSubmitting(false);
        return;
      }

      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Project Hub</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Edit Client Project Metadata
        </h1>
        <p className="text-xs text-slate-400">
          Modify business identity, experience tier, and scope parameters.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>Business Profile</span>
            </CardTitle>
            <CardDescription>
              All changes are persistently saved to the local SQLite database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client / Business Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Business Category Pack
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {ALL_CATEGORY_PACKS.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Experience Tier
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full h-10 rounded-lg border border-indigo-700/80 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="STANDARD">Level 1 • Standard</option>
                  <option value="CINEMATIC">Level 2 • Cinematic</option>
                  <option value="IMMERSIVE_3D">Level 3 • Immersive 3D</option>
                </select>
              </div>

              <Input
                label="Location / Headquarter"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Project Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="DRAFT">Draft Spec</option>
                  <option value="IN_PROGRESS">In Production</option>
                  <option value="READY_FOR_REVIEW">Ready for Review</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            <Textarea
              label="Business Overview & Positioning"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              label="Services (Comma-separated)"
              value={services}
              onChange={(e) => setServices(e.target.value)}
            />

            <Input
              label="Target Audience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
