export type QAIssueSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface QAIssue {
  code: string;
  category: "accessibility" | "security" | "seo" | "performance" | "routes";
  severity: QAIssueSeverity;
  message: string;
  target?: string;
  recommendation: string;
}

export interface QACategoryScore {
  name: string;
  score: number; // 0 - 100
  passedChecks: number;
  totalChecks: number;
  status: "PASSED" | "NEEDS_ATTENTION" | "FAILED";
  details: string[];
}

export interface QAAuditResult {
  projectId: string;
  projectName: string;
  auditId: string;
  overallScore: number; // 0 - 100
  status: "PASSED" | "NEEDS_ATTENTION" | "FAILED";
  summary: {
    criticalIssues: number;
    warnings: number;
    infoCount: number;
    pagesAudited: number;
    assetsAudited: number;
    totalSizeBytes: number;
    zeroCdnCompliant: boolean;
  };
  categories: {
    accessibility: QACategoryScore;
    security: QACategoryScore;
    seo: QACategoryScore;
    performance: QACategoryScore;
    routes: QACategoryScore;
  };
  issues: QAIssue[];
  auditedAt: string;
}
