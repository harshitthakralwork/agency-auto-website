"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Play,
  Pause,
  Clock,
  Layers,
  Box,
  Camera,
  Sun,
  Palette,
  Sliders,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ThreeDAnimationConfig,
  ThreeDTimelineConfig,
  AnimationTrackConfig,
  KeyframeConfig,
  EasingType,
  AnimationPropertyType,
  AnimationTargetType,
} from "@/modules/three-d/animation/types";
import {
  createDefaultThreeDAnimationConfig,
  ANIMATION_PRESETS,
} from "@/modules/three-d/animation/defaults";
import { ThreeDAnimationEngine } from "@/modules/three-d/animation/engine";
import { ThreeDSceneConfig, createDefaultThreeDSceneConfig } from "@/modules/three-d/scene";
import { ThreeDSceneEngine } from "@/modules/three-d/scene/engine";

interface ModelAssetItem {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
}

export function TimelineStudioView({ projectId }: { projectId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneEngineRef = useRef<ThreeDSceneEngine | null>(null);
  const animationEngineRef = useRef<ThreeDAnimationEngine | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [projectData, setProjectData] = useState<{
    id: string;
    name: string;
    slug: string;
    category: string;
  } | null>(null);

  const [sceneConfig, setSceneConfig] = useState<ThreeDSceneConfig>(createDefaultThreeDSceneConfig());
  const [animationConfig, setAnimationConfig] = useState<ThreeDAnimationConfig>(createDefaultThreeDAnimationConfig());
  const [modelAssets, setModelAssets] = useState<ModelAssetItem[]>([]);

  // Playback & Scrubber State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.0); // 0.0 to 1.0
  const progressRef = useRef(0.0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Inspector Selection State
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tracks" | "scrolltrigger" | "presets">("tracks");

  // Keep progressRef in sync
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Active Timeline accessor
  const activeTimeline =
    animationConfig.timelines.find((t) => t.id === animationConfig.activeTimelineId) ||
    animationConfig.timelines[0];

  // Selected track and keyframe
  const selectedTrack = activeTimeline?.tracks.find((t) => t.id === selectedTrackId);
  const selectedKeyframe = selectedTrack?.keyframes.find((k) => k.id === selectedKeyframeId);

  // Fetch initial configuration
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/3d/animation`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        setProjectData(json.data.project);
        setSceneConfig(json.data.sceneConfig);
        setAnimationConfig(json.data.animationConfig);
        setModelAssets(json.data.modelAssets || []);

        if (json.data.animationConfig.timelines?.[0]?.tracks?.[0]) {
          setSelectedTrackId(json.data.animationConfig.timelines[0].tracks[0].id);
          if (json.data.animationConfig.timelines[0].tracks[0].keyframes?.[0]) {
            setSelectedKeyframeId(json.data.animationConfig.timelines[0].tracks[0].keyframes[0].id);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to load 3D animation config:", err);
      setErrorMessage(err.message || "Failed to load animation configuration");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Initialize Three.js Scene and Animation Engine
  useEffect(() => {
    if (loading || !containerRef.current) return;

    let engine: ThreeDSceneEngine;
    try {
      engine = new ThreeDSceneEngine(sceneConfig);
      sceneEngineRef.current = engine;

      const animEngine = new ThreeDAnimationEngine(engine);
      animationEngineRef.current = animEngine;

      if (activeTimeline) {
        animEngine.setTimeline(activeTimeline);
        animEngine.evaluate(progressRef.current);
      }

      engine.init(containerRef.current, {
        interactiveControls: true,
      });
    } catch (err) {
      console.error("ThreeDSceneEngine init error:", err);
    }

    const handleResize = () => {
      if (containerRef.current && sceneEngineRef.current) {
        sceneEngineRef.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (sceneEngineRef.current) {
        sceneEngineRef.current.dispose();
        sceneEngineRef.current = null;
      }
      animationEngineRef.current = null;
    };
  }, [loading]); // Only re-run on initial load complete

  // Update Animation Engine when activeTimeline changes
  useEffect(() => {
    if (animationEngineRef.current && activeTimeline) {
      animationEngineRef.current.setTimeline(activeTimeline);
      animationEngineRef.current.evaluate(progressRef.current);
    }
  }, [activeTimeline]);

  // RAF loop for timeline playback
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      const duration = activeTimeline?.duration || 4.0;
      let nextProgress = progressRef.current + dt / duration;
      if (nextProgress > 1.0) {
        nextProgress = nextProgress % 1.0;
      }

      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (animationEngineRef.current) {
        animationEngineRef.current.evaluate(nextProgress);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, activeTimeline?.duration]);

  // Manual Scrub Handler
  const handleScrub = (newProgress: number) => {
    setIsPlaying(false);
    const clamped = Math.max(0, Math.min(1, newProgress));
    progressRef.current = clamped;
    setProgress(clamped);

    if (animationEngineRef.current) {
      animationEngineRef.current.evaluate(clamped);
    }
  };

  // Toggle playback
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Reset playback to 0
  const handleResetPlayback = () => {
    setIsPlaying(false);
    handleScrub(0);
  };

  // Save to SQLite Database
  const handleSaveToDatabase = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      setSaveSuccess(null);

      const res = await fetch(`/api/projects/${projectId}/3d/animation`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(animationConfig),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to persist 3D animation");
      }

      setSaveSuccess("3D Animation timeline successfully persisted to database!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      console.error("Save animation error:", err);
      setErrorMessage(err.message || "Failed to save animation");
    } finally {
      setSaving(false);
    }
  };

  // Update a track's keyframes
  const updateTrackKeyframes = (trackId: string, updatedKeyframes: KeyframeConfig[]) => {
    setAnimationConfig((prev) => {
      const updatedTimelines = prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          tracks: tl.tracks.map((tr) => {
            if (tr.id !== trackId) return tr;
            return {
              ...tr,
              keyframes: [...updatedKeyframes].sort((a, b) => a.time - b.time),
            };
          }),
        };
      });
      return { ...prev, timelines: updatedTimelines };
    });
  };

  // Add Keyframe to current track at current progress
  const handleAddKeyframe = (trackId: string) => {
    const track = activeTimeline.tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Default value based on property type
    let defaultValue: any = 0;
    if (
      track.property === "position" ||
      track.property === "scale" ||
      track.property === "camera_position" ||
      track.property === "camera_target"
    ) {
      defaultValue = [0, 0, 0];
    } else if (track.property === "rotation") {
      defaultValue = [0, 0, 0];
    } else if (track.property === "light_color" || track.property === "material_color") {
      defaultValue = "#ffffff";
    } else if (track.property === "camera_fov") {
      defaultValue = 45;
    } else if (track.property === "light_intensity") {
      defaultValue = 1.5;
    } else if (track.property === "visible") {
      defaultValue = true;
    }

    const newKeyframe: KeyframeConfig = {
      id: `kf_${Date.now()}`,
      time: Math.round(progress * 100) / 100,
      value: defaultValue,
      ease: "power1.inOut",
    };

    const newKfs = [...track.keyframes, newKeyframe];
    updateTrackKeyframes(trackId, newKfs);
    setSelectedTrackId(trackId);
    setSelectedKeyframeId(newKeyframe.id);
  };

  // Delete keyframe
  const handleDeleteKeyframe = (trackId: string, kfId: string) => {
    const track = activeTimeline.tracks.find((t) => t.id === trackId);
    if (!track) return;
    const newKfs = track.keyframes.filter((k) => k.id !== kfId);
    updateTrackKeyframes(trackId, newKfs);
    if (selectedKeyframeId === kfId) {
      setSelectedKeyframeId(null);
    }
  };

  // Toggle track enabled
  const toggleTrackEnabled = (trackId: string) => {
    setAnimationConfig((prev) => ({
      ...prev,
      timelines: prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          tracks: tl.tracks.map((tr) => (tr.id === trackId ? { ...tr, enabled: !tr.enabled } : tr)),
        };
      }),
    }));
  };

  // Delete track
  const handleDeleteTrack = (trackId: string) => {
    setAnimationConfig((prev) => ({
      ...prev,
      timelines: prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          tracks: tl.tracks.filter((tr) => tr.id !== trackId),
        };
      }),
    }));
    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
      setSelectedKeyframeId(null);
    }
  };

  // Add a new track
  const handleAddNewTrack = (
    targetType: AnimationTargetType,
    targetId: string,
    property: AnimationPropertyType
  ) => {
    const newTrack: AnimationTrackConfig = {
      id: `track_${Date.now()}`,
      name: `${targetType.toUpperCase()} ${property}`,
      targetType,
      targetId,
      property,
      enabled: true,
      keyframes: [
        {
          id: `kf_${Date.now()}_start`,
          time: 0.0,
          value:
            property === "rotation" || property === "position" || property === "scale"
              ? [0, 0, 0]
              : property === "light_color" || property === "material_color"
              ? "#ffffff"
              : 1,
          ease: "linear",
        },
        {
          id: `kf_${Date.now()}_end`,
          time: 1.0,
          value:
            property === "rotation"
              ? [0, 180, 0]
              : property === "position"
              ? [0, 1, 0]
              : property === "scale"
              ? [1.2, 1.2, 1.2]
              : property === "light_color" || property === "material_color"
              ? "#06b6d4"
              : 2,
          ease: "linear",
        },
      ],
    };

    setAnimationConfig((prev) => ({
      ...prev,
      timelines: prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          tracks: [...tl.tracks, newTrack],
        };
      }),
    }));

    setSelectedTrackId(newTrack.id);
    setSelectedKeyframeId(newTrack.keyframes[0].id);
  };

  // Apply Built-in Animation Preset
  const handleApplyPreset = (presetKey: string) => {
    const preset = ANIMATION_PRESETS[presetKey];
    if (!preset) return;

    const primaryObjId = sceneConfig.objects?.[0]?.id || "obj_primary_showcase";
    const generatedTracks = preset.getTracks(primaryObjId);

    setAnimationConfig((prev) => ({
      ...prev,
      timelines: prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          tracks: [...tl.tracks, ...generatedTracks],
        };
      }),
    }));

    handleScrub(0);
    setSaveSuccess(`Preset "${preset.name}" applied to timeline!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Update ScrollTrigger settings
  const handleUpdateScrollTrigger = (key: string, value: any) => {
    setAnimationConfig((prev) => ({
      ...prev,
      timelines: prev.timelines.map((tl) => {
        if (tl.id !== prev.activeTimelineId) return tl;
        return {
          ...tl,
          scrollTrigger: {
            ...tl.scrollTrigger,
            [key]: value,
          },
        };
      }),
    }));
  };

  // Update Selected Keyframe Value
  const handleUpdateKeyframe = (patch: Partial<KeyframeConfig>) => {
    if (!selectedTrack || !selectedKeyframe) return;

    const updatedKfs = selectedTrack.keyframes.map((kf) => {
      if (kf.id !== selectedKeyframe.id) return kf;
      return { ...kf, ...patch };
    });

    updateTrackKeyframes(selectedTrack.id, updatedKfs);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Film className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm font-medium text-slate-400">Loading 3D Animation & Timeline Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-indigo-400" />
            <h1 className="text-sm font-semibold tracking-wide text-slate-200">
              3D Animation & Timeline Studio
            </h1>
            <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-xs text-indigo-300 border border-indigo-800/60 font-mono">
              Phase 3.4
            </span>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
          <Link
            href={`/projects/${projectId}/design`}
            className="px-3 py-1 text-xs rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            Design
          </Link>
          <Link
            href={`/projects/${projectId}/media`}
            className="px-3 py-1 text-xs rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            Media
          </Link>
          <Link
            href={`/projects/${projectId}/3d`}
            className="px-3 py-1 text-xs rounded font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            3D Scene
          </Link>
          <span className="px-3 py-1 text-xs rounded font-semibold bg-indigo-600 text-white shadow-sm">
            3D Animation
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchConfig}
            className="border-slate-800 text-slate-300 hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            onClick={handleSaveToDatabase}
            isLoading={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Timeline
          </Button>
        </div>
      </header>

      {/* Persistence / Error Toasts */}
      {saveSuccess && (
        <div className="bg-emerald-950/90 border-b border-emerald-800/80 px-6 py-2 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
          <button onClick={() => setSaveSuccess(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-950/90 border-b border-rose-800/80 px-6 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Body: 2 Columns (Viewport + Timeline Lane on Left, Inspector on Right) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Column: 3D Viewport + Bottom Timeline Track Editor */}
        <div className="flex flex-1 flex-col border-r border-slate-800 min-w-0">
          {/* Top: 3D Viewport with Live Overlay */}
          <div className="relative flex-1 min-h-0 bg-slate-950">
            <div ref={containerRef} className="h-full w-full" />

            {/* Viewport Floating Telemetry HUD */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-1.5 border border-slate-800 backdrop-blur text-xs font-mono text-slate-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Timeline: {activeTimeline?.name}</span>
              <span className="text-slate-600">|</span>
              <span className="text-indigo-400 font-semibold">
                {(progress * (activeTimeline?.duration || 4)).toFixed(2)}s / {(activeTimeline?.duration || 4).toFixed(1)}s
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Scrub: {Math.round(progress * 100)}%</span>
            </div>

            {/* Viewport Playback Controller Pill */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-full bg-slate-900/90 px-4 py-2 border border-slate-800 shadow-xl backdrop-blur">
              <button
                onClick={handleResetPlayback}
                title="Restart (0%)"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={togglePlay}
                title={isPlaying ? "Pause" : "Play"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-md transition-transform active:scale-95"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>

              {/* Scrubber Range Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={progress}
                  onChange={(e) => handleScrub(parseFloat(e.target.value))}
                  className="w-48 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="w-10 text-right font-mono text-xs text-indigo-300">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Area: Timeline Tracks Visualizer */}
          <div className="h-64 border-t border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
            {/* Timeline Toolbar */}
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-800 px-4 bg-slate-900/90 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Film className="h-3.5 w-3.5 text-indigo-400" />
                  Keyframe Tracks ({activeTimeline?.tracks.length || 0})
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">
                  Duration:
                  <input
                    type="number"
                    min="0.5"
                    max="60"
                    step="0.5"
                    value={activeTimeline?.duration || 4.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 4.0;
                      setAnimationConfig((prev) => ({
                        ...prev,
                        timelines: prev.timelines.map((tl) =>
                          tl.id === prev.activeTimelineId ? { ...tl, duration: val } : tl
                        ),
                      }));
                    }}
                    className="ml-1 w-14 rounded bg-slate-950 px-1.5 py-0.5 border border-slate-700 font-mono text-indigo-300 text-xs text-center"
                  />
                  s
                </span>
              </div>

              {/* Quick Add Keyframe to selected track */}
              <div className="flex items-center gap-2">
                {selectedTrack && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddKeyframe(selectedTrack.id)}
                    className="h-7 text-xs border-indigo-700/60 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/60"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Keyframe at {Math.round(progress * 100)}%
                  </Button>
                )}
              </div>
            </div>

            {/* Tracks List + Lanes */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {activeTimeline?.tracks.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-500">
                  No animation tracks. Add a track from the right inspector or apply a preset.
                </div>
              ) : (
                activeTimeline?.tracks.map((track) => {
                  const isSelected = selectedTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelectedTrackId(track.id)}
                      className={`flex h-12 border-b border-slate-800/60 transition-colors cursor-pointer ${
                        isSelected ? "bg-indigo-950/20" : "hover:bg-slate-800/30"
                      }`}
                    >
                      {/* Left Track Header */}
                      <div className="flex w-64 shrink-0 items-center justify-between border-r border-slate-800 px-3 bg-slate-900/80">
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTrackEnabled(track.id);
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            {track.enabled ? (
                              <Eye className="h-3.5 w-3.5 text-indigo-400" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-slate-600" />
                            )}
                          </button>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase ${
                              track.targetType === "object"
                                ? "bg-sky-950 text-sky-400 border border-sky-800/50"
                                : track.targetType === "camera"
                                ? "bg-amber-950 text-amber-400 border border-amber-800/50"
                                : track.targetType === "light"
                                ? "bg-yellow-950 text-yellow-400 border border-yellow-800/50"
                                : "bg-purple-950 text-purple-400 border border-purple-800/50"
                            }`}
                          >
                            {track.targetType}
                          </span>
                          <span className="truncate text-xs font-medium text-slate-200" title={track.name}>
                            {track.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTrack(track.id);
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete track"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right Timeline Lane (0% to 100%) */}
                      <div className="relative flex-1 bg-slate-950/40 overflow-hidden flex items-center px-4">
                        {/* Playhead Vertical Line */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-indigo-500 z-10 pointer-events-none"
                          style={{ left: `${progress * 100}%` }}
                        />

                        {/* Background subtle grid marks */}
                        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                          <div className="w-px h-full bg-slate-600" />
                          <div className="w-px h-full bg-slate-600" />
                          <div className="w-px h-full bg-slate-600" />
                          <div className="w-px h-full bg-slate-600" />
                          <div className="w-px h-full bg-slate-600" />
                        </div>

                        {/* Keyframe Diamonds */}
                        {track.keyframes.map((kf) => {
                          const isKfSelected = selectedKeyframeId === kf.id;
                          return (
                            <button
                              key={kf.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrackId(track.id);
                                setSelectedKeyframeId(kf.id);
                                handleScrub(kf.time);
                              }}
                              style={{ left: `${kf.time * 100}%` }}
                              className={`absolute -translate-x-1/2 flex h-4 w-4 items-center justify-center rotate-45 transition-transform ${
                                isKfSelected
                                  ? "bg-indigo-400 scale-125 ring-2 ring-white shadow-lg z-20"
                                  : "bg-indigo-600 hover:bg-indigo-400 hover:scale-110 z-10"
                              }`}
                              title={`Keyframe at ${Math.round(kf.time * 100)}% (${kf.ease || "linear"})`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inspector & Settings Panel */}
        <div className="w-80 shrink-0 border-l border-slate-800 bg-slate-900/50 flex flex-col overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900 text-xs font-medium">
            <button
              onClick={() => setActiveTab("tracks")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeTab === "tracks"
                  ? "border-indigo-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Keyframes
            </button>
            <button
              onClick={() => setActiveTab("scrolltrigger")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeTab === "scrolltrigger"
                  ? "border-indigo-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              ScrollTrigger
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeTab === "presets"
                  ? "border-indigo-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Presets
            </button>
          </div>

          <div className="p-4 space-y-6">
            {activeTab === "tracks" && (
              <>
                {/* Selected Keyframe Inspector */}
                {selectedKeyframe && selectedTrack ? (
                  <div className="space-y-4 rounded-lg bg-slate-950 p-4 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                        Keyframe Inspector
                      </h3>
                      <button
                        onClick={() => handleDeleteKeyframe(selectedTrack.id, selectedKeyframe.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>

                    {/* Progress / Time */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Timeline Position</span>
                        <span className="font-mono text-indigo-400">{Math.round(selectedKeyframe.time * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={selectedKeyframe.time}
                        onChange={(e) => {
                          const t = parseFloat(e.target.value);
                          handleUpdateKeyframe({ time: t });
                          handleScrub(t);
                        }}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Easing Selector */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400">Interpolation Easing</label>
                      <select
                        value={selectedKeyframe.ease || "linear"}
                        onChange={(e) => handleUpdateKeyframe({ ease: e.target.value as EasingType })}
                        className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-slate-200 font-mono"
                      >
                        <option value="linear">linear (constant velocity)</option>
                        <option value="power1.in">power1.in (smooth accelerate)</option>
                        <option value="power1.out">power1.out (smooth decelerate)</option>
                        <option value="power1.inOut">power1.inOut (cinematic ease)</option>
                        <option value="power2.out">power2.out (crisp brake)</option>
                        <option value="power2.inOut">power2.inOut (dramatic curve)</option>
                        <option value="sine.inOut">sine.inOut (gentle wave)</option>
                        <option value="expo.out">expo.out (instant snap)</option>
                      </select>
                    </div>

                    {/* Value Editor according to property */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs font-medium text-slate-300">
                        Value ({selectedTrack.property})
                      </label>

                      {/* Vector3: position, rotation, scale, camera_position, camera_target */}
                      {Array.isArray(selectedKeyframe.value) ? (
                        <div className="grid grid-cols-3 gap-2">
                          {["X", "Y", "Z"].map((axis, i) => (
                            <div key={axis} className="space-y-0.5">
                              <span className="text-[10px] text-slate-500 font-mono">{axis}</span>
                              <input
                                type="number"
                                step={selectedTrack.property === "scale" ? "0.1" : "1"}
                                value={(selectedKeyframe.value as number[])[i]}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const newVec = [...(selectedKeyframe.value as number[])] as [
                                    number,
                                    number,
                                    number
                                  ];
                                  newVec[i] = val;
                                  handleUpdateKeyframe({ value: newVec });
                                  if (animationEngineRef.current) {
                                    animationEngineRef.current.evaluate(progressRef.current);
                                  }
                                }}
                                className="w-full rounded bg-slate-900 border border-slate-700 px-1.5 py-1 text-xs text-indigo-300 font-mono"
                              />
                            </div>
                          ))}
                        </div>
                      ) : typeof selectedKeyframe.value === "string" ? (
                        /* Color hex picker */
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedKeyframe.value}
                            onChange={(e) => {
                              handleUpdateKeyframe({ value: e.target.value });
                              if (animationEngineRef.current) {
                                animationEngineRef.current.evaluate(progressRef.current);
                              }
                            }}
                            className="h-8 w-12 rounded cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={selectedKeyframe.value}
                            onChange={(e) => {
                              handleUpdateKeyframe({ value: e.target.value });
                              if (animationEngineRef.current) {
                                animationEngineRef.current.evaluate(progressRef.current);
                              }
                            }}
                            className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 font-mono"
                          />
                        </div>
                      ) : typeof selectedKeyframe.value === "number" ? (
                        /* Scalar number (intensity, fov, roughness, metalness) */
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.05"
                            value={selectedKeyframe.value}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              handleUpdateKeyframe({ value: val });
                              if (animationEngineRef.current) {
                                animationEngineRef.current.evaluate(progressRef.current);
                              }
                            }}
                            className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-indigo-300 font-mono"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 text-center text-xs text-slate-500">
                    Click any keyframe diamond on the timeline to edit its value and easing curve.
                  </div>
                )}

                {/* Add New Track Section */}
                <div className="space-y-3 rounded-lg bg-slate-950 p-4 border border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Add Animation Track
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAddNewTrack(
                          "object",
                          sceneConfig.objects?.[0]?.id || "obj_primary_showcase",
                          "rotation"
                        )
                      }
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Box className="h-3 w-3 text-sky-400" />
                      Object Rotation
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAddNewTrack(
                          "object",
                          sceneConfig.objects?.[0]?.id || "obj_primary_showcase",
                          "position"
                        )
                      }
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Box className="h-3 w-3 text-sky-400" />
                      Object Position
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNewTrack("camera", "mainCamera", "camera_position")}
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Camera className="h-3 w-3 text-amber-400" />
                      Camera Position
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNewTrack("camera", "mainCamera", "camera_fov")}
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Camera className="h-3 w-3 text-amber-400" />
                      Camera FOV
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddNewTrack("light", "mainDirectional", "light_intensity")}
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Sun className="h-3 w-3 text-yellow-400" />
                      Light Intensity
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleAddNewTrack(
                          "material",
                          sceneConfig.objects?.[0]?.id || "obj_primary_showcase",
                          "material_color"
                        )
                      }
                      className="text-xs border-slate-800 hover:bg-slate-800 flex items-center justify-start gap-1.5"
                    >
                      <Palette className="h-3 w-3 text-purple-400" />
                      Material Color
                    </Button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "scrolltrigger" && (
              <div className="space-y-4 rounded-lg bg-slate-950 p-4 border border-slate-800">
                <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  GSAP ScrollTrigger Linkage
                </h3>
                <p className="text-xs text-slate-400">
                  Configure how the client website visitor&apos;s scroll wheel and gestures drive this 3D animation.
                </p>

                {/* Enabled */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-300">Enable Scroll Linking</span>
                  <input
                    type="checkbox"
                    checked={activeTimeline?.scrollTrigger.enabled}
                    onChange={(e) => handleUpdateScrollTrigger("enabled", e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                  />
                </div>

                {/* Pin Viewport */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Pin Canvas Viewport</span>
                  <input
                    type="checkbox"
                    checked={activeTimeline?.scrollTrigger.pin}
                    onChange={(e) => handleUpdateScrollTrigger("pin", e.target.checked)}
                    className="h-4 w-4 rounded accent-indigo-600"
                  />
                </div>

                {/* Start Position */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Scroll Start Trigger</label>
                  <input
                    type="text"
                    value={activeTimeline?.scrollTrigger.start || "top top"}
                    onChange={(e) => handleUpdateScrollTrigger("start", e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">e.g. &quot;top top&quot; or &quot;top 20%&quot;</p>
                </div>

                {/* End Distance */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Scroll End Distance</label>
                  <input
                    type="text"
                    value={activeTimeline?.scrollTrigger.end || "+=2500"}
                    onChange={(e) => handleUpdateScrollTrigger("end", e.target.value)}
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-200 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">
                    e.g. &quot;+=2500&quot; for 2500px of scroll travel, or &quot;bottom bottom&quot;
                  </p>
                </div>

                {/* Scrub Lag Damping */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Scrub Smoothing (Lag)</span>
                    <span className="font-mono text-indigo-400">
                      {typeof activeTimeline?.scrollTrigger.scrub === "number"
                        ? `${activeTimeline.scrollTrigger.scrub}s`
                        : "instant"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.2"
                    value={
                      typeof activeTimeline?.scrollTrigger.scrub === "number"
                        ? activeTimeline.scrollTrigger.scrub
                        : 0
                    }
                    onChange={(e) =>
                      handleUpdateScrollTrigger(
                        "scrub",
                        parseFloat(e.target.value) === 0 ? true : parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Production Animation Presets
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly append pre-engineered cinematic 3D choreography to your active timeline.
                </p>

                {Object.entries(ANIMATION_PRESETS).map(([key, preset]) => (
                  <div
                    key={key}
                    className="rounded-lg bg-slate-950 p-3 border border-slate-800 hover:border-indigo-800/80 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-indigo-400" />
                        {preset.name}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApplyPreset(key)}
                        className="h-6 text-[10px] px-2 border-indigo-700/60 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-900/60"
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-400">{preset.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
