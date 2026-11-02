"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  ThreeDRenderer,
  ThreeDScene,
  ThreeDCamera,
  ThreeDAnimationLoop,
  ThreeDLightingPresets,
  ThreeDModelLoader,
  ThreeDDisposal,
  ThreeDLightingPreset,
  ModelNormalizedStats,
} from "@/modules/three-d";
import {
  RotateCcw,
  Sun,
  Layers,
  Box,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Play,
  Pause,
} from "lucide-react";

export interface ModelViewer3DProps {
  modelUrl?: string;
  modelName?: string;
  initialLighting?: ThreeDLightingPreset;
  initialWireframe?: boolean;
  initialAutoRotate?: boolean;
  className?: string;
  height?: string;
  onLoaded?: (stats: ModelNormalizedStats) => void;
  onError?: (err: Error) => void;
}

export function ModelViewer3D({
  modelUrl,
  modelName,
  initialLighting = "studio",
  initialWireframe = false,
  initialAutoRotate = true,
  className = "",
  height = "420px",
  onLoaded,
  onError,
}: ModelViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wireframe, setWireframe] = useState(initialWireframe);
  const [autoRotate, setAutoRotate] = useState(initialAutoRotate);
  const [lighting, setLighting] = useState<ThreeDLightingPreset>(initialLighting);
  const [stats, setStats] = useState<ModelNormalizedStats | null>(null);

  // References to live Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const loopRef = useRef<ThreeDAnimationLoop | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const lightsGroupRef = useRef<THREE.Group | null>(null);

  // Apply wireframe toggle to all meshes in current model
  const applyWireframe = useCallback((isWire: boolean) => {
    if (!modelGroupRef.current) return;
    modelGroupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            (mat as any).wireframe = isWire;
          });
        }
      }
    });
  }, []);

  // Update lighting rig
  const updateLighting = useCallback((preset: ThreeDLightingPreset) => {
    if (!sceneRef.current) return;
    if (lightsGroupRef.current) {
      sceneRef.current.remove(lightsGroupRef.current);
      ThreeDDisposal.disposeObject(lightsGroupRef.current);
    }
    const rig = ThreeDLightingPresets.createRig(preset);
    lightsGroupRef.current = rig.lightsGroup;
    sceneRef.current.add(rig.lightsGroup);
  }, []);

  // Reset Camera position
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 1.2, 3.5);
    cameraRef.current.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let isDisposed = false;
    setLoading(true);
    setErrorMessage(null);
    setLoadProgress(10);

    const width = container.clientWidth || 600;
    const heightPx = container.clientHeight || 420;

    // 1. Create Core Three.js Scene, Camera, Renderer
    const scene = ThreeDScene.create({ transparent: true });
    sceneRef.current = scene;

    const camera = ThreeDCamera.create(width, heightPx, {
      fov: 45,
      position: [0, 1.2, 3.5],
      target: [0, 0, 0],
    });
    cameraRef.current = camera;

    const renderer = ThreeDRenderer.create({
      canvas,
      antialias: true,
      alpha: true,
      enableShadows: true,
      maxDpr: 2.0,
    });
    rendererRef.current = renderer;
    ThreeDRenderer.resize(renderer, width, heightPx);

    // 2. Setup OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 10;
    controls.minDistance = 0.8;
    controls.enablePan = true;
    controlsRef.current = controls;

    // 3. Setup Initial Lighting Rig
    const rig = ThreeDLightingPresets.createRig(lighting);
    lightsGroupRef.current = rig.lightsGroup;
    scene.add(rig.lightsGroup);

    // 4. Model container group
    const modelGroup = new THREE.Group();
    modelGroup.name = "model_container";
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // 5. Start Animation Loop
    const loop = new ThreeDAnimationLoop();
    loopRef.current = loop;

    loop.subscribe((delta) => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (modelGroupRef.current && autoRotate) {
        modelGroupRef.current.rotation.y += delta * 0.5;
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    });

    loop.start();

    // 6. Load Model (or fallback to procedural product archetype if no URL)
    const loadPromise = modelUrl
      ? ThreeDModelLoader.load(modelUrl, {
          normalize: true,
          targetSize: 2.0,
          onProgress: (p) => {
            if (!isDisposed) setLoadProgress(p);
          },
        })
      : Promise.resolve().then(async () => {
          // Fallback: procedural demo archetype
          const { Procedural3DArchetypes } = await import("@/modules/three-d/assets/procedural");
          const proceduralObj = Procedural3DArchetypes.create("product_model", {
            color: "#6366f1",
            wireframe,
          });
          const { ThreeDModelNormalizer } = await import("@/modules/three-d/assets/normalizer");
          const normStats = ThreeDModelNormalizer.normalize(proceduralObj, 2.0);
          return {
            scene: proceduralObj as THREE.Group,
            animations: [],
            stats: normStats,
            dispose: () => ThreeDDisposal.disposeObject(proceduralObj),
          };
        });

    loadPromise
      .then((loaded) => {
        if (isDisposed) {
          loaded.dispose();
          return;
        }

        // Detach old children if any
        while (modelGroup.children.length > 0) {
          modelGroup.remove(modelGroup.children[0]);
        }

        modelGroup.add(loaded.scene);
        applyWireframe(wireframe);
        setStats(loaded.stats);
        setLoading(false);
        setLoadProgress(100);

        if (onLoaded) {
          onLoaded(loaded.stats);
        }
      })
      .catch((err) => {
        if (isDisposed) return;
        console.error("ModelViewer3D load failure:", err);
        setLoading(false);
        setErrorMessage(err.message || "Failed to load 3D model.");
        if (onError) onError(err);
      });

    // 7. ResizeObserver to handle container layout changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0 && rendererRef.current && cameraRef.current) {
          ThreeDRenderer.resize(rendererRef.current, newWidth, newHeight);
          ThreeDCamera.updateAspect(cameraRef.current, newWidth, newHeight);
        }
      }
    });

    resizeObserver.observe(container);

    // 8. Component Cleanup on Unmount
    return () => {
      isDisposed = true;
      resizeObserver.disconnect();

      if (loopRef.current) {
        loopRef.current.stop();
        loopRef.current = null;
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (modelGroupRef.current) {
        ThreeDDisposal.disposeObject(modelGroupRef.current);
        modelGroupRef.current = null;
      }

      if (lightsGroupRef.current) {
        ThreeDDisposal.disposeObject(lightsGroupRef.current);
        lightsGroupRef.current = null;
      }

      if (sceneRef.current) {
        ThreeDDisposal.disposeObject(sceneRef.current);
        sceneRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    };
  }, [modelUrl, onLoaded, onError]);

  // Sync state changes with Three.js scene without full re-mount
  useEffect(() => {
    applyWireframe(wireframe);
  }, [wireframe, applyWireframe]);

  useEffect(() => {
    updateLighting(lighting);
  }, [lighting, updateLighting]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-slate-800 select-none ${className}`}
      style={{ height }}
      data-testid="three-d-model-viewer"
    >
      {/* Three.js WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
        data-testid="three-d-canvas"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="relative mb-4">
            <RefreshCw className="h-10 w-10 text-indigo-400 animate-spin" />
            <Box className="h-5 w-5 text-indigo-200 absolute inset-0 m-auto" />
          </div>
          <span className="text-sm font-mono text-slate-200 font-bold">
            Loading 3D Model... {loadProgress}%
          </span>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
          <h4 className="text-sm font-bold text-white mb-1">Model Loading Error</h4>
          <p className="text-xs text-rose-300/90 max-w-sm mb-4 font-mono">{errorMessage}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
              setLoading(true);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white rounded-lg border border-slate-700 transition"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Top Header / Stats HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800/80 pointer-events-auto flex items-center gap-2 text-xs font-mono text-slate-300">
          <Box className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-semibold text-white truncate max-w-[180px]">
            {modelName || (modelUrl ? modelUrl.split("/").pop() : "Procedural Mesh")}
          </span>
          {stats && (
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-2">
              {stats.meshCount} mesh · {stats.vertexCount.toLocaleString()} verts
            </span>
          )}
        </div>

        {/* Orbit hint */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-800/60">
          <span>Drag to Orbit</span>
          <span>·</span>
          <span>Scroll to Zoom</span>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "Pause Auto-Rotation" : "Enable Auto-Rotation"}
            className={`p-2 rounded-lg text-xs font-mono transition ${
              autoRotate
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="toggle-auto-rotate"
          >
            {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Wireframe View"
            className={`p-2 rounded-lg text-xs font-mono transition ${
              wireframe
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            data-testid="toggle-wireframe"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={resetCamera}
            title="Reset Camera View"
            className="p-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 transition"
            data-testid="reset-camera"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right Lighting Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-800">
          <Sun className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <select
            value={lighting}
            onChange={(e) => setLighting(e.target.value as ThreeDLightingPreset)}
            className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
            data-testid="select-lighting"
          >
            <option value="studio" className="bg-slate-900 text-white">Studio Light</option>
            <option value="sunset" className="bg-slate-900 text-white">Sunset Amber</option>
            <option value="dramatic_neon" className="bg-slate-900 text-white">Dramatic Neon</option>
            <option value="clinical_bright" className="bg-slate-900 text-white">Clinical White</option>
            <option value="luxury_warm" className="bg-slate-900 text-white">Luxury Warm</option>
          </select>
        </div>
      </div>
    </div>
  );
}

