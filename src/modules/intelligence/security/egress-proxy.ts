import http from "http";
import net from "net";
import dns from "dns/promises";
import type stream from "stream";
import { isPrivateOrReservedIpv4, isPrivateOrReservedIpv6, SSRFSecurityError } from "./ssrf";

export class EgressSecurityError extends Error {
  public readonly code = "EGRESS_BLOCKED";
  constructor(message: string) {
    super(message);
    this.name = "EgressSecurityError";
  }
}

export class EgressProxyUnavailableError extends Error {
  public readonly code = "EGRESS_PROXY_UNAVAILABLE";
  constructor(message: string) {
    super(message);
    this.name = "EgressProxyUnavailableError";
  }
}

export interface EgressRequestLog {
  timestamp: string;
  type: "HTTP" | "CONNECT";
  method: string;
  target: string;
  clientIp?: string;
  blocked: boolean;
  statusCode: number;
  reason?: string;
  destinationIp?: string;
}

export interface EgressProxyOptions {
  allowLocalhostForTesting?: boolean;
  onRequestLog?: (log: EgressRequestLog) => void;
}

export interface ResolvedDestination {
  hostname: string;
  port: number;
  resolvedIp: string;
}

/**
 * Validates a hostname and resolves destination IP addresses against blocked SSRF ranges.
 * Connects directly to the validated IP to defeat DNS rebinding.
 */
export async function resolveAndValidateDestination(
  hostname: string,
  port: number,
  options: EgressProxyOptions = {}
): Promise<ResolvedDestination> {
  const cleanHost = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Check localhost / internal domain aliases
  const isLocal =
    cleanHost === "localhost" ||
    cleanHost === "localhost.localdomain" ||
    cleanHost.endsWith(".localhost") ||
    cleanHost.endsWith(".local") ||
    cleanHost.endsWith(".internal") ||
    cleanHost.endsWith(".lan");

  if (isLocal && !options.allowLocalhostForTesting) {
    throw new EgressSecurityError(
      `Egress violation: Destination "${cleanHost}" is a restricted internal domain alias.`
    );
  }

  // Check IP literal directly
  const ipFamily = net.isIP(cleanHost);
  if (ipFamily === 4) {
    if (isPrivateOrReservedIpv4(cleanHost) && !options.allowLocalhostForTesting) {
      throw new EgressSecurityError(
        `Egress violation: Direct private/reserved IPv4 address "${cleanHost}" is blocked.`
      );
    }
    return { hostname: cleanHost, port, resolvedIp: cleanHost };
  }

  if (ipFamily === 6) {
    if (isPrivateOrReservedIpv6(cleanHost) && !options.allowLocalhostForTesting) {
      throw new EgressSecurityError(
        `Egress violation: Direct private/reserved IPv6 address "${cleanHost}" is blocked.`
      );
    }
    return { hostname: cleanHost, port, resolvedIp: cleanHost };
  }

  // Resolve hostname via DNS
  let addresses: { address: string; family: number }[] = [];
  try {
    addresses = await dns.lookup(cleanHost, { all: true });
  } catch (err: any) {
    throw new EgressSecurityError(
      `Egress DNS resolution failed for "${cleanHost}": ${err.message}`
    );
  }

  if (!addresses || addresses.length === 0) {
    throw new EgressSecurityError(`No DNS records found for destination "${cleanHost}".`);
  }

  // Validate every resolved IP address
  if (!options.allowLocalhostForTesting) {
    for (const record of addresses) {
      if (record.family === 4 && isPrivateOrReservedIpv4(record.address)) {
        throw new EgressSecurityError(
          `Egress violation: Host "${cleanHost}" resolves to restricted private/reserved IPv4: ${record.address}`
        );
      }
      if (record.family === 6 && isPrivateOrReservedIpv6(record.address)) {
        throw new EgressSecurityError(
          `Egress violation: Host "${cleanHost}" resolves to restricted private/reserved IPv6: ${record.address}`
        );
      }
    }
  }

  // Select the first verified address for connection to defeat DNS rebinding
  return {
    hostname: cleanHost,
    port,
    resolvedIp: addresses[0].address,
  };
}

/**
 * Dedicated Egress Filtering Forward Proxy for Headless Browser Execution.
 * Intercepts all HTTP, HTTPS (CONNECT), WebSocket, redirect, subresource, and iframe requests,
 * enforcing strict non-private destination boundaries before opening any outbound socket.
 */
export class EgressFilterProxy {
  private server: http.Server | null = null;
  private activeSockets = new Set<net.Socket>();
  private options: EgressProxyOptions;
  public port = 0;
  public proxyUrl = "";
  public requestLogs: EgressRequestLog[] = [];

  constructor(options: EgressProxyOptions = {}) {
    this.options = options;
  }

  private logEvent(log: EgressRequestLog) {
    this.requestLogs.push(log);
    if (this.options.onRequestLog) {
      try {
        this.options.onRequestLog(log);
      } catch {}
    }
  }

  /**
   * Starts the egress proxy server on loopback on a dynamically assigned port.
   */
  async start(): Promise<{ port: number; proxyUrl: string }> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      this.server.on("connect", (req, clientSocket, head) => {
        this.handleConnectRequest(req, clientSocket, head);
      });

      this.server.on("connection", (socket) => {
        this.activeSockets.add(socket);
        socket.on("close", () => this.activeSockets.delete(socket));
      });

      this.server.on("error", (err) => {
        reject(new EgressProxyUnavailableError(`Egress proxy server error: ${err.message}`));
      });

      this.server.listen(0, "127.0.0.1", () => {
        const addr = this.server?.address();
        if (typeof addr === "object" && addr) {
          this.port = addr.port;
          this.proxyUrl = `http://127.0.0.1:${this.port}`;
          resolve({ port: this.port, proxyUrl: this.proxyUrl });
        } else {
          reject(new EgressProxyUnavailableError("Failed to obtain egress proxy listening address."));
        }
      });
    });
  }

  /**
   * Handles plain HTTP requests (including plain WebSocket upgrade requests).
   */
  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    const rawUrl = req.url || "";
    let parsedUrl: URL;

    try {
      try {
        parsedUrl = new URL(rawUrl);
      } catch {
        if (req.headers.host) {
          parsedUrl = new URL(`http://${req.headers.host}${rawUrl}`);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Invalid URL format");
        }
      }

      const targetPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 80;
      const destination = await resolveAndValidateDestination(
        parsedUrl.hostname,
        targetPort,
        this.options
      );

      // Forward request to verified public IP
      const upstreamReq = http.request(
        {
          host: destination.resolvedIp,
          port: destination.port,
          method: req.method,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: {
            ...req.headers,
            host: destination.hostname, // Preserve original Host header
          },
        },
        (upstreamRes) => {
          this.logEvent({
            timestamp: new Date().toISOString(),
            type: "HTTP",
            method: req.method || "GET",
            target: rawUrl,
            clientIp: req.socket.remoteAddress,
            blocked: false,
            statusCode: upstreamRes.statusCode || 200,
            destinationIp: destination.resolvedIp,
          });

          res.writeHead(upstreamRes.statusCode || 200, upstreamRes.headers);
          upstreamRes.pipe(res);
        }
      );

      upstreamReq.on("error", (err) => {
        this.logEvent({
          timestamp: new Date().toISOString(),
          type: "HTTP",
          method: req.method || "GET",
          target: rawUrl,
          clientIp: req.socket.remoteAddress,
          blocked: false,
          statusCode: 502,
          reason: `Upstream error: ${err.message}`,
        });

        if (!res.headersSent) {
          res.writeHead(502, { "Content-Type": "text/plain" });
        }
        res.end(`Upstream request failed: ${err.message}`);
      });

      req.pipe(upstreamReq);
    } catch (err: any) {
      const status = err instanceof EgressSecurityError ? 403 : 502;
      this.logEvent({
        timestamp: new Date().toISOString(),
        type: "HTTP",
        method: req.method || "GET",
        target: rawUrl,
        clientIp: req.socket.remoteAddress,
        blocked: true,
        statusCode: status,
        reason: err.message,
      });

      res.writeHead(status, { "Content-Type": "text/plain" });
      res.end(`Egress blocked: ${err.message}`);
    }
  }

  /**
   * Handles HTTPS and WSS CONNECT tunneling requests.
   */
  private async handleConnectRequest(
    req: http.IncomingMessage,
    clientSocket: stream.Duplex,
    head: Buffer
  ) {
    const rawTarget = req.url || "";
    let rawHost = "";
    let rawPort = "";

    const lastColon = rawTarget.lastIndexOf(":");
    if (lastColon !== -1) {
      rawHost = rawTarget.substring(0, lastColon);
      rawPort = rawTarget.substring(lastColon + 1);
    } else {
      rawHost = rawTarget;
    }

    try {
      const targetPort = rawPort ? parseInt(rawPort, 10) : 443;

      if (!rawHost) {
        clientSocket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
        return clientSocket.destroy();
      }

      // Validate destination and resolve IP
      const destination = await resolveAndValidateDestination(
        rawHost,
        targetPort,
        this.options
      );

      // Connect TCP socket directly to verified IP
      const upstreamSocket = net.connect(
        {
          host: destination.resolvedIp,
          port: destination.port,
        },
        () => {
          this.logEvent({
            timestamp: new Date().toISOString(),
            type: "CONNECT",
            method: "CONNECT",
            target: rawTarget,
            clientIp: (clientSocket as any).remoteAddress,
            blocked: false,
            statusCode: 200,
            destinationIp: destination.resolvedIp,
          });

          clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          if (head && head.length > 0) {
            upstreamSocket.write(head);
          }
          upstreamSocket.pipe(clientSocket);
          clientSocket.pipe(upstreamSocket);
        }
      );

      upstreamSocket.on("error", (err) => {
        this.logEvent({
          timestamp: new Date().toISOString(),
          type: "CONNECT",
          method: "CONNECT",
          target: rawTarget,
          clientIp: (clientSocket as any).remoteAddress,
          blocked: false,
          statusCode: 502,
          reason: `Upstream socket error: ${err.message}`,
        });

        clientSocket.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
        clientSocket.destroy();
      });

      clientSocket.on("error", () => {
        upstreamSocket.destroy();
      });
    } catch (err: any) {
      this.logEvent({
        timestamp: new Date().toISOString(),
        type: "CONNECT",
        method: "CONNECT",
        target: rawTarget,
        clientIp: (clientSocket as any).remoteAddress,
        blocked: true,
        statusCode: 403,
        reason: err.message,
      });

      clientSocket.write(
        `HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nEgress blocked: ${err.message}`
      );
      clientSocket.destroy();
    }
  }

  /**
   * Safely stops the proxy and terminates all active connections.
   */
  async stop(): Promise<void> {
    for (const socket of this.activeSockets) {
      try {
        socket.destroy();
      } catch {}
    }
    this.activeSockets.clear();

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }
  }
}
