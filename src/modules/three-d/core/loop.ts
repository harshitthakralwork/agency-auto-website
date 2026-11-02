import { ThreeDLoopCallback } from "../types";

export class ThreeDAnimationLoop {
  private isRunning = false;
  private animationFrameId: number | null = null;
  private callbacks = new Set<ThreeDLoopCallback>();

  // High-precision delta tracking using performance.now()
  private lastTime = 0;
  private elapsedTime = 0;

  // Performance telemetry
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private currentFps = 60;

  /**
   * Registers a callback to be executed on every rendered frame.
   */
  subscribe(callback: ThreeDLoopCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Starts or resumes the requestAnimationFrame loop.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsUpdate = this.lastTime;
    this.frameCount = 0;
    this.tick();
  }

  /**
   * Pauses the loop and cancels pending animation frames.
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Returns current measured frames per second.
   */
  getFps(): number {
    return this.currentFps;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1); // Cap delta to 100ms to avoid spiral of death
    this.lastTime = now;
    this.elapsedTime += delta;

    // Track FPS
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    // Execute subscribers
    for (const cb of this.callbacks) {
      try {
        cb(delta, this.elapsedTime);
      } catch (err) {
        console.error("ThreeDAnimationLoop callback error:", err);
      }
    }

    this.animationFrameId = requestAnimationFrame(this.tick);
  };
}
