import { db } from "@/lib/db";
import { validateTargetUrl, SSRFSecurityError, InvalidUrlError } from "../security/ssrf";
import { EgressSecurityError, EgressProxyUnavailableError } from "../security/egress-proxy";
import {
  ExecutionSemaphore,
  reaExecutionSemaphore,
  ConcurrencyLimitExceededError,
} from "../security/concurrency";
import { REAScenarioBuilder } from "./scenario";
import { REARunner, REARunnerError, REATimeoutError, OversizedOutputError } from "./runner";
import { REAEvidenceParser, MalformedEvidenceError, EvidenceHashMismatchError } from "./parser";
import { EvidenceStorageService, evidenceStorage } from "../storage/evidence-storage";
import { ParsedEvidenceSummary } from "./types";

export interface AnalyzeWebsiteOptions {
  targetUrl: string;
  projectId?: string;
  industry?: string;
  allowLocalhostForTesting?: boolean;
  enableEgressProtection?: boolean;
}

export class WebsiteIntelligenceService {
  private runner: REARunner;
  private storage: EvidenceStorageService;
  private semaphore: ExecutionSemaphore;

  constructor(
    runner?: REARunner,
    storage?: EvidenceStorageService,
    semaphore?: ExecutionSemaphore
  ) {
    this.runner = runner || new REARunner();
    this.storage = storage || evidenceStorage;
    this.semaphore = semaphore || reaExecutionSemaphore;
  }

  /**
   * Orchestrates the complete research lifecycle: URL validation, SSRF DNS protection,
   * bounded scenario execution, evidence verification, atomic disk persistence, and SQLite recording.
   */
  async analyzeWebsite(options: AnalyzeWebsiteOptions) {
    const {
      targetUrl,
      projectId,
      industry,
      allowLocalhostForTesting = false,
      enableEgressProtection = true,
    } = options;

    // 1. Concurrency control: acquire execution slot (strictly 1 active REA browser by default)
    this.semaphore.acquire();

    let session: any = null;
    let storedStoragePath: string | null = null;
    let scenarioCleanup: (() => Promise<void>) | null = null;

    try {
      // 2. SSRF and Protocol Validation
      const validated = await validateTargetUrl(targetUrl, { allowLocalhostForTesting });

      // 3. Create initial SQLite record in QUEUED / ANALYZING state
      session = await db.researchSession.create({
        data: {
          projectId: projectId || null,
          targetUrl: validated.originalUrl,
          canonicalUrl: validated.canonicalUrl,
          targetDomain: validated.hostname,
          industry: industry || null,
          status: "ANALYZING",
          startedAt: new Date(),
          retryCount: 0,
        },
      });

      // 4. Build declarative scenario JSON file (with EgressFilterProxy integration)
      const { scenarioPath, cleanup } = await REAScenarioBuilder.createScenarioFile({
        targetUrl: validated.canonicalUrl,
        initialWaitMs: 3000,
        scrollWaitMs: 1500,
        allowLocalhostForTesting,
        enableEgressProtection,
      });
      scenarioCleanup = cleanup;

      // 5. Execute REA runner in bounded child process
      const rawOutput = await this.runner.runScenario(scenarioPath);

      // 6. Parse and cryptographically verify evidence envelope
      const summary: ParsedEvidenceSummary = REAEvidenceParser.parse(rawOutput);

      // 7. Save verified evidence JSON atomically to non-public disk storage
      const savedFile = await this.storage.saveEvidence(
        summary.evidenceId,
        rawOutput
      );
      storedStoragePath = savedFile.storagePath;

      // 8. Update SQLite record with verified facts, heuristics, and disk pointer
      const updated = await db.researchSession.update({
        where: { id: session.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          title: summary.observedFacts.title,
          evidenceId: summary.evidenceId,
          evidenceSha256: savedFile.sha256,
          evidenceStoragePath: savedFile.storagePath,
          evidenceFileSizeBytes: savedFile.fileSizeBytes,
          durationMs: summary.durationMs,
          capturedDomBytes: summary.capturedDomBytes,
          capturedA11yBytes: summary.capturedA11yBytes,
          observedFactsJson: JSON.stringify(summary.observedFacts),
          heuristicDetectionsJson: JSON.stringify(summary.heuristicDetections),
          limitationsJson: JSON.stringify(summary.limitations),
        },
      });

      return updated;
    } catch (err: any) {
      // Rollback saved disk evidence on database or processing failure
      if (storedStoragePath) {
        await this.storage.rollbackEvidence(storedStoragePath);
      }

      // Classify structured error code
      let errorCode = "RUNTIME_CRASH";
      if (err instanceof SSRFSecurityError) errorCode = err.code;
      else if (err instanceof EgressSecurityError) errorCode = err.code;
      else if (err instanceof EgressProxyUnavailableError) errorCode = err.code;
      else if (err instanceof ConcurrencyLimitExceededError) errorCode = err.code;
      else if (err instanceof InvalidUrlError) errorCode = err.code;
      else if (err instanceof REATimeoutError) errorCode = err.code;
      else if (err instanceof OversizedOutputError) errorCode = err.code;
      else if (err instanceof MalformedEvidenceError) errorCode = err.code;
      else if (err instanceof EvidenceHashMismatchError) errorCode = err.code;
      else if (err instanceof REARunnerError) errorCode = err.code;

      // Record failure state in SQLite if session was created
      if (session?.id) {
        try {
          await db.researchSession.update({
            where: { id: session.id },
            data: {
              status: "FAILED",
              completedAt: new Date(),
              errorCode,
              errorMessage: err.message || "Unknown error during website analysis",
            },
          });
        } catch {}
      }

      throw err;
    } finally {
      // Ensure temp scenario file is always cleaned up
      if (scenarioCleanup) {
        try {
          await scenarioCleanup();
        } catch {}
      }
      // Always release concurrency semaphore slot to prevent slot leaks
      this.semaphore.release();
    }
  }

  /**
   * Retrieves a research session by ID.
   */
  async getSession(id: string) {
    return db.researchSession.findUnique({
      where: { id },
      include: { project: true },
    });
  }

  /**
   * Lists research sessions with optional filtering.
   */
  async listSessions(options: { projectId?: string; limit?: number } = {}) {
    return db.researchSession.findMany({
      where: options.projectId ? { projectId: options.projectId } : undefined,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      include: { project: true },
    });
  }

  /**
   * Safely reads stored evidence from disk, returning selected slices without evaluating HTML/JS.
   */
  async getEvidence(sessionId: string, slice: "all" | "dom" | "accessibility" | "summary" = "summary") {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Research session "${sessionId}" not found.`);
    }

    if (!session.evidenceStoragePath) {
      throw new Error(`Research session "${sessionId}" has no stored evidence on disk.`);
    }

    const { data } = await this.storage.readEvidence(session.evidenceStoragePath);

    if (slice === "all") {
      return data;
    }

    const steps = data.normalized_result?.steps || [];
    const finalStep = steps[steps.length - 1];

    if (slice === "dom") {
      return {
        evidenceId: session.evidenceId,
        targetUrl: session.targetUrl,
        domText: finalStep?.artifacts?.dom?.value?.text || "",
        sha256: finalStep?.artifacts?.dom?.value?.sha256 || "",
        bytes: finalStep?.artifacts?.dom?.value?.bytes || 0,
      };
    }

    if (slice === "accessibility") {
      return {
        evidenceId: session.evidenceId,
        targetUrl: session.targetUrl,
        accessibilityText: finalStep?.artifacts?.accessibility?.value?.text || "",
        sha256: finalStep?.artifacts?.accessibility?.value?.sha256 || "",
        bytes: finalStep?.artifacts?.accessibility?.value?.bytes || 0,
      };
    }

    // Default: summary
    return {
      evidenceId: session.evidenceId,
      targetUrl: session.targetUrl,
      title: session.title,
      durationMs: session.durationMs,
      observedFacts: JSON.parse(session.observedFactsJson || "{}"),
      heuristicDetections: JSON.parse(session.heuristicDetectionsJson || "[]"),
      limitations: JSON.parse(session.limitationsJson || "[]"),
      selectedFindings: JSON.parse((session as any).selectedFindingsJson || "[]"),
    };
  }

  /**
   * Updates manually selected findings on a research session.
   */
  async updateSelectedFindings(id: string, findings: string[]): Promise<any> {
    return db.researchSession.update({
      where: { id },
      data: {
        selectedFindingsJson: JSON.stringify(findings),
      },
    });
  }

  /**
   * Deletes a research session and purges its stored evidence from disk.
   */
  async deleteSession(id: string): Promise<boolean> {
    const session = await db.researchSession.findUnique({
      where: { id },
    });

    if (!session) return false;

    // Purge disk evidence file
    if (session.evidenceStoragePath) {
      await this.storage.deleteEvidence(session.evidenceStoragePath);
    }

    // Delete record from database
    await db.researchSession.delete({
      where: { id },
    });

    return true;
  }
}

export const websiteIntelligence = new WebsiteIntelligenceService();

