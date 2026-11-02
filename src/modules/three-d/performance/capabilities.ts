import { ThreeDCapabilities } from "../types";

export class ThreeDCapabilityDetector {
  private static cachedResult: ThreeDCapabilities | null = null;

  /**
   * Probes the runtime environment for WebGL 1/2 capabilities and GPU limits.
   */
  static detect(): ThreeDCapabilities {
    if (this.cachedResult) return this.cachedResult;

    if (typeof window === "undefined" || typeof document === "undefined") {
      // Server-side default
      return {
        webgl1: false,
        webgl2: false,
        supported: false,
        maxTextureSize: 2048,
        maxViewportDims: [2048, 2048],
        isLowEndDevice: false,
      };
    }

    const canvas = document.createElement("canvas");
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    let webgl2 = false;
    let webgl1 = false;

    try {
      gl = canvas.getContext("webgl2");
      if (gl) {
        webgl2 = true;
        webgl1 = true;
      } else {
        gl = (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
        if (gl) {
          webgl1 = true;
        }
      }
    } catch {
      webgl1 = false;
      webgl2 = false;
    }

    if (!gl) {
      this.cachedResult = {
        webgl1: false,
        webgl2: false,
        supported: false,
        maxTextureSize: 0,
        maxViewportDims: [0, 0],
        isLowEndDevice: true,
      };
      return this.cachedResult;
    }

    let rendererVendor = "Unknown";
    let rendererModel = "Unknown";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      rendererVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "Unknown";
      rendererModel = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "Unknown";
    }

    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [2048, 2048];

    // Heuristics for low-end devices
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const lowCores =
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= 4;
    const isLowEndDevice = isMobile || lowCores || maxTextureSize <= 4096;

    // Clean up temporary canvas
    const loseContext = gl.getExtension("WEBGL_lose_context");
    if (loseContext) loseContext.loseContext();

    this.cachedResult = {
      webgl1,
      webgl2,
      supported: webgl1 || webgl2,
      rendererVendor,
      rendererModel,
      maxTextureSize,
      maxViewportDims: [maxViewportDims[0], maxViewportDims[1]],
      isLowEndDevice,
    };

    return this.cachedResult;
  }

  /**
   * Resets cached capabilities (useful for unit tests).
   */
  static resetCache(): void {
    this.cachedResult = null;
  }
}
