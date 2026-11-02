import crypto from "crypto";
import { reaEvidenceEnvelopeSchema } from "./schema";
import {
  REAEvidenceEnvelope,
  ParsedEvidenceSummary,
  ObservedFacts,
  HeuristicDetection,
} from "./types";

export class MalformedEvidenceError extends Error {
  public readonly code = "MALFORMED_OUTPUT";
  constructor(message: string) {
    super(message);
    this.name = "MalformedEvidenceError";
  }
}

export class EvidenceHashMismatchError extends Error {
  public readonly code = "HASH_MISMATCH";
  constructor(message: string) {
    super(message);
    this.name = "EvidenceHashMismatchError";
  }
}

export class REAEvidenceParser {
  /**
   * Computes SHA-256 hash of a string.
   */
  private static sha256(input: string): string {
    return crypto.createHash("sha256").update(input, "utf8").digest("hex");
  }

  /**
   * Parses, validates, and extracts observed facts and heuristic hypotheses from raw REA JSON.
   */
  static parse(rawJson: string | object): ParsedEvidenceSummary {
    let rawObj: any;

    if (typeof rawJson === "string") {
      // Strip potential UTF-8 BOM
      const cleanString = rawJson.replace(/^\uFEFF/, "").trim();
      try {
        rawObj = JSON.parse(cleanString);
      } catch (err: any) {
        throw new MalformedEvidenceError(`Failed to parse REA output as JSON: ${err.message}`);
      }
    } else if (typeof rawJson === "object" && rawJson !== null) {
      rawObj = rawJson;
    } else {
      throw new MalformedEvidenceError("REA evidence input must be a JSON string or object.");
    }

    // Check if REA emitted a top-level error envelope
    if (rawObj.error) {
      throw new MalformedEvidenceError(
        `REA reported execution error: ${rawObj.error} (${rawObj.message || rawObj.code || "unknown"})`
      );
    }

    // Validate against Zod schema
    const validationResult = reaEvidenceEnvelopeSchema.safeParse(rawObj);
    if (!validationResult.success) {
      const issueSummary = validationResult.error.issues
        .map((i) => `[${i.path.join(".")}]: ${i.message}`)
        .join("; ");
      throw new MalformedEvidenceError(`REA evidence failed schema validation: ${issueSummary}`);
    }

    const envelope: REAEvidenceEnvelope = validationResult.data as unknown as REAEvidenceEnvelope;
    const steps = envelope.normalized_result.steps;

    if (!Array.isArray(steps) || steps.length === 0) {
      throw new MalformedEvidenceError("REA evidence contains no recorded scenario steps.");
    }

    // Find step that contains captured DOM/A11y artifacts (usually the final step)
    const finalStep = steps[steps.length - 1];
    const domArtifact = finalStep.artifacts?.dom?.value;
    const a11yArtifact = finalStep.artifacts?.accessibility?.value;

    const domText = domArtifact?.text || "";
    const a11yText = a11yArtifact?.text || "";

    // 1. Verify Hashes where provided
    if (domArtifact?.sha256 && domText) {
      const computedDomSha = this.sha256(domText);
      if (computedDomSha !== domArtifact.sha256) {
        throw new EvidenceHashMismatchError(
          `DOM hash mismatch: Expected ${domArtifact.sha256}, but computed ${computedDomSha}`
        );
      }
    }

    if (a11yArtifact?.sha256 && a11yText) {
      const computedA11ySha = this.sha256(a11yText);
      if (computedA11ySha !== a11yArtifact.sha256) {
        throw new EvidenceHashMismatchError(
          `Accessibility tree hash mismatch: Expected ${a11yArtifact.sha256}, but computed ${computedA11ySha}`
        );
      }
    }

    // 2. Extract strictly Grounded Observed Facts
    const observedFacts = this.extractObservedFacts(domText);

    // 3. Extract Heuristic Inferences with Evidence Citations
    const heuristicDetections = this.extractHeuristics(domText, observedFacts);

    // 4. Combine limitations
    const limitations = [
      ...(envelope.limitations || []),
      ...(envelope.normalized_result.limitations || []),
    ];

    return {
      evidenceId: envelope.evidence_id,
      provider: envelope.provider,
      canonicalStartUrl: envelope.parameters.start_url.url,
      canonicalEndUrl: finalStep.after_url.url || envelope.parameters.start_url.url,
      durationMs: envelope.normalized_result.duration_ms || 0,
      stepCount: steps.length,
      capturedDomBytes: domArtifact?.bytes || Buffer.byteLength(domText, "utf8"),
      capturedA11yBytes: a11yArtifact?.bytes || Buffer.byteLength(a11yText, "utf8"),
      observedFacts,
      heuristicDetections,
      limitations,
      verifiedSha256: {
        domSha256: domArtifact?.sha256,
        a11ySha256: a11yArtifact?.sha256,
        scenarioSha256: envelope.parameters.scenario_sha256,
      },
    };
  }

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
  }

  /**
   * Extracts purely factual elements without interpreting them.
   */
  private static extractObservedFacts(domText: string): ObservedFacts {
    if (!domText) {
      return {
        title: null,
        metaTags: {},
        hasVideo: false,
        hasCanvas: false,
        externalScriptCount: 0,
        externalScripts: [],
        semanticContainers: [],
        topHeadingTexts: [],
        linksCount: 0,
      };
    }

    // Title tag
    const titleMatch = domText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? this.decodeHtmlEntities(titleMatch[1].trim()) : null;

    // Meta tags
    const metaTags: Record<string, string> = {};
    const metaMatches = domText.matchAll(/<meta\s+([^>]*?)>/gi);
    for (const match of metaMatches) {
      const attrs = match[1];
      const nameMatch = attrs.match(/(?:name|property)=["']([^"']+)["']/i);
      const contentMatch = attrs.match(/content=["']([^"']*)["']/i);
      if (nameMatch && contentMatch) {
        metaTags[nameMatch[1].toLowerCase()] = contentMatch[1];
      }
    }

    // Video & Canvas presence
    const hasVideo = /<video[\s>]/i.test(domText);
    const hasCanvas = /<canvas[\s>]/i.test(domText);

    // External scripts
    const externalScripts: string[] = [];
    const scriptMatches = domText.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi);
    for (const match of scriptMatches) {
      externalScripts.push(match[1]);
    }

    // Semantic containers
    const semanticContainers: string[] = [];
    const containerMatches = domText.matchAll(/<(header|nav|main|section|article|footer)[\s>]/gi);
    for (const match of containerMatches) {
      const tag = match[1].toLowerCase();
      if (!semanticContainers.includes(tag)) {
        semanticContainers.push(tag);
      }
    }

    // Top headings
    const topHeadingTexts: string[] = [];
    const headingMatches = domText.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi);
    for (const match of headingMatches) {
      const clean = match[1].replace(/<[^>]*>/g, "").trim();
      if (clean && topHeadingTexts.length < 5) {
        topHeadingTexts.push(clean);
      }
    }

    // Link count
    const linksCount = (domText.match(/<a\s+[^>]*href=/gi) || []).length;

    return {
      title,
      metaTags,
      hasVideo,
      hasCanvas,
      externalScriptCount: externalScripts.length,
      externalScripts,
      semanticContainers,
      topHeadingTexts,
      linksCount,
    };
  }

  /**
   * Generates heuristic inferences, explicitly stating confidence and citing exact evidence.
   */
  private static extractHeuristics(
    domText: string,
    facts: ObservedFacts
  ): HeuristicDetection[] {
    const detections: HeuristicDetection[] = [];

    // Next.js Detection
    const hasNextScript = facts.externalScripts.some((s) => s.includes("/_next/"));
    const hasNextData = domText.includes('id="__NEXT_DATA__"');
    if (hasNextScript || hasNextData) {
      detections.push({
        category: "framework",
        name: "Next.js",
        confidence: hasNextData && hasNextScript ? 0.98 : 0.85,
        evidenceKind: hasNextData ? "html_attribute" : "script_url",
        sourceCitation: hasNextData ? 'id="__NEXT_DATA__"' : facts.externalScripts.find((s) => s.includes("/_next/")) || "",
        hypothesis: "Observed Next.js manifest structure or /_next/ asset distribution path.",
      });
    }

    // Astro Detection
    const astroScript = facts.externalScripts.find((s) => s.includes("/_astro/"));
    const astroAttr = domText.includes("data-astro-");
    if (astroScript || astroAttr) {
      detections.push({
        category: "framework",
        name: "Astro",
        confidence: astroScript && astroAttr ? 0.98 : 0.85,
        evidenceKind: astroScript ? "script_url" : "html_attribute",
        sourceCitation: astroScript || 'data-astro-* attribute',
        hypothesis: "Observed /_astro/ chunk bundling structure and Astro island attributes.",
      });
    }

    // Drupal Detection
    const hasDrupalMeta = facts.metaTags["generator"]?.toLowerCase().includes("drupal");
    const drupalScript = facts.externalScripts.find((s) => s.toLowerCase().includes("drupal"));
    if (hasDrupalMeta || drupalScript) {
      detections.push({
        category: "cms",
        name: "Drupal",
        confidence: hasDrupalMeta ? 0.99 : 0.8,
        evidenceKind: hasDrupalMeta ? "meta_generator" : "script_url",
        sourceCitation: facts.metaTags["generator"] || drupalScript || "",
        hypothesis: "Observed Drupal generator meta tag or core Drupal asset distribution paths.",
      });
    }

    // Squarespace Detection
    const sqsScript = facts.externalScripts.find((s) => s.includes("squarespace.com"));
    const sqsClass = domText.includes("sqs-") || domText.includes("squarespace");
    if (sqsScript || sqsClass) {
      detections.push({
        category: "cms",
        name: "Squarespace",
        confidence: sqsScript ? 0.95 : 0.75,
        evidenceKind: sqsScript ? "script_url" : "dom_class",
        sourceCitation: sqsScript || "sqs-* CSS class selector",
        hypothesis: "Observed Squarespace static script CDN or template class names.",
      });
    }

    // GSAP / ScrollTrigger Detection
    const gsapScript = facts.externalScripts.find((s) => /gsap|scrolltrigger/i.test(s));
    const gsapClass = /data-scroll|gsap/i.test(domText);
    if (gsapScript || gsapClass) {
      detections.push({
        category: "animation_library",
        name: "GSAP / ScrollTrigger",
        confidence: gsapScript ? 0.95 : 0.7,
        evidenceKind: gsapScript ? "script_url" : "dom_class",
        sourceCitation: gsapScript || "data-scroll attribute in DOM",
        hypothesis: "Observed GSAP bundle reference or locomotive/scroll animation hooks.",
      });
    }

    // Three.js Detection
    const threeScript = facts.externalScripts.find((s) => /three(?:\.min)?\.js/i.test(s));
    const threeMention = /three\.module|three\.js|three\.core/i.test(domText);
    if (threeScript || (threeMention && facts.hasCanvas)) {
      detections.push({
        category: "animation_library",
        name: "Three.js",
        confidence: threeScript ? 0.95 : 0.75,
        evidenceKind: threeScript ? "script_url" : "dom_class",
        sourceCitation: threeScript || "Three.js script string with active <canvas>",
        hypothesis: "Observed Three.js distribution bundle accompanied by WebGL <canvas> elements.",
      });
    }

    // Tailwind CSS Detection
    const hasTailwindClasses = /class="[^"]*(?:flex|grid|hidden|relative|absolute|px-\d|py-\d|text-\w+)[^"]*"/i.test(domText);
    if (hasTailwindClasses) {
      detections.push({
        category: "styling",
        name: "Tailwind CSS",
        confidence: 0.8,
        evidenceKind: "dom_class",
        sourceCitation: "Utility class pattern (e.g. flex, grid, px-*, py-*)",
        hypothesis: "Observed utility-first CSS class convention matching Tailwind CSS standard tokens.",
      });
    }

    return detections;
  }
}
