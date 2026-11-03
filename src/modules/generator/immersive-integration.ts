import { ProjectDesignState } from "../design/types";

export class ImmersiveIntegration {
  /**
   * Generates standalone immersive-3d.js ES module using local Three.js bundle.
   */
  public static generateImmersiveScript(design: ProjectDesignState, modelRelativePath?: string): string {
    const primaryColor = design.colors.primary || "#0284c7";
    const accentColor = design.colors.accent || "#38bdf8";

    return `/**
 * Agency Website Engine - Production Immersive 3D Runtime
 * Powered by local Three.js (Zero CDN Dependencies)
 */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  "use strict";

  function init3DExperience() {
    const containers = document.querySelectorAll("[data-interactive-3d], #scene-3d-canvas-host");
    if (containers.length === 0) return;

    containers.forEach(function (container) {
      // 1. Probe WebGL support
      const testCanvas = document.createElement("canvas");
      const gl = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
      if (!gl) {
        console.warn("[3D Runtime] WebGL not supported. Rendering fallback.");
        container.innerHTML = '<div style="display:flex;height:100%;align-items:center;justify-content:center;color:#94a3b8;font-size:0.95rem;text-align:center;padding:2rem;">3D Spatial Experience (Hardware Acceleration Required)</div>';
        return;
      }

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 450;

      // 2. Setup Scene, Camera & Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 5);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      // Mount canvas
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";

      // 3. Studio Lighting Rig
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(5, 8, 6);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.9);
      fillLight.position.set(-6, -2, -3);
      scene.add(fillLight);

      const rimLight = new THREE.PointLight("${accentColor}", 2.2, 20);
      rimLight.position.set(0, 4, -5);
      scene.add(rimLight);

      // 4. Object Group
      const objectGroup = new THREE.Group();
      scene.add(objectGroup);

      // Create high-fidelity procedural geometry
      const geometry = new THREE.TorusKnotGeometry(1.2, 0.38, 128, 32);
      const material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("${primaryColor}"),
        metalness: 0.25,
        roughness: 0.2,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
        reflectivity: 0.9,
      });

      const mesh = new THREE.Mesh(geometry, material);
      objectGroup.add(mesh);

      // Try loading custom GLTF model if path is provided
      const modelUrl = container.getAttribute("data-model-url") || ${JSON.stringify(modelRelativePath || "")};
      if (modelUrl) {
        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          function (gltf) {
            objectGroup.remove(mesh);
            const model = gltf.scene;
            // Center & normalize model
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
              const scale = 2.4 / maxDim;
              model.scale.set(scale, scale, scale);
            }
            objectGroup.add(model);
          },
          undefined,
          function (err) {
            console.warn("[3D Runtime] Could not load GLB model. Falling back to procedural geometry.", err);
          }
        );
      }

      // 5. Interactive Orbit & Drag Controls
      let isDragging = false;
      let prevMouseX = 0;
      let prevMouseY = 0;
      let targetRotX = 0;
      let targetRotY = 0;

      renderer.domElement.addEventListener("mousedown", function (e) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      });

      window.addEventListener("mouseup", function () {
        isDragging = false;
      });

      window.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
      });

      // Touch events
      renderer.domElement.addEventListener("touchstart", function (e) {
        if (e.touches.length === 1) {
          isDragging = true;
          prevMouseX = e.touches[0].clientX;
          prevMouseY = e.touches[0].clientY;
        }
      }, { passive: true });

      window.addEventListener("touchend", function () {
        isDragging = false;
      });

      window.addEventListener("touchmove", function (e) {
        if (!isDragging || e.touches.length !== 1) return;
        const deltaX = e.touches[0].clientX - prevMouseX;
        const deltaY = e.touches[0].clientY - prevMouseY;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;

        targetRotY += deltaX * 0.008;
        targetRotX += deltaY * 0.008;
      }, { passive: true });

      // Scroll-linked rotation
      window.addEventListener("scroll", function () {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        targetRotY = scrollY * 0.002;
      }, { passive: true });

      // 6. Animation Loop
      let animationFrameId = null;
      function animate() {
        animationFrameId = requestAnimationFrame(animate);

        // Subtle idle rotation
        if (!isDragging) {
          targetRotY += 0.003;
        }

        // Damping / interpolation
        objectGroup.rotation.y += (targetRotY - objectGroup.rotation.y) * 0.05;
        objectGroup.rotation.x += (targetRotX - objectGroup.rotation.x) * 0.05;

        renderer.render(scene, camera);
      }

      animate();

      // 7. Responsive Resize Observer
      const resizeObserver = new ResizeObserver(function (entries) {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          if (newWidth > 0 && newHeight > 0) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
          }
        }
      });
      resizeObserver.observe(container);

      // 8. WebGL Context Loss Guards
      renderer.domElement.addEventListener("webglcontextlost", function (e) {
        e.preventDefault();
        cancelAnimationFrame(animationFrameId);
        console.warn("[3D Runtime] WebGL Context Lost");
      }, false);

      renderer.domElement.addEventListener("webglcontextrestored", function () {
        console.log("[3D Runtime] WebGL Context Restored");
        animate();
      }, false);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init3DExperience);
  } else {
    init3DExperience();
  }
})();
`;
  }
}
