"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Video,
  FileBox,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
  Layers,
  Check,
  ChevronDown,
  Film,
  Play,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { formatBytes, formatDate } from "@/lib/utils";
import { CanvasFrameSequence } from "@/components/cinematic/CanvasFrameSequence";

interface Asset {
  id: string;
  projectId: string;
  name: string;
  fileName: string;
  fileUrl: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  assetType: string;
  assignedSlot: string | null;
  metadataJson: string;
  createdAt: Date | string;
}

interface MediaStudioViewProps {
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    experienceLevel: string;
  };
  initialAssets: Asset[];
}

export function MediaStudioView({ project, initialAssets }: MediaStudioViewProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Upload form state
  const [uploadType, setUploadType] = useState<string>("IMAGE");
  const [uploadSlot, setUploadSlot] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Asset deletion modal
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Video Extraction Modal state
  const [videoForJob, setVideoForJob] = useState<Asset | null>(null);
  const [targetFps, setTargetFps] = useState<number>(24);
  const [maxFrames, setMaxFrames] = useState<number>(60);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [activeJob, setActiveJob] = useState<{
    id: string;
    status: string;
    progress: number;
    errorMessage?: string;
  } | null>(null);
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Preview Frame Sequence Modal state
  const [previewSequenceAsset, setPreviewSequenceAsset] = useState<Asset | null>(null);

  // Before / After preview slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  // Handle Dragging
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", uploadType);
    if (uploadSlot) {
      formData.append("assignedSlot", uploadSlot);
    }
    if (customName.trim()) {
      formData.append("name", customName.trim());
    }

    try {
      const res = await fetch(`/api/projects/${project.id}/assets`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }

      setAssets((prev) => [data.data, ...prev]);
      setUploadSuccess(`Successfully uploaded "${file.name}"`);
      setCustomName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSlotAssignment = async (assetId: string, newSlot: string | null) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedSlot: newSlot || null }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update slot assignment");
      }

      // Update state: if exclusive slot, clear it from other assets
      const exclusiveSlots = ["HERO_BACKGROUND", "BEFORE_SLOT", "AFTER_SLOT", "POSTER_FALLBACK", "CANVAS_HERO_SEQUENCE"];
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id === assetId) {
            return { ...a, assignedSlot: newSlot };
          }
          if (newSlot && exclusiveSlots.includes(newSlot) && a.assignedSlot === newSlot) {
            return { ...a, assignedSlot: null };
          }
          return a;
        })
      );
    } catch (err: any) {
      alert(err.message || "Error updating assignment");
    }
  };

  const handleStartExtraction = async () => {
    if (!videoForJob) return;
    setIsSubmittingJob(true);
    setActiveJob({
      id: "pending",
      status: "QUEUED",
      progress: 0,
    });

    try {
      const res = await fetch(`/api/projects/${project.id}/video-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoAssetId: videoForJob.id,
          targetFps,
          maxFrames,
          quality,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Failed to start extraction job");
      }

      const jobId = data.jobId;
      setActiveJob({
        id: jobId,
        status: "PROCESSING",
        progress: 10,
      });

      // Poll job progress
      const pollTimer = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/projects/${project.id}/video-jobs/${jobId}`);
          if (!pollRes.ok) return;
          const pollData = await pollRes.json();
          if (!pollData || !pollData.job) return;

          const job = pollData.job;
          setActiveJob({
            id: job.jobId,
            status: job.status,
            progress: Math.round(job.progress || 0),
            errorMessage: job.errorMessage,
          });

          if (job.status === "COMPLETED") {
            clearInterval(pollTimer);
            // Refresh assets list
            const assetsRes = await fetch(`/api/projects/${project.id}/assets`);
            if (assetsRes.ok) {
              const fresh = await assetsRes.json();
              if (fresh.data) setAssets(fresh.data);
            }
          } else if (job.status === "FAILED" || job.status === "CANCELLED") {
            clearInterval(pollTimer);
          }
        } catch {}
      }, 1200);
    } catch (err: any) {
      setActiveJob({
        id: "error",
        status: "FAILED",
        progress: 0,
        errorMessage: err.message || "Failed to start video extraction",
      });
    } finally {
      setIsSubmittingJob(false);
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/assets/${assetToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete asset");
      }

      setAssets((prev) => prev.filter((a) => a.id !== assetToDelete.id));
      setAssetToDelete(null);
    } catch (err: any) {
      alert(err.message || "Error deleting asset");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "IMAGE") return asset.assetType === "IMAGE";
    if (selectedFilter === "VIDEO") return asset.assetType === "VIDEO";
    if (selectedFilter === "BEFORE_AFTER")
      return asset.assetType === "BEFORE_IMAGE" || asset.assetType === "AFTER_IMAGE";
    if (selectedFilter === "POSTER") return asset.assetType === "POSTER";
    if (selectedFilter === "MODEL_3D") return asset.assetType === "MODEL_3D";
    if (selectedFilter === "FRAME_SEQUENCE") return asset.assetType === "FRAME_SEQUENCE";
    return true;
  });

  // Find assigned before / after items
  const beforeAsset = assets.find((a) => a.assignedSlot === "BEFORE_SLOT");
  const afterAsset = assets.find((a) => a.assignedSlot === "AFTER_SLOT");
  const heroVideoAsset = assets.find(
    (a) => a.assignedSlot === "HERO_BACKGROUND" && a.assetType === "VIDEO"
  );
  const heroPosterAsset = assets.find((a) => a.assignedSlot === "POSTER_FALLBACK");

  return (
    <div className="space-y-8 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Project Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
              Media & Asset Studio
            </h1>
            <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              {assets.length} {assets.length === 1 ? "Asset" : "Assets"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload and assign real images, video backgrounds, transformation pairs, and 3D assets for{" "}
            <span className="text-white font-semibold">{project.name}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/projects/${project.id}/design`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-pink-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Design Studio</span>
            </Button>
          </Link>
          <Link href={`/projects/${project.id}/preview`} target="_blank">
            <Button size="sm" className="gap-1.5 shadow-md shadow-indigo-600/20">
              <Eye className="h-3.5 w-3.5" />
              <span>Live Preview</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Upload & Asset Ingestion Card */}
      <Card className="border-slate-800 bg-slate-950/70 shadow-xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Upload className="h-4 w-4 text-cyan-400" />
            <span>Asset Ingestion Pipeline</span>
          </CardTitle>
          <CardDescription>
            Files are validated and stored in project-isolated local storage. SQLite retains clean metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Asset Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Asset Type</label>
              <select
                value={uploadType}
                onChange={(e) => {
                  setUploadType(e.target.value);
                  // Smart auto-select slot if relevant
                  if (e.target.value === "BEFORE_IMAGE") setUploadSlot("BEFORE_SLOT");
                  else if (e.target.value === "AFTER_IMAGE") setUploadSlot("AFTER_SLOT");
                  else if (e.target.value === "POSTER") setUploadSlot("POSTER_FALLBACK");
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="IMAGE">Standard Image (Hero, Gallery, BG)</option>
                <option value="VIDEO">Video File (MP4, WebM)</option>
                <option value="BEFORE_IMAGE">Before Comparison Image</option>
                <option value="AFTER_IMAGE">After Comparison Image</option>
                <option value="POSTER">Video Poster Fallback Image</option>
                <option value="MODEL_3D">3D Model File (GLB, GLTF)</option>
              </select>
            </div>

            {/* Target Slot Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Assign to Slot</label>
              <select
                value={uploadSlot}
                onChange={(e) => setUploadSlot(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">Unassigned (General Library)</option>
                <option value="HERO_BACKGROUND">Hero Section Background</option>
                <option value="BEFORE_SLOT">Transformation • Before Slot</option>
                <option value="AFTER_SLOT">Transformation • After Slot</option>
                <option value="GALLERY">Project Gallery Collection</option>
                <option value="SECTION_BG">General Section Background</option>
                <option value="POSTER_FALLBACK">Video Poster Fallback</option>
              </select>
            </div>

            {/* Label / Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Custom Label (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Paint Correction Before"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Upload Action */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="text-xs font-medium text-transparent hidden md:block">Upload</label>
              <input
                ref={fileInputRef}
                type="file"
                disabled={isUploading}
                onChange={handleFileUpload}
                accept={
                  uploadType === "VIDEO"
                    ? "video/mp4,video/webm"
                    : uploadType === "MODEL_3D"
                    ? ".glb,.gltf"
                    : "image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
                }
                className="hidden"
                id="file-upload-input"
              />
              <label
                htmlFor="file-upload-input"
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer transition-all ${
                  isUploading
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{isUploading ? "Uploading..." : "Select & Upload File"}</span>
              </label>
            </div>
          </div>

          {/* Feedback messages */}
          {uploadError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-2.5 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Before & After Verification Sandbox */}
      <Card className="border-indigo-900/50 bg-gradient-to-b from-slate-950 to-indigo-950/20 shadow-xl overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-indigo-400" />
                <span>Before & After Transformation Sandbox</span>
              </CardTitle>
              <CardDescription>
                Live preview of assigned comparison images. Drag the center divider to verify alignment.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    beforeAsset ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-slate-300">
                  Before: {beforeAsset ? beforeAsset.name : "Unassigned"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    afterAsset ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span className="text-slate-300">
                  After: {afterAsset ? afterAsset.name : "Unassigned"}
                </span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {beforeAsset && afterAsset ? (
            <div className="max-w-3xl mx-auto">
              <div
                ref={sliderRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-80 md:h-96 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 select-none cursor-ew-resize group shadow-2xl"
              >
                {/* After Image (Background layer) */}
                <img
                  src={afterAsset.fileUrl}
                  alt="After Transformation"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-emerald-950/90 border border-emerald-600/50 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-emerald-300 tracking-wider uppercase z-10 pointer-events-none">
                  After Result
                </div>

                {/* Before Image (Clipped layer) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforeAsset.fileUrl}
                    alt="Before Transformation"
                    className="absolute inset-0 h-full max-w-none object-cover"
                    style={{
                      width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : "100%",
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-slate-950/90 border border-slate-700/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-slate-300 tracking-wider uppercase z-10 pointer-events-none">
                    Initial Condition
                  </div>
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)] cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-white text-slate-950 shadow-2xl flex items-center justify-center border-2 border-indigo-600">
                    <Sliders className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                Drag the divider or touch and slide to preview the exact comparison interaction shown to clients.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/40 max-w-2xl mx-auto">
              <Sliders className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-300">
                Comparison Slider Requires Assigned Assets
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload two images below, then click their slot dropdown to assign one to{" "}
                <strong className="text-slate-300">"Before Slot"</strong> and one to{" "}
                <strong className="text-slate-300">"After Slot"</strong>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asset Explorer & Management Grid */}
      <div className="space-y-4">
        {/* Filter Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "All Media", count: assets.length },
              {
                id: "IMAGE",
                label: "Images",
                count: assets.filter((a) => a.assetType === "IMAGE").length,
              },
              {
                id: "VIDEO",
                label: "Videos",
                count: assets.filter((a) => a.assetType === "VIDEO").length,
              },
              {
                id: "BEFORE_AFTER",
                label: "Before / After",
                count: assets.filter(
                  (a) => a.assetType === "BEFORE_IMAGE" || a.assetType === "AFTER_IMAGE"
                ).length,
              },
              {
                id: "POSTER",
                label: "Posters",
                count: assets.filter((a) => a.assetType === "POSTER").length,
              },
              {
                id: "FRAME_SEQUENCE",
                label: "Frame Sequences",
                count: assets.filter((a) => a.assetType === "FRAME_SEQUENCE").length,
              },
              {
                id: "MODEL_3D",
                label: "3D Models",
                count: assets.filter((a) => a.assetType === "MODEL_3D").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedFilter === tab.id
                    ? "bg-slate-800 text-white border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-950 text-slate-400">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {filteredAssets.length} of {assets.length}
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-12 text-center">
            <ImageIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Assets Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {selectedFilter === "ALL"
                ? "This project has no uploaded assets yet. Use the upload bar above to add images or videos."
                : `No assets matched category "${selectedFilter}". Select "All Media" or upload an asset.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className="group rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden hover:border-slate-700 transition-all shadow-md flex flex-col justify-between"
              >
                {/* Thumbnail / Media Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-800">
                  {asset.assetType === "VIDEO" ? (
                    <video
                      src={asset.fileUrl}
                      controls
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : asset.assetType === "FRAME_SEQUENCE" ? (
                    <div className="flex flex-col items-center justify-center text-cyan-400 gap-2 p-4 text-center">
                      <Film className="h-10 w-10 text-cyan-400 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-white">Cinematic Frame Manifest</span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        {(() => {
                          try {
                            const meta = JSON.parse(asset.metadataJson);
                            return `${meta.frameCount || "?"} Frames @ ${meta.fps || 24}fps`;
                          } catch {
                            return "WebP Ordered Sequence";
                          }
                        })()}
                      </span>
                    </div>
                  ) : asset.assetType === "MODEL_3D" ? (
                    <div className="flex flex-col items-center justify-center text-indigo-400 gap-2">
                      <FileBox className="h-12 w-12" />
                      <span className="text-xs font-mono">3D Mesh File</span>
                    </div>
                  ) : (
                    <img
                      src={asset.fileUrl}
                      alt={asset.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}

                  {/* Active Slot Badge overlay */}
                  {asset.assignedSlot && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide flex items-center gap-1 shadow-lg">
                        <Check className="h-3 w-3" />
                        {asset.assignedSlot.replace(/_/g, " ")}
                      </span>
                    </div>
                  )}

                  {/* Type Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="bg-slate-950/80 text-slate-300 border border-slate-700 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono">
                      {asset.assetType}
                    </span>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white truncate" title={asset.name}>
                      {asset.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5" title={asset.fileName}>
                      {asset.fileName}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatBytes(asset.fileSize)}</span>
                      <span>•</span>
                      <span>{asset.mimeType}</span>
                      <span>•</span>
                      <span>{formatDate(asset.createdAt)}</span>
                    </div>
                  </div>

                  {/* Video to Frame Sequence Action */}
                  {asset.assetType === "VIDEO" && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVideoForJob(asset);
                          setActiveJob(null);
                        }}
                        className="w-full text-xs font-medium text-cyan-300 border-cyan-800/80 bg-cyan-950/40 hover:bg-cyan-900/60 gap-1.5"
                      >
                        <Film className="h-3.5 w-3.5" />
                        <span>Process to Frame Sequence</span>
                      </Button>
                    </div>
                  )}

                  {/* Frame Sequence Preview Action */}
                  {asset.assetType === "FRAME_SEQUENCE" && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewSequenceAsset(asset)}
                        className="w-full text-xs font-medium text-indigo-300 border-indigo-800/80 bg-indigo-950/40 hover:bg-indigo-900/60 gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Interactive Sequence Preview</span>
                      </Button>
                    </div>
                  )}

                  {/* Slot Assignment Selector */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Assigned Slot:</span>
                      <select
                        value={asset.assignedSlot || ""}
                        onChange={(e) => handleSlotAssignment(asset.id, e.target.value || null)}
                        className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[170px]"
                      >
                        <option value="">Unassigned</option>
                        <option value="HERO_BACKGROUND">Hero Background</option>
                        <option value="CANVAS_HERO_SEQUENCE">Canvas Hero Sequence</option>
                        <option value="BEFORE_SLOT">Before Slot</option>
                        <option value="AFTER_SLOT">After Slot</option>
                        <option value="GALLERY">Gallery Item</option>
                        <option value="SECTION_BG">Section Background</option>
                        <option value="POSTER_FALLBACK">Poster Fallback</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={asset.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Direct URL</span>
                      </a>

                      <button
                        onClick={() => setAssetToDelete(asset)}
                        className="text-rose-400 hover:text-rose-300 text-xs p-1 rounded hover:bg-rose-950/40 transition-colors inline-flex items-center gap-1"
                        title="Delete Asset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-[10px]">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        title="Confirm Asset Deletion"
        description="This will permanently delete the asset file from the server filesystem and remove its metadata from SQLite."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">
                Are you sure you want to delete "{assetToDelete?.name}"?
              </p>
              <p className="mt-1 text-rose-400/80">
                File: {assetToDelete?.fileName} ({formatBytes(assetToDelete?.fileSize || 0)})
              </p>
              {assetToDelete?.assignedSlot && (
                <p className="mt-1 text-amber-300">
                  Note: This asset is currently assigned to slot "{assetToDelete.assignedSlot}".
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setAssetToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteAsset}
              className="gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Video Extraction Pipeline Modal */}
      <Modal
        isOpen={!!videoForJob}
        onClose={() => {
          if (!activeJob || activeJob.status === "COMPLETED" || activeJob.status === "FAILED") {
            setVideoForJob(null);
            setActiveJob(null);
          }
        }}
        title="Cinematic Frame Sequence Extraction"
        description="Extract ordered WebP frames from this video using FFmpeg and Sharp for high-performance canvas scrub playback."
        maxWidth="lg"
      >
        <div className="space-y-5">
          {videoForJob && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">{videoForJob.name}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {videoForJob.fileName} • {formatBytes(videoForJob.fileSize)}
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Source Video
              </span>
            </div>
          )}

          {/* Configuration controls (disabled if job running) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Target Extraction FPS
              </label>
              <select
                disabled={Boolean(activeJob && (activeJob.status === "PROCESSING" || activeJob.status === "QUEUED"))}
                value={targetFps}
                onChange={(e) => setTargetFps(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={12}>12 fps (Stylized / Lightweight)</option>
                <option value={24}>24 fps (Cinematic Standard)</option>
                <option value={30}>30 fps (Ultra Smooth)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Maximum Frames
              </label>
              <select
                disabled={Boolean(activeJob && (activeJob.status === "PROCESSING" || activeJob.status === "QUEUED"))}
                value={maxFrames}
                onChange={(e) => setMaxFrames(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value={30}>30 Frames (Quick Scrub)</option>
                <option value={60}>60 Frames (Balanced 2.5s)</option>
                <option value={120}>120 Frames (Extended 5s)</option>
                <option value={240}>240 Frames (High-Precision 10s)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                WebP Compression Quality
              </label>
              <select
                disabled={Boolean(activeJob && (activeJob.status === "PROCESSING" || activeJob.status === "QUEUED"))}
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="high">High (85% Quality)</option>
                <option value="medium">Medium (75% Quality)</option>
                <option value="low">Low (60% Efficient)</option>
              </select>
            </div>
          </div>

          {/* Job Progress & Feedback */}
          {activeJob && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  {activeJob.status === "PROCESSING" && (
                    <RefreshCw className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                  )}
                  {activeJob.status === "COMPLETED" && (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {activeJob.status === "FAILED" && (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span>Status: {activeJob.status}</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold">{activeJob.progress}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    activeJob.status === "FAILED"
                      ? "bg-rose-500"
                      : activeJob.status === "COMPLETED"
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-cyan-500 to-indigo-500"
                  }`}
                  style={{ width: `${Math.max(activeJob.progress, 5)}%` }}
                />
              </div>

              {activeJob.errorMessage && (
                <p className="text-xs text-rose-400 pt-1">{activeJob.errorMessage}</p>
              )}

              {activeJob.status === "COMPLETED" && (
                <div className="pt-2 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Frame manifest successfully compiled and added to Project Assets!</span>
                  <button
                    onClick={() => {
                      setVideoForJob(null);
                      setSelectedFilter("FRAME_SEQUENCE");
                    }}
                    className="underline text-cyan-300 font-semibold cursor-pointer"
                  >
                    View in Sequences
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              disabled={Boolean(activeJob && activeJob.status === "PROCESSING")}
              onClick={() => {
                setVideoForJob(null);
                setActiveJob(null);
              }}
            >
              {activeJob?.status === "COMPLETED" ? "Close" : "Cancel"}
            </Button>
            {(!activeJob || activeJob.status === "FAILED") && (
              <Button
                size="sm"
                disabled={isSubmittingJob}
                onClick={handleStartExtraction}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white"
              >
                <Film className="h-4 w-4" />
                <span>{isSubmittingJob ? "Starting..." : "Start Frame Extraction"}</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Interactive Frame Sequence Preview Modal */}
      <Modal
        isOpen={!!previewSequenceAsset}
        onClose={() => setPreviewSequenceAsset(null)}
        title="Interactive Frame Sequence Preview"
        description="Verify HTML5 Canvas frame rendering and scroll scrub behavior for this extracted sequence."
        maxWidth="lg"
      >
        <div className="space-y-4">
          {previewSequenceAsset && (
            <div>
              <div className="h-80 md:h-96 w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative bg-black">
                <CanvasFrameSequence
                  manifestUrl={previewSequenceAsset.fileUrl}
                  fitMode="cover"
                  pinned={false}
                  className="w-full h-full"
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Manifest: {previewSequenceAsset.fileName}</span>
                <span className="text-cyan-400 font-bold">HTML5 Canvas • Scroll Driven</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewSequenceAsset(null)}
            >
              Close Preview
            </Button>
            {previewSequenceAsset && (
              <Button
                size="sm"
                onClick={() => {
                  handleSlotAssignment(previewSequenceAsset.id, "CANVAS_HERO_SEQUENCE");
                  setPreviewSequenceAsset(null);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Assign to Hero Canvas</span>
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

