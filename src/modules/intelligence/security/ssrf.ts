import dns from "dns/promises";
import net from "net";

export class SSRFSecurityError extends Error {
  public readonly code = "SSRF_BLOCKED";
  constructor(message: string) {
    super(message);
    this.name = "SSRFSecurityError";
  }
}

export class InvalidUrlError extends Error {
  public readonly code = "INVALID_URL";
  constructor(message: string) {
    super(message);
    this.name = "InvalidUrlError";
  }
}

export interface ValidatedTargetUrl {
  canonicalUrl: string;
  originalUrl: string;
  protocol: "http:" | "https:";
  hostname: string;
  port: string;
  resolvedIps: string[];
}

export interface UrlValidationOptions {
  allowLocalhostForTesting?: boolean;
}

/**
 * Parses IPv4 string into 32-bit unsigned integer.
 */
function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    throw new Error(`Invalid IPv4 address format: ${ip}`);
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Checks whether an IPv4 address falls within a CIDR range.
 */
function isIpv4InCidr(ipInt: number, cidrBase: string, maskBits: number): boolean {
  const baseInt = ipv4ToInt(cidrBase);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_IPV4_CIDRS: Array<[string, number]> = [
  ["0.0.0.0", 8],       // Current network (RFC 1122)
  ["10.0.0.0", 8],      // Private network (RFC 1918)
  ["100.64.0.0", 10],   // Shared address space / CGNAT (RFC 6598)
  ["127.0.0.0", 8],     // Loopback (RFC 1122)
  ["169.254.0.0", 16],  // Link-local / Cloud metadata service (RFC 3927)
  ["172.16.0.0", 12],   // Private network (RFC 1918)
  ["192.0.0.0", 24],    // IETF protocol assignments (RFC 6890)
  ["192.0.2.0", 24],    // Documentation TEST-NET-1 (RFC 5737)
  ["192.88.99.0", 24],  // 6to4 relay anycast (RFC 7526)
  ["192.168.0.0", 16],  // Private network (RFC 1918)
  ["198.18.0.0", 15],   // Benchmarking (RFC 2544)
  ["198.51.100.0", 24], // Documentation TEST-NET-2 (RFC 5737)
  ["203.0.113.0", 24],  // Documentation TEST-NET-3 (RFC 5737)
  ["224.0.0.0", 4],     // Multicast (RFC 5771)
  ["240.0.0.0", 4],     // Reserved for future use (RFC 1112)
  ["255.255.255.255", 32] // Broadcast
];

/**
 * Checks whether an IPv6 address falls into private, loopback, link-local, or documentation ranges.
 */
function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // IPv4-mapped IPv6 address (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (normalized.startsWith("::ffff:") || normalized.includes("::ffff:")) {
    const lastColon = normalized.lastIndexOf(":");
    const lastPart = normalized.slice(lastColon + 1);
    if (net.isIPv4(lastPart)) {
      return isPrivateOrReservedIpv4(lastPart);
    }
  }

  // Loopback (::1)
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  // Unspecified (::)
  if (normalized === "::" || normalized === "0:0:0:0:0:0:0:0") return true;

  // Unique Local Address (ULA) fc00::/7 (fc00:: through fdff::)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-Local Unicast fe80::/10 (fe80:: through febf::)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast ff00::/8
  if (normalized.startsWith("ff")) return true;

  // Discard prefix 100::/64
  if (normalized.startsWith("100:")) return true;

  return false;
}

/**
 * Evaluates whether an IPv4 address is in a private, loopback, or reserved range.
 */
export function isPrivateOrReservedIpv4(ip: string): boolean {
  try {
    const ipInt = ipv4ToInt(ip);
    for (const [cidrBase, maskBits] of BLOCKED_IPV4_CIDRS) {
      if (isIpv4InCidr(ipInt, cidrBase, maskBits)) {
        return true;
      }
    }
    return false;
  } catch {
    return true; // Treat unparseable IPs as blocked
  }
}

/**
 * Validates a reference target URL against protocol tampering, IP literal manipulation,
 * and performs genuine DNS resolution to verify destination IP addresses (SSRF Protection).
 */
export async function validateTargetUrl(
  rawUrl: string,
  options: UrlValidationOptions = {}
): Promise<ValidatedTargetUrl> {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new InvalidUrlError("Target URL must be a non-empty string");
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new InvalidUrlError(`Invalid URL format: "${trimmed}"`);
  }

  // Enforce protocol restriction: HTTP/HTTPS only
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SSRFSecurityError(
      `Forbidden protocol "${parsed.protocol}". Only "http:" and "https:" are allowed.`
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost aliases
  const isLocalAlias =
    hostname === "localhost" ||
    hostname === "localhost.localdomain" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".lan");

  if (isLocalAlias && !options.allowLocalhostForTesting) {
    throw new SSRFSecurityError(
      `Security violation: Target hostname "${hostname}" resolves to a restricted internal domain.`
    );
  }

  // Check if hostname is an IP literal
  const ipFamily = net.isIP(hostname);
  if (ipFamily === 4) {
    if (isPrivateOrReservedIpv4(hostname) && !options.allowLocalhostForTesting) {
      throw new SSRFSecurityError(
        `Security violation: Direct private/reserved IPv4 destination "${hostname}" is blocked.`
      );
    }
    return {
      canonicalUrl: parsed.origin + parsed.pathname + parsed.search,
      originalUrl: trimmed,
      protocol: parsed.protocol as "http:" | "https:",
      hostname,
      port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
      resolvedIps: [hostname],
    };
  }

  if (ipFamily === 6) {
    // Strip brackets from IPv6 hostnames
    const cleanIpv6 = hostname.replace(/^\[|\]$/g, "");
    if (isPrivateOrReservedIpv6(cleanIpv6) && !options.allowLocalhostForTesting) {
      throw new SSRFSecurityError(
        `Security violation: Direct private/reserved IPv6 destination "${hostname}" is blocked.`
      );
    }
    return {
      canonicalUrl: parsed.origin + parsed.pathname + parsed.search,
      originalUrl: trimmed,
      protocol: parsed.protocol as "http:" | "https:",
      hostname,
      port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
      resolvedIps: [cleanIpv6],
    };
  }

  // Perform genuine DNS resolution to detect rebinding and internal IP mapping
  let addresses: { address: string; family: number }[] = [];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch (err: any) {
    throw new InvalidUrlError(`DNS resolution failed for hostname "${hostname}": ${err.message}`);
  }

  if (!addresses || addresses.length === 0) {
    throw new InvalidUrlError(`No IP address records found for hostname "${hostname}"`);
  }

  const resolvedIps = addresses.map((a) => a.address);

  // Validate every resolved IP
  if (!options.allowLocalhostForTesting) {
    for (const record of addresses) {
      if (record.family === 4) {
        if (isPrivateOrReservedIpv4(record.address)) {
          throw new SSRFSecurityError(
            `Security violation: Hostname "${hostname}" resolves to restricted private/reserved IPv4 address: ${record.address}`
          );
        }
      } else if (record.family === 6) {
        if (isPrivateOrReservedIpv6(record.address)) {
          throw new SSRFSecurityError(
            `Security violation: Hostname "${hostname}" resolves to restricted private/reserved IPv6 address: ${record.address}`
          );
        }
      }
    }
  }

  return {
    canonicalUrl: parsed.origin + parsed.pathname + parsed.search,
    originalUrl: trimmed,
    protocol: parsed.protocol as "http:" | "https:",
    hostname,
    port: parsed.port || (parsed.protocol === "https:" ? "443" : "80"),
    resolvedIps,
  };
}
