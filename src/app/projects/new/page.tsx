"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Layers,
  Palette,
  CheckCircle2,
  Building,
  AlertCircle,
  Layout,
  Box,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { DESIGN_PRESETS } from "@/modules/design/presets";
import { cn } from "@/lib/utils";

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("healthcare");
  const [experienceLevel, setExperienceLevel] = useState<"STANDARD" | "CINEMATIC" | "IMMERSIVE_3D">("CINEMATIC");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [services, setServices] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [preset, setPreset] = useState("cinematic");

  const activeCategoryPack = ALL_CATEGORY_PACKS.find((p) => p.id === category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
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
          preset,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.errors) {
          const firstKey = Object.keys(data.errors)[0];
          setError(`${firstKey}: ${data.errors[firstKey].join(", ")}`);
        } else {
          setError(data.error || "Failed to create project");
        }
        setIsSubmitting(false);
        return;
      }

      router.push(`/projects/${data.data.id}`);
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects Catalog</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Initialize Client Website Project
            </h1>
            <p className="text-xs text-slate-400">
              Configure business parameters, experience tier (Standard / Cinematic / 3D), and design tokens.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Experience Level Selection */}
        <Card className="border-indigo-900/60 bg-gradient-to-br from-indigo-950/30 to-slate-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>1. Choose Website Experience Level</span>
              </CardTitle>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">
                Core Production Tier
              </span>
            </div>
            <CardDescription>
              Select the interaction complexity and motion architecture engineered for this client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Level 1: Standard */}
              <div
                onClick={() => setExperienceLevel("STANDARD")}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                  experienceLevel === "STANDARD"
                    ? "border-slate-400 bg-slate-900/90 ring-1 ring-slate-400 shadow-lg"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                      <Layout className="h-3.5 w-3.5 text-slate-400" />
                      Level 1 • Standard
                    </span>
                    {experienceLevel === "STANDARD" && (
                      <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-300">Clean & Functional</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Responsive, high-contrast layouts, image galleries, business lead forms, and fast SEO structure.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500">
                  Subtle transitions • High accessibility
                </div>
              </div>

              {/* Level 2: Cinematic */}
              <div
                onClick={() => setExperienceLevel("CINEMATIC")}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                  experienceLevel === "CINEMATIC"
                    ? "border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xl"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5" />
                      Level 2 • Cinematic
                    </span>
                    {experienceLevel === "CINEMATIC" && (
                      <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-indigo-200">Motion & Transformations</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Full-bleed video hero sections, before/after split sliders, pinned scroll reveals, and canvas storytelling.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-indigo-400">
                  Scroll storytelling • Video choreography
                </div>
              </div>

              {/* Level 3: Immersive 3D */}
              <div
                onClick={() => setExperienceLevel("IMMERSIVE_3D")}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                  experienceLevel === "IMMERSIVE_3D"
                    ? "border-violet-500 bg-violet-950/40 ring-1 ring-violet-500 shadow-xl"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">
                      <Box className="h-3.5 w-3.5" />
                      Level 3 • Immersive 3D
                    </span>
                    {experienceLevel === "IMMERSIVE_3D" && (
                      <CheckCircle2 className="h-4 w-4 text-violet-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-violet-200">Interactive WebGL</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Interactive 3D models, scroll-driven object rotation, camera movement, and spatial environments.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-violet-400">
                  Three.js / WebGL • Spatial interaction
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Business Identity */}
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-indigo-400" />
              <span>2. Client & Business Identity</span>
            </CardTitle>
            <CardDescription>
              Core client identification used for metadata, content anchors, and headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Client / Business Name"
                placeholder="e.g. Apex Health & Dental Clinic"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Location / Operating City"
                placeholder="e.g. Chicago, IL or Nationwide"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Textarea
              label="Business Overview & Value Proposition"
              placeholder="Provide a concise description of what the client does and what sets them apart..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Primary Services (Comma-separated)"
                placeholder="e.g. Preventive Care, Cosmetic Dentistry, Orthodontics"
                value={services}
                onChange={(e) => setServices(e.target.value)}
              />
              <Input
                label="Target Audience"
                placeholder="e.g. Working professionals and families seeking premium care"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Category Pack Selection */}
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>3. Select Industry Pack</span>
            </CardTitle>
            <CardDescription>
              Each pack defines specialized pages, domain sections, and experience-level adaptations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ALL_CATEGORY_PACKS.map((pack) => {
                const isSelected = category === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => {
                      setCategory(pack.id);
                      setPreset(pack.suggestedPreset);
                    }}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between",
                      isSelected
                        ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-sm text-white">{pack.title}</span>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {pack.tagline}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{pack.recommendedSections.length} Sections</span>
                      <span className="capitalize text-indigo-400">Prefers {pack.suggestedPreset}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {activeCategoryPack && (
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-200">
                    Adaptation for {experienceLevel.replace("_", " ")}:
                  </p>
                  <span className="text-[10px] font-mono text-indigo-400">
                    {activeCategoryPack.experienceAdaptations[experienceLevel].title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {activeCategoryPack.experienceAdaptations[experienceLevel].tagline}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Initial Design Preset & Project Status */}
        <Card className="border-slate-800 bg-slate-950/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-pink-400" />
              <span>4. Initial Design Preset & Pipeline State</span>
            </CardTitle>
            <CardDescription>
              Presets configure starting palettes and typography. All tokens remain 100% editable in the Design Studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.values(DESIGN_PRESETS).map((p) => {
                const isSelected = preset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      "p-3 rounded-xl border cursor-pointer text-center transition-all",
                      isSelected
                        ? "border-pink-500 bg-pink-950/20 ring-1 ring-pink-500"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                    )}
                  >
                    <div
                      className="mx-auto h-7 w-7 rounded-full border border-slate-700 mb-2 shadow-sm"
                      style={{ backgroundColor: p.colors.primary }}
                    />
                    <p className="font-semibold text-xs text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {p.typography.headingFont}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Initial Project Status
                </label>
                <p className="text-[11px] text-slate-400">Current state in agency production roadmap</p>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="DRAFT">Draft Spec</option>
                <option value="IN_PROGRESS">In Production</option>
                <option value="READY_FOR_REVIEW">Ready for Review</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link href="/projects">
            <Button variant="ghost" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="shadow-lg shadow-indigo-600/30 px-6"
          >
            Create Project & Enter Hub
          </Button>
        </div>
      </form>
    </div>
  );
}
