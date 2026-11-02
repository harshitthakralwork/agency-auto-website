import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

export class REARunnerError extends Error {
  public readonly code: string;
  public readonly exitCode?: number | null;
  public readonly stderr?: string;

  constructor(message: string, code = "REA_RUNNER_ERROR", exitCode: number | null = null, stderr = "") {
    super(message);
    this.name = "REARunnerError";
    this.code = code;
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

export class REATimeoutError extends REARunnerError {
  constructor(timeoutMs: number) {
    super(`REA execution exceeded timeout threshold of ${timeoutMs}ms. Process terminated.`, "PROCESS_TIMEOUT");
    this.name = "REATimeoutError";
  }
}

export class OversizedOutputError extends REARunnerError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(`REA stdout exceeded maximum allowed buffer size (${sizeBytes} > ${maxBytes} bytes).`, "OVERSIZED_EVIDENCE");
    this.name = "OversizedOutputError";
  }
}

export interface REARunnerOptions {
  timeoutMs?: number;
  maxOutputBytes?: number;
  npxPath?: string;
  pinnedPackageVersion?: string;
}

export class REARunner {
  private timeoutMs: number;
  private maxOutputBytes: number;
  private npxCommand: string;
  private pinnedPackage: string;

  constructor(options: REARunnerOptions = {}) {
    this.timeoutMs = options.timeoutMs || 45000; // 45s cutoff
    this.maxOutputBytes = options.maxOutputBytes || 15 * 1024 * 1024; // 15MB buffer
    this.npxCommand = options.npxPath || (process.platform === "win32" ? "npx.cmd" : "npx");
    this.pinnedPackage = options.pinnedPackageVersion || "rea-agents@6.7.0";
  }

  /**
   * Kills a child process and all its descendants reliably on Windows/Unix.
   */
  private static killProcessTree(child: ChildProcess): void {
    if (!child.pid) return;

    if (process.platform === "win32") {
      try {
        spawn("taskkill.exe", ["/pid", child.pid.toString(), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
      } catch {
        child.kill("SIGKILL");
      }
    } else {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }
  }

  /**
   * Executes capture-browser-scenario through a securely bounded child process without shell interpolation.
   */
  async runScenario(scenarioPath: string): Promise<string> {
    const resolvedPath = path.resolve(scenarioPath);

    // Fixed, non-interpolated argument vector
    const scenarioArgs = [
      "-y",
      this.pinnedPackage,
      "capture-browser-scenario",
      resolvedPath,
      "--format",
      "json",
    ];

    // Determine secure, non-shell execution binary and argument vector.
    // On Windows, node prevents spawning .cmd files with shell: false (EINVAL).
    // Running node.exe directly with npm's npx-cli.js bypasses batch wrappers completely.
    let execBinary: string;
    let execArgs: string[];

    const nodeBundledNpx = path.join(
      path.dirname(process.execPath),
      "node_modules",
      "npm",
      "bin",
      "npx-cli.js"
    );

    if (fs.existsSync(nodeBundledNpx)) {
      execBinary = process.execPath;
      execArgs = [nodeBundledNpx, ...scenarioArgs];
    } else if (process.platform === "win32") {
      execBinary = process.env.ComSpec || "cmd.exe";
      execArgs = ["/d", "/s", "/c", this.npxCommand, ...scenarioArgs];
    } else {
      execBinary = this.npxCommand;
      execArgs = scenarioArgs;
    }

    return new Promise<string>((resolve, reject) => {
      let child: ChildProcess;
      let timedOut = false;
      let totalStdoutBytes = 0;
      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      try {
        // Direct executable execution: zero shell interpolation
        child = spawn(/*turbopackIgnore: true*/ execBinary, execArgs, {
          windowsHide: true,
          shell: false,
        });
      } catch (spawnErr: any) {
        return reject(
          new REARunnerError(
            `Failed to spawn REA runner process: ${spawnErr.message}`,
            "SPAWN_FAILED"
          )
        );
      }

      // Process timeout timer
      const timer = setTimeout(() => {
        timedOut = true;
        REARunner.killProcessTree(child);
        reject(new REATimeoutError(this.timeoutMs));
      }, this.timeoutMs);

      // Stdout collector with bounds enforcement
      child.stdout?.on("data", (chunk: Buffer) => {
        totalStdoutBytes += chunk.length;
        if (totalStdoutBytes > this.maxOutputBytes) {
          clearTimeout(timer);
          REARunner.killProcessTree(child);
          reject(new OversizedOutputError(totalStdoutBytes, this.maxOutputBytes));
          return;
        }
        stdoutChunks.push(chunk);
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderrChunks.push(chunk);
      });

      child.on("error", (err: Error) => {
        clearTimeout(timer);
        if (!timedOut) {
          REARunner.killProcessTree(child);
          reject(new REARunnerError(`REA process encountered error: ${err.message}`, "PROCESS_ERROR"));
        }
      });

      child.on("close", (code: number | null) => {
        clearTimeout(timer);
        if (timedOut) return;

        const stdout = Buffer.concat(stdoutChunks).toString("utf8");
        const stderr = Buffer.concat(stderrChunks).toString("utf8");

        if (code !== 0) {
          // Check if stdout contains structured REA JSON error envelope
          if (stdout.includes('"error":') || stdout.includes('"code":')) {
            // Let the parser handle the structured error envelope
            return resolve(stdout);
          }
          return reject(
            new REARunnerError(
              `REA process exited with failure code ${code}: ${stderr || stdout}`,
              "NON_ZERO_EXIT",
              code,
              stderr
            )
          );
        }

        resolve(stdout);
      });
    });
  }
}

export const reaRunner = new REARunner();
