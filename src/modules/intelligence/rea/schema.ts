import { z } from "zod";

export const reaProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
});

export const reaArtifactValueSchema = z.object({
  sha256: z.string().optional(),
  bytes: z.number().optional(),
  text: z.string().optional(),
}).passthrough();

export const reaStepArtifactsSchema = z.object({
  screenshot: z.object({ state: z.string(), value: reaArtifactValueSchema.optional() }).optional(),
  dom: z.object({ state: z.string(), value: reaArtifactValueSchema.optional() }).optional(),
  accessibility: z.object({ state: z.string(), value: reaArtifactValueSchema.optional() }).optional(),
  url: z.object({
    state: z.string(),
    value: z.object({
      url: z.string(),
      origin: z.string().optional(),
      query_parameter_names: z.array(z.string()).optional(),
      redacted: z.boolean().optional(),
    }).optional(),
  }).optional(),
  history: z.object({ state: z.string() }).passthrough().optional(),
  storage: z.object({ state: z.string() }).passthrough().optional(),
}).passthrough();

export const reaScenarioStepSchema = z.object({
  step_index: z.number(),
  step_id: z.string(),
  action: z.string(),
  elapsed_ms: z.number(),
  before_url: z.object({
    url: z.string(),
    origin: z.string().nullable().optional(),
    redacted: z.boolean().optional(),
  }).passthrough(),
  after_url: z.object({
    url: z.string(),
    origin: z.string().nullable().optional(),
    redacted: z.boolean().optional(),
  }).passthrough(),
  artifacts: reaStepArtifactsSchema,
  status: z.string(),
  error: z.any().nullable().optional(),
});

export const reaNormalizedResultSchema = z.object({
  browser: z.object({
    mode: z.string(),
    product: z.string(),
    version: z.string(),
  }).passthrough(),
  scenario: z.object({
    start_origin: z.string().optional(),
    action_count: z.number().optional(),
  }).passthrough().optional(),
  duration_ms: z.number(),
  steps: z.array(reaScenarioStepSchema),
  completeness: z.object({
    status: z.string(),
  }).passthrough().optional(),
  limitations: z.array(z.string()).default([]),
});

export const reaEvidenceEnvelopeSchema = z.object({
  evidence_id: z.string().min(1, "Evidence ID is required"),
  provider: reaProviderSchema,
  predicate_type: z.string(),
  operation: z.string(),
  parameters: z.object({
    browser: z.object({
      mode: z.string(),
      executable_path: z.string().optional(),
      headless: z.boolean().optional(),
    }).passthrough(),
    start_url: z.object({
      url: z.string(),
      query: z.array(z.any()).optional(),
    }).passthrough(),
    scenario_sha256: z.string().optional(),
  }).passthrough(),
  normalized_result: reaNormalizedResultSchema,
  confidence: z.string().optional(),
  authority: z.string().optional(),
  limitations: z.array(z.string()).optional(),
}).passthrough();
