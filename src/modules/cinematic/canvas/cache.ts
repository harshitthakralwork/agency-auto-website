export class FrameCache {
  private cache: Map<number, HTMLImageElement> = new Map();
  private maxCapacity: number;
  private activeLoads: Map<number, Promise<HTMLImageElement>> = new Map();

  constructor(maxCapacity: number = 40) {
    this.maxCapacity = maxCapacity;
  }

  has(index: number): boolean {
    return this.cache.has(index);
  }

  get(index: number): HTMLImageElement | undefined {
    const img = this.cache.get(index);
    if (img) {
      // LRU refresh: delete and re-insert
      this.cache.delete(index);
      this.cache.set(index, img);
    }
    return img;
  }

  async loadFrame(index: number, url: string): Promise<HTMLImageElement> {
    const existing = this.get(index);
    if (existing) return existing;

    if (this.activeLoads.has(index)) {
      return this.activeLoads.get(index)!;
    }

    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.set(index, img);
        this.activeLoads.delete(index);
        resolve(img);
      };
      img.onerror = (e) => {
        this.activeLoads.delete(index);
        reject(new Error(`Failed to load frame ${index} from ${url}`));
      };
      img.src = url;
    });

    this.activeLoads.set(index, loadPromise);
    return loadPromise;
  }

  set(index: number, img: HTMLImageElement) {
    if (this.cache.size >= this.maxCapacity) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        const evicted = this.cache.get(oldestKey);
        if (evicted) {
          evicted.src = ""; // Clear source to free memory
        }
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(index, img);
  }

  preloadWindow(currentIndex: number, totalFrames: number, frameUrls: string[], windowSize: number = 8) {
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(totalFrames - 1, currentIndex + windowSize);

    for (let i = start; i <= end; i++) {
      if (!this.has(i) && !this.activeLoads.has(i) && frameUrls[i]) {
        this.loadFrame(i, frameUrls[i]).catch(() => {
          // Non-blocking background preload error
        });
      }
    }
  }

  clear() {
    for (const img of this.cache.values()) {
      img.src = "";
    }
    this.cache.clear();
    this.activeLoads.clear();
  }
}
