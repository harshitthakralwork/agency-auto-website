"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  Camera,
  Sun,
  Palette,
  Compass,
  Activity,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Sliders,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import {
  ThreeDSceneConfig,
  CameraPreset,
  SceneObjectConfig,
  MaterialOverrideConfig,
  createDefaultThreeDSceneConfig,
  createLightingConfigFromPreset,
  CAMERA_PRESETS,
} from "@/modules/three-d/scene";
import { ThreeDSceneEngine, SceneEngineMetrics } from "@/modules/three-d/scene/engine";
import { ThreeDLightingPreset } from "@/modules/three-d/types";

interface ModelAssetItem {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  assignedSlot?: string | null;
}

interface SceneStudioViewProps {
  project: {
    id: string;
    name: string;
    slug: string;
    category: string;
    experienceLevel: string;
  };
  initialConfig: ThreeDSceneConfig;
  availableModels: ModelAssetItem[];
}

export function SceneStudioView({
  project,
  initialConfig,
  availableModels,
}: SceneStudioViewProps) {
  const [config, setConfig] = useState<ThreeDSceneConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<
    "hierarchy" | "properties" | "camera" | "lighting" | "materials" | "environment" | "performance"
  >("hierarchy");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
    initialConfig.objects[0]?.id || null
  );

  const [metrics, setMetrics] = useState<SceneEngineMetrics>({
    fps: 60,
    meshCount: 0,
    vertexCount: 0,
    objectCount: initialConfig.objects.length,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Add object modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newObjectType, setNewObjectType] = useState<"asset" | "procedural">("procedural");
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    availableModels[0]?.id || ""
  );
  const [selectedProceduralType, setSelectedProceduralType] = useState<
    "product_model" | "spatial_environment" | "hero_floating_object" | "interactive_particles"
  >("product_model");
  const [newObjectName, setNewObjectName] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<ThreeDSceneEngine | null>(null);

  // Initialize ThreeDSceneEngine on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let engine: ThreeDSceneEngine | null = null;
    let isCancelled = false;

    const initEngine = async () => {
      engine = new ThreeDSceneEngine(config);
      engineRef.current = engine;

      await engine.init(containerRef.current!, {
        interactiveControls: true,
        onMetricsUpdate: (m) => {
          if (!isCancelled) setMetrics(m);
        },
      });
    };

    initEngine();

    const handleResize = () => {
      if (engine && containerRef.current) {
        engine.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", handleResize);
      if (engine) {
        engine.dispose();
        engineRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Selected Object helper
  const selectedObject = config.objects.find((o) => o.id === selectedObjectId);

  // -------------------------------------------------------------
  // Live Engine Synchronization Handlers
  // -------------------------------------------------------------

  const handleUpdateObjectTransform = (
    field: "position" | "rotation" | "scale",
    axisIndex: 0 | 1 | 2,
    value: number
  ) => {
    if (!selectedObjectId || !selectedObject) return;

    const newValues: [number, number, number] = [...selectedObject[field]];
    newValues[axisIndex] = value;

    const updatedObjects = config.objects.map((obj) => {
      if (obj.id === selectedObjectId) {
        return { ...obj, [field]: newValues };
      }
      return obj;
    });

    setConfig((prev) => ({ ...prev, objects: updatedObjects }));

    if (engineRef.current) {
      engineRef.current.updateObjectTransform(selectedObjectId, { [field]: newValues });
    }
  };

  const handleToggleObjectVisibility = (id: string) => {
    const target = config.objects.find((o) => o.id === id);
    if (!target) return;

    const newVis = !target.visible;
    const updated = config.objects.map((o) => (o.id === id ? { ...o, visible: newVis } : o));
    setConfig((prev) => ({ ...prev, objects: updated }));

    if (engineRef.current) {
      engineRef.current.updateObjectTransform(id, { visible: newVis });
    }
  };

  const handleToggleShadow = (field: "castShadow" | "receiveShadow") => {
    if (!selectedObjectId || !selectedObject) return;

    const newVal = !selectedObject[field];
    const updated = config.objects.map((o) =>
      o.id === selectedObjectId ? { ...o, [field]: newVal } : o
    );
    setConfig((prev) => ({ ...prev, objects: updated }));

    if (engineRef.current) {
      engineRef.current.updateObjectTransform(selectedObjectId, { [field]: newVal });
    }
  };

  const handleCameraPresetChange = (preset: CameraPreset) => {
    const p = CAMERA_PRESETS[preset] || CAMERA_PRESETS.hero_angle;
    const updatedCamera = {
      ...config.camera,
      preset,
      position: [...p.position] as [number, number, number],
      target: [...p.target] as [number, number, number],
      fov: p.fov,
    };
    setConfig((prev) => ({ ...prev, camera: updatedCamera }));

    if (engineRef.current) {
      engineRef.current.setCameraPreset(preset);
    }
  };

  const handleFovChange = (fov: number) => {
    const updatedCamera = { ...config.camera, fov };
    setConfig((prev) => ({ ...prev, camera: updatedCamera }));

    if (engineRef.current) {
      engineRef.current.applyCamera(updatedCamera);
    }
  };

  const handleLightingPresetChange = (preset: ThreeDLightingPreset) => {
    const newLighting = createLightingConfigFromPreset(preset);
    setConfig((prev) => ({ ...prev, lighting: newLighting }));

    if (engineRef.current) {
      engineRef.current.applyLighting(newLighting);
    }
  };

  const handleAmbientIntensityChange = (intensity: number) => {
    const updatedLighting = {
      ...config.lighting,
      ambient: { ...config.lighting.ambient, intensity },
    };
    setConfig((prev) => ({ ...prev, lighting: updatedLighting }));

    if (engineRef.current) {
      engineRef.current.applyLighting(updatedLighting);
    }
  };

  const handleKeyIntensityChange = (intensity: number) => {
    const updatedLighting = {
      ...config.lighting,
      mainDirectional: { ...config.lighting.mainDirectional, intensity },
    };
    setConfig((prev) => ({ ...prev, lighting: updatedLighting }));

    if (engineRef.current) {
      engineRef.current.applyLighting(updatedLighting);
    }
  };

  const handleMaterialOverrideChange = (
    updates: Partial<MaterialOverrideConfig>
  ) => {
    if (!selectedObjectId || !selectedObject) return;

    const currentOverride = selectedObject.materialOverride || { enabled: true };
    const mergedOverride: MaterialOverrideConfig = {
      ...currentOverride,
      ...updates,
      enabled: true,
    };

    const updated = config.objects.map((o) =>
      o.id === selectedObjectId ? { ...o, materialOverride: mergedOverride } : o
    );
    setConfig((prev) => ({ ...prev, objects: updated }));

    if (engineRef.current) {
      engineRef.current.applyMaterialOverride(selectedObjectId, mergedOverride);
    }
  };

  const handleResetMaterial = () => {
    if (!selectedObjectId) return;

    const updated = config.objects.map((o) => {
      if (o.id === selectedObjectId) {
        return {
          ...o,
          materialOverride: o.materialOverride
            ? { ...o.materialOverride, enabled: false }
            : undefined,
        };
      }
      return o;
    });
    setConfig((prev) => ({ ...prev, objects: updated }));

    if (engineRef.current) {
      engineRef.current.resetMaterialOverride(selectedObjectId);
    }
  };

  const handleEnvironmentChange = (
    field: "backgroundMode" | "backgroundColor",
    value: string
  ) => {
    const updatedEnv = { ...config.environment, [field]: value };
    setConfig((prev) => ({ ...prev, environment: updatedEnv }));

    if (engineRef.current) {
      engineRef.current.applyEnvironment(updatedEnv);
    }
  };

  const handleFogToggle = () => {
    const newFog = { ...config.environment.fog, enabled: !config.environment.fog.enabled };
    const updatedEnv = { ...config.environment, fog: newFog };
    setConfig((prev) => ({ ...prev, environment: updatedEnv }));

    if (engineRef.current) {
      engineRef.current.applyEnvironment(updatedEnv);
    }
  };

  const handleGroundPlaneToggle = () => {
    const newGround = {
      ...config.environment.groundPlane,
      enabled: !config.environment.groundPlane.enabled,
    };
    const updatedEnv = { ...config.environment, groundPlane: newGround };
    setConfig((prev) => ({ ...prev, environment: updatedEnv }));

    if (engineRef.current) {
      engineRef.current.applyEnvironment(updatedEnv);
    }
  };

  const handleGridHelperToggle = () => {
    const newGrid = {
      ...config.environment.gridHelper,
      enabled: !config.environment.gridHelper.enabled,
    };
    const updatedEnv = { ...config.environment, gridHelper: newGrid };
    setConfig((prev) => ({ ...prev, environment: updatedEnv }));

    if (engineRef.current) {
      engineRef.current.applyEnvironment(updatedEnv);
    }
  };

  // -------------------------------------------------------------
  // Add / Duplicate / Remove Objects
  // -------------------------------------------------------------

  const handleAddObjectConfirm = async () => {
    const newId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let name = newObjectName.trim();

    const newObj: SceneObjectConfig = {
      id: newId,
      name: name || (newObjectType === "asset" ? "Model Asset" : "Procedural Mesh"),
      sourceType: newObjectType,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      castShadow: true,
      receiveShadow: true,
    };

    if (newObjectType === "asset") {
      const foundAsset = availableModels.find((m) => m.id === selectedAssetId);
      if (foundAsset) {
        newObj.assetId = foundAsset.id;
        newObj.assetUrl = foundAsset.fileUrl;
        if (!name) newObj.name = foundAsset.name;
      }
    } else {
      newObj.proceduralType = selectedProceduralType;
      if (!name) {
        newObj.name =
          selectedProceduralType === "product_model"
            ? "Product Chassis"
            : selectedProceduralType === "hero_floating_object"
            ? "Floating Knot"
            : selectedProceduralType === "spatial_environment"
            ? "Pedestal Columns"
            : "Particle Galaxy";
      }
    }

    if (engineRef.current) {
      await engineRef.current.addObject(newObj);
    }

    setConfig((prev) => ({
      ...prev,
      objects: [...prev.objects, newObj],
    }));

    setSelectedObjectId(newId);
    setIsAddModalOpen(false);
    setNewObjectName("");
  };

  const handleDuplicateObject = async () => {
    if (!selectedObjectId || !engineRef.current) return;
    const duplicated = await engineRef.current.duplicateObject(selectedObjectId);
    if (duplicated) {
      setConfig((prev) => ({
        ...prev,
        objects: [...prev.objects, duplicated],
      }));
      setSelectedObjectId(duplicated.id);
    }
  };

  const handleRemoveObject = (id: string) => {
    if (config.objects.length <= 1) {
      alert("The scene must contain at least one object.");
      return;
    }

    if (engineRef.current) {
      engineRef.current.removeObject(id);
    }

    const updated = config.objects.filter((o) => o.id !== id);
    setConfig((prev) => ({ ...prev, objects: updated }));

    if (selectedObjectId === id) {
      setSelectedObjectId(updated[0]?.id || null);
    }
  };

  const handleResetObjectTransform = () => {
    if (!selectedObjectId || !engineRef.current) return;
    engineRef.current.updateObjectTransform(selectedObjectId, {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    });
    const updated = config.objects.map((o) =>
      o.id === selectedObjectId
        ? { ...o, position: [0, 0, 0] as [number, number, number], rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number] }
        : o
    );
    setConfig((prev) => ({ ...prev, objects: updated }));
  };

  const handleResetScene = async () => {
    if (!confirm("Are you sure you want to reset the entire scene to standard defaults?")) {
      return;
    }
    const def = createDefaultThreeDSceneConfig();
    setConfig(def);
    setSelectedObjectId(def.objects[0]?.id || null);
    if (engineRef.current) {
      await engineRef.current.applyConfig(def);
    }
  };

  // -------------------------------------------------------------
  // Persistence: Save Scene to SQLite
  // -------------------------------------------------------------

  const handleSaveScene = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/3d/scene`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save scene configuration");
      }

      setSaveStatus("success");
      setStatusMessage("3D Scene successfully persisted to project database.");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch (err: any) {
      setSaveStatus("error");
      setStatusMessage(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
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
              3D Scene & Camera Studio
            </h1>
            <span className="text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-0.5 rounded-full">
              Phase 3.3 Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time WebGL scene constructor for{" "}
            <span className="text-white font-semibold">{project.name}</span>. Configure multi-object
            transforms, camera trajectories, lighting rigs, and material overrides.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetScene}
            className="gap-1.5 text-slate-300 border-slate-700"
            data-testid="reset-scene-btn"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Scene</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSaveScene}
            disabled={isSaving}
            className="gap-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950"
            data-testid="save-scene-btn"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaving ? "Saving..." : "Save 3D Scene"}</span>
          </Button>

          <Link href={`/projects/${project.id}/preview`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1.5 text-cyan-400 border-cyan-800/80">
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Save Status Notification */}
      {saveStatus === "success" && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusMessage}</span>
        </div>
      )}
      {saveStatus === "error" && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Studio Workspace: Left Viewport (60%) & Right Control Drawer (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Central WebGL Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            {/* Viewport Top Bar HUD */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto flex items-center gap-2.5 text-xs font-mono text-slate-300">
                <Box className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold text-white">Three.js WebGL Scene</span>
                <span className="text-[10px] text-slate-500">|</span>
                <span className="text-[11px] text-emerald-400 font-bold">{metrics.fps} FPS</span>
              </div>

              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>{metrics.objectCount} Objects</span>
                <span>•</span>
                <span>{metrics.meshCount} Meshes</span>
                <span>•</span>
                <span>{metrics.vertexCount.toLocaleString()} Verts</span>
              </div>
            </div>

            {/* Real WebGL Canvas Container */}
            <div
              ref={containerRef}
              className="w-full h-[480px] md:h-[580px] cursor-grab active:cursor-grabbing select-none"
              data-testid="three-d-viewport"
            />

            {/* Viewport Bottom Hint */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
                <span>Drag to Orbit</span> · <span>Right Click to Pan</span> · <span>Scroll to Zoom</span>
              </div>

              <div className="pointer-events-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGridHelperToggle}
                  className={`h-7 px-2 text-[10px] font-mono gap-1 border-slate-800 ${
                    config.environment.gridHelper.enabled
                      ? "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                      : "bg-slate-900/80 text-slate-400"
                  }`}
                  data-testid="toggle-grid-btn"
                >
                  <Grid className="h-3 w-3" />
                  <span>Grid</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGroundPlaneToggle}
                  className={`h-7 px-2 text-[10px] font-mono gap-1 border-slate-800 ${
                    config.environment.groundPlane.enabled
                      ? "bg-indigo-950/80 text-indigo-300 border-indigo-800"
                      : "bg-slate-900/80 text-slate-400"
                  }`}
                  data-testid="toggle-ground-btn"
                >
                  <Layers className="h-3 w-3" />
                  <span>Ground</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Configuration Inspector Panels (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {[
              { id: "hierarchy", label: "Objects", icon: Layers },
              { id: "properties", label: "Transform", icon: Sliders },
              { id: "materials", label: "Material", icon: Palette },
              { id: "camera", label: "Camera", icon: Camera },
              { id: "lighting", label: "Lighting", icon: Sun },
              { id: "environment", label: "Env", icon: Compass },
              { id: "performance", label: "Perf", icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Panel 1: Hierarchy / Objects */}
          {activeTab === "hierarchy" && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>Scene Object Graph</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white gap-1"
                    data-testid="add-object-trigger-btn"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Object</span>
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Select an object to inspect its transforms, shadows, and material overrides.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {config.objects.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedObjectId === obj.id
                        ? "border-cyan-500/80 bg-cyan-950/30 text-white shadow-lg shadow-cyan-950/40"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                    data-testid={`object-item-${obj.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                          selectedObjectId === obj.id ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        <Box className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold leading-none">{obj.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                          {obj.sourceType === "asset" ? "GLB Asset" : `Procedural (${obj.proceduralType})`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleObjectVisibility(obj.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title={obj.visible ? "Hide Object" : "Show Object"}
                        data-testid={`toggle-vis-${obj.id}`}
                      >
                        {obj.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-rose-400" />}
                      </button>

                      <button
                        onClick={() => handleRemoveObject(obj.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Delete Object"
                        data-testid={`delete-obj-${obj.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 2: Transform & Object Properties */}
          {activeTab === "properties" && selectedObject && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-cyan-400" />
                    <span>{selectedObject.name} — Transform</span>
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDuplicateObject}
                      className="h-7 text-xs border-slate-700 text-slate-300 gap-1"
                      data-testid="duplicate-obj-btn"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Duplicate</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetObjectTransform}
                      className="h-7 text-xs border-slate-700 text-slate-300 gap-1"
                      data-testid="reset-transform-btn"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Position X, Y, Z */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-slate-300">Position (X, Y, Z)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <div key={axis} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{axis}</span>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedObject.position[i as 0 | 1 | 2]}
                          onChange={(e) =>
                            handleUpdateObjectTransform("position", i as 0 | 1 | 2, parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-transparent text-xs text-white text-right focus:outline-none"
                          data-testid={`pos-${axis.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation X, Y, Z (Degrees) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-slate-300">Rotation (Degrees)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <div key={axis} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold">{axis}</span>
                        <input
                          type="number"
                          step="5"
                          value={selectedObject.rotation[i as 0 | 1 | 2]}
                          onChange={(e) =>
                            handleUpdateObjectTransform("rotation", i as 0 | 1 | 2, parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-transparent text-xs text-white text-right focus:outline-none"
                          data-testid={`rot-${axis.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale X, Y, Z */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-semibold text-slate-300">Scale Factor</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["X", "Y", "Z"].map((axis, i) => (
                      <div key={axis} className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">{axis}</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="10"
                          value={selectedObject.scale[i as 0 | 1 | 2]}
                          onChange={(e) =>
                            handleUpdateObjectTransform("scale", i as 0 | 1 | 2, parseFloat(e.target.value) || 1)
                          }
                          className="w-full bg-transparent text-xs text-white text-right focus:outline-none"
                          data-testid={`scale-${axis.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shadows & Visibility */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Cast Dynamic Shadows</span>
                    <input
                      type="checkbox"
                      checked={selectedObject.castShadow}
                      onChange={() => handleToggleShadow("castShadow")}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      data-testid="cast-shadow-checkbox"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Receive Surface Shadows</span>
                    <input
                      type="checkbox"
                      checked={selectedObject.receiveShadow}
                      onChange={() => handleToggleShadow("receiveShadow")}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                      data-testid="receive-shadow-checkbox"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 3: Material Overrides */}
          {activeTab === "materials" && selectedObject && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Palette className="h-4 w-4 text-pink-400" />
                    <span>Material Overrides</span>
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResetMaterial}
                    className="h-7 text-xs border-slate-700 text-slate-300 gap-1"
                    data-testid="reset-material-btn"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Original</span>
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Non-destructive PBR surface overrides for {selectedObject.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Base Color Picker */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300">Albedo Tint Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedObject.materialOverride?.color || "#ffffff"}
                      onChange={(e) => handleMaterialOverrideChange({ color: e.target.value })}
                      className="h-7 w-9 bg-transparent cursor-pointer rounded border border-slate-700"
                      data-testid="mat-color-picker"
                    />
                    <span className="text-xs font-mono text-slate-400">
                      {selectedObject.materialOverride?.color || "#ffffff"}
                    </span>
                  </div>
                </div>

                {/* Roughness Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Surface Roughness</span>
                    <span className="font-mono text-cyan-400">
                      {Math.round((selectedObject.materialOverride?.roughness ?? 0.5) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObject.materialOverride?.roughness ?? 0.5}
                    onChange={(e) =>
                      handleMaterialOverrideChange({ roughness: parseFloat(e.target.value) })
                    }
                    className="w-full accent-cyan-500"
                    data-testid="mat-roughness-slider"
                  />
                </div>

                {/* Metalness Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Metallic Reflection</span>
                    <span className="font-mono text-indigo-400">
                      {Math.round((selectedObject.materialOverride?.metalness ?? 0.0) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedObject.materialOverride?.metalness ?? 0.0}
                    onChange={(e) =>
                      handleMaterialOverrideChange({ metalness: parseFloat(e.target.value) })
                    }
                    className="w-full accent-indigo-500"
                    data-testid="mat-metalness-slider"
                  />
                </div>

                {/* Wireframe & Transparency */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Wireframe Mesh Overlay</span>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedObject.materialOverride?.wireframe)}
                      onChange={(e) => handleMaterialOverrideChange({ wireframe: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-pink-500 focus:ring-0"
                      data-testid="mat-wireframe-checkbox"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">Double-Sided Face Normal</span>
                    <input
                      type="checkbox"
                      checked={Boolean(selectedObject.materialOverride?.doubleSided)}
                      onChange={(e) => handleMaterialOverrideChange({ doubleSided: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-pink-500 focus:ring-0"
                      data-testid="mat-doublesided-checkbox"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 4: Camera */}
          {activeTab === "camera" && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Camera className="h-4 w-4 text-cyan-400" />
                  <span>Camera Controls & Presets</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Perspective camera projection, viewport clipping, and cinematic angles.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Camera Preset Quick Buttons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Camera Angle Preset</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "hero_angle", label: "Hero Angle" },
                      { id: "front", label: "Front Low" },
                      { id: "top_down", label: "Top Down" },
                      { id: "isometric", label: "Isometric" },
                      { id: "cinematic_low", label: "Cinematic" },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleCameraPresetChange(preset.id as CameraPreset)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-mono transition ${
                          config.camera.preset === preset.id
                            ? "bg-cyan-600 text-white font-bold"
                            : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                        data-testid={`camera-preset-${preset.id}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FOV Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Field of View (FOV)</span>
                    <span className="font-mono text-cyan-400">{config.camera.fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="90"
                    value={config.camera.fov}
                    onChange={(e) => handleFovChange(parseInt(e.target.value) || 45)}
                    className="w-full accent-cyan-500"
                    data-testid="camera-fov-slider"
                  />
                </div>

                {/* Camera Coordinate HUD */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Position:</span>
                    <span className="text-slate-200">
                      [{config.camera.position.map((v) => v.toFixed(1)).join(", ")}]
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target:</span>
                    <span className="text-slate-200">
                      [{config.camera.target.map((v) => v.toFixed(1)).join(", ")}]
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Clipping:</span>
                    <span className="text-slate-200">
                      {config.camera.near}m – {config.camera.far}m
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 5: Lighting */}
          {activeTab === "lighting" && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Studio Lighting Rig</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Key, fill, rim, and ambient illumination matching Phase 3.1 presets.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Lighting Preset Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Atmosphere Preset</label>
                  <select
                    value={config.lighting.preset}
                    onChange={(e) => handleLightingPresetChange(e.target.value as ThreeDLightingPreset)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    data-testid="lighting-preset-select"
                  >
                    <option value="studio">Studio Light (Neutral Balanced)</option>
                    <option value="sunset">Sunset Amber (Warm Twilight)</option>
                    <option value="dramatic_neon">Dramatic Neon (Cyan & Magenta)</option>
                    <option value="clinical_bright">Clinical White (Clean Architecture)</option>
                    <option value="luxury_warm">Luxury Warm (Champagne Gold)</option>
                  </select>
                </div>

                {/* Key Light Intensity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Key Light Power</span>
                    <span className="font-mono text-amber-400">
                      {config.lighting.mainDirectional.intensity.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={config.lighting.mainDirectional.intensity}
                    onChange={(e) => handleKeyIntensityChange(parseFloat(e.target.value) || 1.8)}
                    className="w-full accent-amber-500"
                    data-testid="key-light-slider"
                  />
                </div>

                {/* Ambient Light Intensity */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Ambient Daylight Fill</span>
                    <span className="font-mono text-slate-300">
                      {config.lighting.ambient.intensity.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={config.lighting.ambient.intensity}
                    onChange={(e) => handleAmbientIntensityChange(parseFloat(e.target.value) || 0.5)}
                    className="w-full accent-slate-400"
                    data-testid="ambient-light-slider"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 6: Environment */}
          {activeTab === "environment" && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-400" />
                  <span>Environment & Atmosphere</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Canvas background, depth fog, and floor plane configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Background Mode */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Background Canvas Mode</label>
                  <select
                    value={config.environment.backgroundMode}
                    onChange={(e) => handleEnvironmentChange("backgroundMode", e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    data-testid="bg-mode-select"
                  >
                    <option value="color">Solid Theme Color</option>
                    <option value="transparent">Transparent (Page Background Shows Through)</option>
                  </select>
                </div>

                {/* Background Color */}
                {config.environment.backgroundMode === "color" && (
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300">Canvas Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.environment.backgroundColor}
                        onChange={(e) => handleEnvironmentChange("backgroundColor", e.target.value)}
                        className="h-7 w-9 bg-transparent cursor-pointer rounded border border-slate-700"
                        data-testid="bg-color-picker"
                      />
                      <span className="text-xs font-mono text-slate-400">
                        {config.environment.backgroundColor}
                      </span>
                    </div>
                  </div>
                )}

                {/* Fog Toggle */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 block">Atmospheric Depth Fog</span>
                      <span className="text-[10px] text-slate-500">Gradually blends objects into background</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.environment.fog.enabled}
                      onChange={handleFogToggle}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      data-testid="fog-toggle-checkbox"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Panel 7: Performance */}
          {activeTab === "performance" && (
            <Card className="border-slate-800 bg-slate-950/90 shadow-xl">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Telemetry & Quality Budgets</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time GPU frame rates, geometry counts, and device safeguards.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Framerate</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                      {metrics.fps} FPS
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Meshes</span>
                    <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                      {metrics.meshCount}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Vertices</span>
                    <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
                      {metrics.vertexCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Max DPR Limit</span>
                    <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                      {config.renderQuality.dprLimit}x
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 pt-2 leading-relaxed">
                  The engine automatically clamps device pixel ratios to 2.0x and uses PCF soft shadows to guarantee
                  smooth 60fps rendering across production client browsers.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Object Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Object to Scene"
        description="Choose between an uploaded GLTF/GLB model from your project library or a procedural 3D archetype."
        maxWidth="md"
      >
        <div className="space-y-4">
          {/* Source Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setNewObjectType("procedural")}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                newObjectType === "procedural"
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Procedural Archetype
            </button>
            <button
              onClick={() => setNewObjectType("asset")}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                newObjectType === "asset"
                  ? "bg-cyan-600 text-white border-cyan-500"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              Uploaded GLB Model ({availableModels.length})
            </button>
          </div>

          {/* Archetype Selector */}
          {newObjectType === "procedural" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Choose Archetype</label>
              <select
                value={selectedProceduralType}
                onChange={(e) => setSelectedProceduralType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                data-testid="procedural-type-select"
              >
                <option value="product_model">Product Model (Cylinder & Cap)</option>
                <option value="hero_floating_object">Hero Floating Object (Torus Knot)</option>
                <option value="spatial_environment">Spatial Environment (Pedestals)</option>
                <option value="interactive_particles">Particle Cloud (1500 Points)</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select GLB Asset</label>
              {availableModels.length === 0 ? (
                <div className="p-3 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-400">
                  No 3D models uploaded yet. Visit{" "}
                  <Link href={`/projects/${project.id}/media`} className="text-cyan-400 underline">
                    Media Studio
                  </Link>{" "}
                  to upload .glb files.
                </div>
              ) : (
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  data-testid="asset-select"
                >
                  {availableModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.fileName})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Optional Custom Label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Object Label (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Front Right Wheel"
              value={newObjectName}
              onChange={(e) => setNewObjectName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              data-testid="new-obj-name-input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddObjectConfirm}
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              data-testid="confirm-add-obj-btn"
            >
              Add to Scene
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
