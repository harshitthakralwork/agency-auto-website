"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  Palette,
  Eye,
  Sliders,
  Clock,
  MapPin,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, CategoryBadge } from "@/components/layout/status-badge";
import { ALL_CATEGORY_PACKS } from "@/modules/categories/registry";
import { formatDate } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string | null;
  description: string | null;
  services: string;
  targetAudience: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  designConfig: {
    preset: string;
    primaryColor: string;
    headingFont: string;
  } | null;
}

export function ProjectCatalog({
  initialProjects,
}: {
  initialProjects: ProjectItem[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filtered = useMemo(() => {
    return initialProjects.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" || p.status === selectedStatus;
      const matchesSearch =
        search.trim() === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.services && p.services.toLowerCase().includes(search.toLowerCase()));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [initialProjects, search, selectedCategory, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search projects by client name, location, or services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Pack:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Industries (6)</option>
              {ALL_CATEGORY_PACKS.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft Spec</option>
              <option value="IN_PROGRESS">In Production</option>
              <option value="READY_FOR_REVIEW">Ready for Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <Link href="/projects/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Projects List / Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No Matching Projects</h3>
          <p className="mt-1 text-xs text-slate-400">
            {initialProjects.length === 0
              ? "You haven't created any client projects yet."
              : "Try adjusting your search criteria or category filter."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {initialProjects.length === 0 ? (
              <Link href="/projects/new">
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create First Project</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-150"
            >
              <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <CategoryBadge categoryId={project.category} />
                  <StatusBadge status={project.status} />
                </div>

                <Link
                  href={`/projects/${project.id}`}
                  className="block text-lg font-bold text-white hover:text-indigo-400 transition-colors"
                >
                  {project.name}
                </Link>

                {project.location && (
                  <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span>{project.location}</span>
                  </p>
                )}

                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {project.description || "No business description provided."}
                </p>

                {project.services && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.services
                      .split(",")
                      .slice(0, 3)
                      .map((srv, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[10px] font-mono"
                        >
                          {srv.trim()}
                        </span>
                      ))}
                    {project.services.split(",").length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{project.services.split(",").length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 p-4 pt-3 bg-slate-950/40 rounded-b-xl space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(project.updatedAt)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {project.designConfig?.primaryColor && (
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-slate-700"
                        style={{ backgroundColor: project.designConfig.primaryColor }}
                      />
                    )}
                    <span className="capitalize text-slate-400">
                      {project.designConfig?.preset || "cinematic"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs px-2 py-1 h-8">
                      <Sliders className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </Link>

                  <Link href={`/projects/${project.id}/design`}>
                    <Button variant="secondary" size="sm" className="w-full text-xs px-2 py-1 h-8 text-pink-300">
                      <Palette className="h-3 w-3 mr-1" />
                      Design
                    </Button>
                  </Link>

                  <Link href={`/projects/${project.id}/preview`} target="_blank">
                    <Button variant="primary" size="sm" className="w-full text-xs px-2 py-1 h-8">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
