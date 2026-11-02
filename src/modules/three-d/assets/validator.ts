export interface ModelValidationResult {
  valid: boolean;
  error?: string;
  format?: "glb" | "gltf";
  version?: number | string;
  byteLength?: number;
  meshCount?: number;
  materialCount?: number;
  animationCount?: number;
  textureCount?: number;
  dracoCompressed?: boolean;
  extensionsUsed?: string[];
}

export class ModelAssetValidator {
  private static readonly GLB_MAGIC = 0x46546c67; // "glTF" in little-endian ASCII
  private static readonly JSON_CHUNK_TYPE = 0x4e4f534a; // "JSON" in little-endian ASCII

  /**
   * Validates a 3D model buffer against strict binary and JSON specifications.
   */
  static validate(buffer: Buffer, extension: string): ModelValidationResult {
    const ext = extension.toLowerCase().replace(/^\./, "");

    if (ext === "glb") {
      return this.validateGlb(buffer);
    } else if (ext === "gltf") {
      return this.validateGltf(buffer);
    } else {
      return {
        valid: false,
        error: `Unsupported 3D model extension ".${ext}". Only .glb and .gltf are supported.`,
      };
    }
  }

  /**
   * Validates binary glTF (.glb) container structure, header, chunk headers, and JSON chunk.
   */
  private static validateGlb(buffer: Buffer): ModelValidationResult {
    if (buffer.length < 12) {
      return {
        valid: false,
        error: "Malformed GLB file: Buffer is smaller than the minimum 12-byte header.",
      };
    }

    // 1. Validate 12-byte binary header
    const magic = buffer.readUInt32LE(0);
    if (magic !== this.GLB_MAGIC) {
      return {
        valid: false,
        error: `Invalid GLB magic header: Expected 0x46546C67 ("glTF"), received 0x${magic.toString(16).toUpperCase()}.`,
      };
    }

    const version = buffer.readUInt32LE(4);
    if (version !== 2) {
      return {
        valid: false,
        error: `Unsupported glTF container version: Expected version 2, received version ${version}.`,
      };
    }

    const declaredLength = buffer.readUInt32LE(8);
    if (buffer.length < declaredLength) {
      return {
        valid: false,
        error: `Truncated GLB container: Declared length is ${declaredLength} bytes, but actual file size is ${buffer.length} bytes.`,
      };
    }

    // 2. Validate first chunk (must be JSON)
    if (buffer.length < 20) {
      return {
        valid: false,
        error: "Malformed GLB container: Missing initial chunk header.",
      };
    }

    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.readUInt32LE(16);

    if (chunkType !== this.JSON_CHUNK_TYPE) {
      return {
        valid: false,
        error: `Invalid GLB chunk structure: First chunk must be JSON (0x4E4F534A), received 0x${chunkType.toString(16).toUpperCase()}.`,
      };
    }

    if (20 + chunkLength > buffer.length) {
      return {
        valid: false,
        error: "Malformed GLB container: JSON chunk length exceeds buffer bounds.",
      };
    }

    // 3. Parse JSON chunk for scene graph validation and metadata extraction
    const jsonText = buffer.toString("utf-8", 20, 20 + chunkLength);
    let gltfJson: any;
    try {
      gltfJson = JSON.parse(jsonText);
    } catch {
      return {
        valid: false,
        error: "Malformed GLB container: Failed to parse embedded JSON chunk.",
      };
    }

    // Security check on any embedded buffer/image URIs
    const uriSecurityCheck = this.checkUrisSecurity(gltfJson);
    if (!uriSecurityCheck.valid) {
      return uriSecurityCheck;
    }

    const extensionsUsed: string[] = Array.isArray(gltfJson.extensionsUsed)
      ? gltfJson.extensionsUsed
      : [];
    const dracoCompressed = extensionsUsed.includes("KHR_draco_mesh_compression");

    return {
      valid: true,
      format: "glb",
      version,
      byteLength: buffer.length,
      meshCount: Array.isArray(gltfJson.meshes) ? gltfJson.meshes.length : 0,
      materialCount: Array.isArray(gltfJson.materials) ? gltfJson.materials.length : 0,
      animationCount: Array.isArray(gltfJson.animations) ? gltfJson.animations.length : 0,
      textureCount: Array.isArray(gltfJson.textures) ? gltfJson.textures.length : 0,
      dracoCompressed,
      extensionsUsed,
    };
  }

  /**
   * Validates JSON glTF (.gltf) structure, required asset descriptor, and URI boundaries.
   */
  private static validateGltf(buffer: Buffer): ModelValidationResult {
    let json: any;
    try {
      const text = buffer.toString("utf-8");
      json = JSON.parse(text);
    } catch {
      return {
        valid: false,
        error: "Malformed glTF file: Content is not valid JSON.",
      };
    }

    if (!json || typeof json !== "object") {
      return {
        valid: false,
        error: "Malformed glTF file: Root must be a valid JSON object.",
      };
    }

    // glTF requires an 'asset' object with version property
    if (!json.asset || typeof json.asset !== "object" || typeof json.asset.version !== "string") {
      return {
        valid: false,
        error: "Invalid glTF file: Missing required 'asset.version' descriptor.",
      };
    }

    if (!json.asset.version.startsWith("2.")) {
      return {
        valid: false,
        error: `Unsupported glTF specification version: Expected glTF 2.0+, found "${json.asset.version}".`,
      };
    }

    // Security check: inspect all buffer and image URIs
    const uriCheck = this.checkUrisSecurity(json);
    if (!uriCheck.valid) {
      return uriCheck;
    }

    const extensionsUsed: string[] = Array.isArray(json.extensionsUsed)
      ? json.extensionsUsed
      : [];
    const dracoCompressed = extensionsUsed.includes("KHR_draco_mesh_compression");

    return {
      valid: true,
      format: "gltf",
      version: json.asset.version,
      byteLength: buffer.length,
      meshCount: Array.isArray(json.meshes) ? json.meshes.length : 0,
      materialCount: Array.isArray(json.materials) ? json.materials.length : 0,
      animationCount: Array.isArray(json.animations) ? json.animations.length : 0,
      textureCount: Array.isArray(json.textures) ? json.textures.length : 0,
      dracoCompressed,
      extensionsUsed,
    };
  }

  /**
   * Strict security validation: blocks external HTTP URLs, absolute paths, and path traversal in URIs.
   */
  private static checkUrisSecurity(json: any): { valid: boolean; error?: string } {
    const urisToCheck: string[] = [];

    if (Array.isArray(json.buffers)) {
      for (const buf of json.buffers) {
        if (typeof buf.uri === "string") urisToCheck.push(buf.uri);
      }
    }

    if (Array.isArray(json.images)) {
      for (const img of json.images) {
        if (typeof img.uri === "string") urisToCheck.push(img.uri);
      }
    }

    for (const uri of urisToCheck) {
      // Allow base64 data URIs
      if (uri.startsWith("data:")) {
        continue;
      }

      // Block external schemes (http, https, ftp, file, etc.)
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(uri)) {
        return {
          valid: false,
          error: `Security violation: External URI schemes are forbidden in model resources ("${uri.substring(0, 30)}...").`,
        };
      }

      // Block directory traversal attempts
      if (uri.includes("..") || uri.includes("\\") || uri.startsWith("/")) {
        return {
          valid: false,
          error: `Security violation: Path traversal or absolute paths in model resource URIs are rejected ("${uri}").`,
        };
      }
    }

    return { valid: true };
  }
}

