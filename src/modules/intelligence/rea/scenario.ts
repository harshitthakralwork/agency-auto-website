import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface BrowserScenarioConfig {
  targetUrl: string;
  viewport?: { width: number; height: number };
  initialWaitMs?: number;
  scrollWaitMs?: number;
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
   */
  static async createScenarioFile(
    config: BrowserScenarioConfig,
    tempDir: string = path.resolve(process.cwd(), "storage", "temp")
  ): Promise<{ scenarioPath: string; cleanup: () => Promise<void> }> {
    await fs.mkdir(tempDir, { recursive: true });

    const browserPath = await this.findBrowserExecutable();
    const scenarioId = `scenario_${crypto.randomBytes(8).toString("hex")}`;
    const scenarioPath = path.resolve(tempDir, `${scenarioId}.json`);

    const scenarioPayload = {
      browser: {
        mode: "launch",
        executable_path: browserPath,
        headless: true,
      },
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
      try {
        await fs.unlink(scenarioPath);
      } catch {}
    };

    return { scenarioPath, cleanup };
  }
}
