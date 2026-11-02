/**
 * Production Asset Resolver ensuring safe, portable, path-traversal-free asset resolution
 * for both internal Next.js environment and standalone exported client websites.
 */
export class ProductionAssetResolver {
  private baseDir: string;
  private assetMap: Map<string, string>;

  constructor(assetMap: Record<string, string> = {}, baseDir = "") {
    this.baseDir = baseDir.replace(/\\/g, "/").replace(/\/$/, "");
    this.assetMap = new Map(Object.entries(assetMap));
  }

  /**
   * Sanitizes a file path to eliminate directory traversal attempts.
   */
  static sanitizePath(path: string): string {
    if (!path) return "";
    // Normalize slashes
    let sanitized = path.replace(/\\/g, "/");
    // Strip leading drive letters (e.g. C:)
    sanitized = sanitized.replace(/^[a-zA-Z]:/, "");
    // Remove directory traversal sequences
    sanitized = sanitized.replace(/\.\.\//g, "").replace(/\.\.\\/g, "");
    return sanitized;
  }

  /**
   * Resolves an asset URL or slot key to a safe absolute or relative path.
   */
  resolveUrl(target: string): string {
    if (!target) return "";

    // 1. Check if target is a registered slot/ID in the asset map
    if (this.assetMap.has(target)) {
      const mapped = this.assetMap.get(target)!;
      return this.formatUrl(mapped);
    }

    // 2. Direct path resolution with safety sanitization
    return this.formatUrl(target);
  }

  private formatUrl(url: string): string {
    const sanitized = ProductionAssetResolver.sanitizePath(url);

    // If it's a data URI or external HTTPS, allow safely
    if (sanitized.startsWith("data:") || sanitized.startsWith("http://") || sanitized.startsWith("https://")) {
      return sanitized;
    }

    // If baseDir is configured and path is relative, prepend baseDir
    if (this.baseDir && !sanitized.startsWith("/") && !sanitized.startsWith("./")) {
      return `${this.baseDir}/${sanitized}`;
    }

    return sanitized;
  }

  /**
   * Transforms a scene configuration's model asset URLs to portable relative paths for export.
   */
  static portibilizeSceneConfig(
    sceneConfig: any,
    assetUrlRewriter: (url: string) => string
  ): any {
    const clone = JSON.parse(JSON.stringify(sceneConfig));
    if (Array.isArray(clone.objects)) {
      for (const obj of clone.objects) {
        if (obj.assetUrl) {
          obj.assetUrl = assetUrlRewriter(obj.assetUrl);
        }
      }
    }
    return clone;
  }
}

