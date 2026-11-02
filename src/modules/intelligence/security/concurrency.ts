export class ConcurrencyLimitExceededError extends Error {
  public readonly code = "CONCURRENCY_LIMIT_EXCEEDED";
  public readonly status = 429;

  constructor(maxConcurrent = 1) {
    super(
      `Execution rejected: System concurrency limit of ${maxConcurrent} active REA browser session(s) reached. Please retry shortly.`
    );
    this.name = "ConcurrencyLimitExceededError";
  }
}

/**
 * In-memory execution semaphore for controlling concurrent REA browser processes.
 *
 * SCOPE & ARCHITECTURAL LIMITATION:
 * This in-memory semaphore provides single-process coordination within the active Node.js server instance.
 * It prevents runaway concurrent Chromium launches from exhausting host CPU and RAM.
 * It DOES NOT provide distributed cross-process synchronization if multiple separate Node processes are spawned.
 */
export class ExecutionSemaphore {
  private active = 0;
  private readonly maxConcurrent: number;

  constructor(maxConcurrent = 1) {
    if (maxConcurrent < 1) {
      throw new Error("maxConcurrent must be at least 1");
    }
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Attempts to acquire an execution slot immediately without queuing.
   * Throws ConcurrencyLimitExceededError if all slots are occupied.
   */
  acquire(): void {
    if (this.active >= this.maxConcurrent) {
      throw new ConcurrencyLimitExceededError(this.maxConcurrent);
    }
    this.active += 1;
  }

  /**
   * Safely releases an acquired execution slot.
   * Guarded against negative counts and double-releases.
   */
  release(): void {
    this.active = Math.max(0, this.active - 1);
  }

  /**
   * Returns current active execution count.
   */
  getActiveCount(): number {
    return this.active;
  }

  /**
   * Returns maximum configured concurrency.
   */
  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }

  /**
   * Resets the active count (useful for testing or recovering from process crashes).
   */
  reset(): void {
    this.active = 0;
  }
}

// Default singleton instance: strictly 1 active REA browser execution
export const reaExecutionSemaphore = new ExecutionSemaphore(1);
