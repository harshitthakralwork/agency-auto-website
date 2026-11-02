import { FrameCache } from "./cache";
import { FrameManifest } from "../types";

export interface CanvasRendererOptions {
  fitMode?: "cover" | "contain";
  maxDpr?: number;
  cacheCapacity?: number;
}

export class CanvasFrameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private manifest: FrameManifest;
  private cache: FrameCache;
  private fitMode: "cover" | "contain";
  private maxDpr: number;
  private currentDrawnIndex: number = -1;
  private lastRequestedIndex: number = -1;
  private posterImage: HTMLImageElement | null = null;
  private isDestroyed: boolean = false;
  private animationFrameId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    manifest: FrameManifest,
    options: CanvasRendererOptions = {}
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.manifest = manifest;
    this.fitMode = options.fitMode || manifest.fitMode || "cover";
    this.maxDpr = options.maxDpr || 2;
    this.cache = new FrameCache(options.cacheCapacity || 40);

    this.init();
  }

  getCurrentDrawnIndex(): number {
    return this.currentDrawnIndex;
  }

  private init() {
    this.resize();

    // Preload poster if present
    if (this.manifest.posterUrl) {
      this.posterImage = new Image();
      this.posterImage.crossOrigin = "anonymous";
      this.posterImage.src = this.manifest.posterUrl;
      this.posterImage.onload = () => {
        if (this.currentDrawnIndex === -1 && !this.isDestroyed) {
          this.drawPoster();
        }
      };
    }

    // Preload first 5 priority frames immediately
    const total = this.manifest.frames.length;
    const preloadCount = Math.min(5, total);
    for (let i = 0; i < preloadCount; i++) {
      this.cache.loadFrame(i, this.manifest.frames[i].url).then((img) => {
        if (i === 0 && this.currentDrawnIndex <= 0 && !this.isDestroyed) {
          this.drawImage(img);
          this.currentDrawnIndex = 0;
        }
      }).catch(() => {});
    }
  }

  resize() {
    if (!this.canvas || this.isDestroyed) return;

    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width * dpr), 100);
    const height = Math.max(Math.floor(rect.height * dpr), 100);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      if (this.currentDrawnIndex >= 0) {
        const img = this.cache.get(this.currentDrawnIndex);
        if (img) {
          this.drawImage(img);
        } else if (this.posterImage) {
          this.drawPoster();
        }
      } else if (this.posterImage) {
        this.drawPoster();
      }
    }
  }

  renderProgress(progress: number) {
    if (this.isDestroyed || !this.manifest.frames.length) return;

    const clamped = Math.max(0, Math.min(1, progress));
    const targetIndex = Math.min(
      Math.floor(clamped * this.manifest.frames.length),
      this.manifest.frames.length - 1
    );

    this.renderIndex(targetIndex);
  }

  renderIndex(targetIndex: number) {
    if (this.isDestroyed) return;

    const total = this.manifest.frames.length;
    if (targetIndex < 0 || targetIndex >= total) return;
    if (targetIndex === this.lastRequestedIndex && targetIndex === this.currentDrawnIndex) return;

    this.lastRequestedIndex = targetIndex;
    const targetUrl = this.manifest.frames[targetIndex].url;

    // Trigger preload window around target index
    const frameUrls = this.manifest.frames.map((f) => f.url);
    this.cache.preloadWindow(targetIndex, total, frameUrls, 8);

    if (this.cache.has(targetIndex)) {
      const img = this.cache.get(targetIndex)!;
      this.drawImage(img);
      this.currentDrawnIndex = targetIndex;
    } else {
      // Async load requested frame
      this.cache.loadFrame(targetIndex, targetUrl).then((img) => {
        if (!this.isDestroyed && this.lastRequestedIndex === targetIndex) {
          this.drawImage(img);
          this.currentDrawnIndex = targetIndex;
        }
      }).catch(() => {
        // Fallback: stay on current frame or poster
      });
    }
  }

  private drawImage(img: HTMLImageElement) {
    if (!this.ctx || !this.canvas) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth || this.manifest.width || 1920;
    const ih = img.naturalHeight || this.manifest.height || 1080;

    let dw = cw;
    let dh = ch;
    let dx = 0;
    let dy = 0;

    if (this.fitMode === "cover") {
      const scale = Math.max(cw / iw, ch / ih);
      dw = iw * scale;
      dh = ih * scale;
      dx = (cw - dw) / 2;
      dy = (ch - dh) / 2;
    } else {
      const scale = Math.min(cw / iw, ch / ih);
      dw = iw * scale;
      dh = ih * scale;
      dx = (cw - dw) / 2;
      dy = (ch - dh) / 2;
    }

    this.ctx.clearRect(0, 0, cw, ch);
    this.ctx.drawImage(img, dx, dy, dw, dh);
  }

  private drawPoster() {
    if (this.posterImage && this.posterImage.complete) {
      this.drawImage(this.posterImage);
    }
  }

  destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.cache.clear();
    this.posterImage = null;
    this.ctx = null;
  }
}

