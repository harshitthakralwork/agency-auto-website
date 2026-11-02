export interface REAProvider {
  id: string;
  name: string;
  version: string;
}

export interface REAArtifactValue {
  sha256?: string;
  bytes?: number;
  text?: string;
  [key: string]: any;
}

export interface REAStepArtifacts {
  screenshot?: { state: string; value?: REAArtifactValue };
  dom?: { state: string; value?: REAArtifactValue };
  accessibility?: { state: string; value?: REAArtifactValue };
  url?: { state: string; value?: { url: string; origin: string; query_parameter_names?: string[]; redacted?: boolean } };
  history?: { state: string; value?: any };
  storage?: { state: string; value?: any };
}

export interface REAScenarioStep {
  step_index: number;
  step_id: string;
  action: string;
  elapsed_ms: number;
  before_url: { url: string; origin: string | null; redacted?: boolean };
  after_url: { url: string; origin: string | null; redacted?: boolean };
  artifacts: REAStepArtifacts;
  status: "completed" | "failed" | string;
  error: any;
}

export interface REANormalizedResult {
  browser: {
    mode: string;
    product: string;
    version: string;
    process_ownership?: string;
    cleanup?: string;
  };
  scenario: {
    start_origin: string;
    action_count: number;
  };
  duration_ms: number;
  steps: REAScenarioStep[];
  completeness: {
    status: string;
    equality_eligible?: boolean;
    missing_sections?: string[];
    truncated_sections?: string[];
  };
  limitations: string[];
}

export interface REAEvidenceEnvelope {
  evidence_id: string;
  subject: any;
  provider: REAProvider;
  predicate_type: string;
  operation: string;
  parameters: {
    browser: { mode: string; executable_path?: string; headless?: boolean };
    start_url: { url: string; query?: any[] };
    scenario_sha256?: string;
    capture?: any;
    actions?: any[];
  };
  raw_result?: any;
  normalized_result: REANormalizedResult;
  confidence: string;
  authority: string;
  limitations?: string[];
}

/**
 * Verified observed facts directly grounded in evidence (no speculation).
 */
export interface ObservedFacts {
  title: string | null;
  metaTags: Record<string, string>;
  hasVideo: boolean;
  hasCanvas: boolean;
  externalScriptCount: number;
  externalScripts: string[];
  semanticContainers: string[];
  topHeadingTexts: string[];
  linksCount: number;
}

/**
 * Heuristic inferences explicitly marked with confidence score and evidence citation.
 */
export interface HeuristicDetection {
  category: "framework" | "styling" | "animation_library" | "cms";
  name: string;
  confidence: number; // 0.0 to 1.0
  evidenceKind: "script_url" | "meta_generator" | "dom_class" | "html_attribute";
  sourceCitation: string;
  hypothesis: string;
}

export interface ParsedEvidenceSummary {
  evidenceId: string;
  provider: REAProvider;
  canonicalStartUrl: string;
  canonicalEndUrl: string;
  durationMs: number;
  stepCount: number;
  capturedDomBytes: number;
  capturedA11yBytes: number;
  observedFacts: ObservedFacts;
  heuristicDetections: HeuristicDetection[];
  limitations: string[];
  verifiedSha256: {
    domSha256?: string;
    a11ySha256?: string;
    scenarioSha256?: string;
  };
}

