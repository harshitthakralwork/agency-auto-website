import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import net from "net";
import { EgressFilterProxy } from "../security/egress-proxy";

export interface BrowserScenarioConfig {
  targetUrl: string;
  viewport?: { width: number; height: number };
  initialWaitMs?: number;
  scrollWaitMs?: number;
  allowLocalhostForTesting?: boolean;
  enableEgressProtection?: boolean;
}

/**
 * Finds an available dynamic loopback port.
 */
function getFreeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address() as net.AddressInfo;
      srv.close(() => resolve(addr.port));
    });
    srv.on("error", reject);
  });
}

export class REAScenarioBuilder {
  /**
   * Locates an installed Chromium-based browser on the host system.
   */
  static async findBrowserExecutable(): Promise<string> {
    const candidates = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ];

    for (const p of candidates) {
      try {
        await fs.access(p);
        return p;
      } catch {}
    }

    throw new Error(
      "No compatible Chromium-family browser found (checked Chrome and Edge). REA requires an installed browser for capture-browser-scenario."
    );
  }

  /**
   * Builds an isolated, bounded declarative scenario JSON file for REA execution.
   * If enableEgressProtection is true (default), launches an isolated Chromium instance
   * routed through an in-process EgressFilterProxy and connects REA via loopback CDP.
   */
  static async createScenarioFile(
    config: BrowserScenarioConfig,
    tempDir: string = path.resolve(process.cwd(), "storage", "temp")
  ): Promise<{ scenarioPath: string; cleanup: () => Promise<void> }> {
    await fs.mkdir(tempDir, { recursive: true });

    const browserPath = await this.findBrowserExecutable();
    const scenarioId = `scenario_${crypto.randomBytes(8).toString("hex")}`;
    const scenarioPath = path.resolve(tempDir, `${scenarioId}.json`);

    const useEgressProtection = config.enableEgressProtection !== false;
    let egressProxy: EgressFilterProxy | null = null;
    let browserInstance: any = null;

    let scenarioBrowserPayload: any;

    if (useEgressProtection) {
      // 1. Start dedicated in-process EgressFilterProxy
      egressProxy = new EgressFilterProxy({
        allowLocalhostForTesting: config.allowLocalhostForTesting,
      });
      const { proxyUrl } = await egressProxy.start();

      // 2. Select loopback CDP port and launch proxy-enforced Chromium
      const cdpPort = await getFreeLoopbackPort();
      const { chromium } = await import("playwright");

      browserInstance = await chromium.launch({
        executablePath: browserPath,
        headless: true,
        args: [`--remote-debugging-port=${cdpPort}`],
        proxy: { server: proxyUrl },
      });

      // 3. Acquire CDP target ID for the initial page
      const page = await browserInstance.newPage();
      const cdpSession = await browserInstance.newBrowserCDPSession();
      const { targetInfos } = await cdpSession.send("Target.getTargets");
      const pageTarget = targetInfos.find((t: any) => t.type === "page");

      if (!pageTarget) {
        await browserInstance.close();
        await egressProxy.stop();
        throw new Error("Failed to acquire page target from CDP session");
      }

      scenarioBrowserPayload = {
        mode: "connect",
        cdp_endpoint: `http://127.0.0.1:${cdpPort}`,
        target_id: pageTarget.targetId,
      };
    } else {
      scenarioBrowserPayload = {
        mode: "launch",
        executable_path: browserPath,
        headless: true,
      };
    }

    const scenarioPayload = {
      browser: scenarioBrowserPayload,
      start_url: {
        url: config.targetUrl,
      },
      environment: {
        viewport: config.viewport || { width: 1280, height: 800 },
        reduced_motion: "reduce",
      },
      actions: [
        {
          step_id: "initial_load",
          action: "wait_for_timeout",
          duration_ms: config.initialWaitMs || 3000,
        },
        {
          step_id: "scroll_down",
          action: "press",
          locator: { kind: "css", selector: "body" },
          key: "PageDown",
        },
        {
          step_id: "scroll_stabilize",
          action: "wait_for_timeout",
          duration_ms: config.scrollWaitMs || 1500,
        },
      ],
      capture: {
        at_end: ["url", "dom", "accessibility"],
      },
    };

    await fs.writeFile(scenarioPath, JSON.stringify(scenarioPayload, null, 2), "utf8");

    const cleanup = async () => {
      if (browserInstance) {
        try {
          await browserInstance.close();
        } catch {}
        browserInstance = null;
      }
      if (egressProxy) {
        try {
          await egressProxy.stop();
        } catch {}
        egressProxy = null;
      }
      try {
        await fs.unlink(scenarioPath);
      } catch {}
    };

    return { scenarioPath, cleanup };
  }
}


