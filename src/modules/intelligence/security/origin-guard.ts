import { NextRequest, NextResponse } from "next/server";

export class UntrustedOriginError extends Error {
  public readonly code = "UNTRUSTED_ORIGIN";
  public readonly status = 403;

  constructor(message: string) {
    super(message);
    this.name = "UntrustedOriginError";
  }
}

/**
 * Validates request Origin and Host headers for state-changing intelligence mutation endpoints.
 *
 * INTENDED DEPLOYMENT BOUNDARY & SECURITY POSTURE:
 * The Agency Website Engine is an internal, single-operator desktop development platform.
 * This guard prevents drive-by CSRF / cross-origin attacks where an external malicious website
 * loaded in the developer's browser attempts to trigger research jobs or delete evidence via
 * cross-origin fetch requests to localhost.
 *
 * It DOES NOT provide user authentication or multi-tenant authorization.
 */
export function validateMutationOrigin(req: NextRequest): void {
  const method = req.method.toUpperCase();
  // Safe read-only methods do not execute mutations
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }

  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  const secFetchSite = req.headers.get("sec-fetch-site");
  const hostHeader = req.headers.get("host") || "";

  // 1. Defeat cross-site fetch attempts flagged by browser Sec-Fetch-Site
  if (secFetchSite === "cross-site") {
    throw new UntrustedOriginError(
      "Access denied: Cross-site mutation request blocked by browser security policy."
    );
  }

  // 2. Evaluate Origin header if present (standard for browser POST/DELETE requests)
  if (originHeader) {
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(originHeader);
    } catch {
      throw new UntrustedOriginError(`Access denied: Malformed Origin header "${originHeader}".`);
    }

    const originHost = parsedOrigin.hostname.toLowerCase();
    const isLoopbackOrigin =
      originHost === "localhost" ||
      originHost === "127.0.0.1" ||
      originHost === "::1" ||
      originHost === "[::1]";

    if (!isLoopbackOrigin) {
      throw new UntrustedOriginError(
        `Access denied: Untrusted cross-origin request from "${originHeader}". Only local origins are authorized.`
      );
    }
    return;
  }

  // 3. Evaluate Referer header if Origin is omitted
  if (refererHeader) {
    let parsedReferer: URL;
    try {
      parsedReferer = new URL(refererHeader);
    } catch {
      throw new UntrustedOriginError(`Access denied: Malformed Referer header "${refererHeader}".`);
    }

    const refererHost = parsedReferer.hostname.toLowerCase();
    const isLoopbackReferer =
      refererHost === "localhost" ||
      refererHost === "127.0.0.1" ||
      refererHost === "::1" ||
      refererHost === "[::1]";

    if (!isLoopbackReferer) {
      throw new UntrustedOriginError(
        `Access denied: Untrusted cross-origin referer "${refererHeader}".`
      );
    }
    return;
  }

  // 4. If neither Origin nor Referer is present (e.g. server-side programmatic test or CLI call),
  // verify that the Host header points to local development ports
  const cleanHost = hostHeader.split(":")[0].toLowerCase();
  const isLoopbackHost =
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "::1" ||
    cleanHost === "[::1]";

  if (!isLoopbackHost) {
    throw new UntrustedOriginError(
      `Access denied: Mutation request to non-local host "${hostHeader}".`
    );
  }
}
