"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Check,
  Plus,
  HelpCircle,
  Palette,
  Type,
  Video,
  Box,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FactsVsHeuristicsProps {
  summary: {
    observedFacts?: {
      title?: string;
      heading?: string;
      hasCanvas?: boolean;
      hasVideo?: boolean;
      metaDescription?: string;
      linkCount?: number;
      imageCount?: number;
      themeColor?: string;
      fontFamilies?: string[];
      viewportWidth?: number;
      viewportHeight?: number;
    };
    heuristicDetections?: Array<{
      category: string;
      name: string;
      confidence: number;
      evidence: string;
    }>;
    heuristics?: Array<{
      category: string;
      name: string;
      confidence: number;
      evidence: string;
    }>;
    limitations?: Array<string | { type: string; description: string }>;
  };
  selectedFindings: string[];
  onToggleFinding: (finding: string) => void;
}

export function FactsVsHeuristics({
  summary,
  selectedFindings,
  onToggleFinding,
}: FactsVsHeuristicsProps) {
  const facts = summary.observedFacts || {};
  const heuristics = summary.heuristics || summary.heuristicDetections || [];
  const limitations = summary.limitations || [];

  const [expandedHeuristic, setExpandedHeuristic] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* SECTION 1: VERIFIED OBSERVED FACTS */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-emerald-300">
                Verified Observed Facts
              </h3>
              <p className="text-xs text-slate-400">
                Direct deterministic observations extracted from the live DOM envelope. Zero speculation.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            CONFIRMED EVIDENCE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Title Fact */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Document Title</span>
              <button
                type="button"
                onClick={() => onToggleFinding(`Title: ${facts.title || "Untitled"}`)}
                className={`p-1 rounded text-xs transition-colors ${
                  selectedFindings.includes(`Title: ${facts.title || "Untitled"}`)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
                title="Select for Blueprint"
              >
                {selectedFindings.includes(`Title: ${facts.title || "Untitled"}`) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-200 line-clamp-2">
              {facts.title || "No title tag captured"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Exact DOM node matched</span>
            </div>
          </div>

          {/* Heading Fact */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Primary Heading (H1)</span>
              <button
                type="button"
                onClick={() => onToggleFinding(`Heading: ${facts.heading || "None"}`)}
                className={`p-1 rounded text-xs transition-colors ${
                  selectedFindings.includes(`Heading: ${facts.heading || "None"}`)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
                title="Select for Blueprint"
              >
                {selectedFindings.includes(`Heading: ${facts.heading || "None"}`) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-200 line-clamp-2">
              {facts.heading || "No H1 tag detected"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>DOM accessibility heading level 1</span>
            </div>
          </div>

          {/* Canvas / WebGL Fact */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Canvas / 3D WebGL</span>
              <button
                type="button"
                onClick={() => onToggleFinding(`Canvas: ${facts.hasCanvas ? "Present" : "Absent"}`)}
                className={`p-1 rounded text-xs transition-colors ${
                  selectedFindings.includes(`Canvas: ${facts.hasCanvas ? "Present" : "Absent"}`)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {selectedFindings.includes(`Canvas: ${facts.hasCanvas ? "Present" : "Absent"}`) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {facts.hasCanvas ? "Interactive <canvas> Present" : "No Canvas Element"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>HTML5 &lt;canvas&gt; tag verified</span>
            </div>
          </div>

          {/* Video Media Fact */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Video Media</span>
              <button
                type="button"
                onClick={() => onToggleFinding(`Video Media: ${facts.hasVideo ? "Present" : "Absent"}`)}
                className={`p-1 rounded text-xs transition-colors ${
                  selectedFindings.includes(`Video Media: ${facts.hasVideo ? "Present" : "Absent"}`)
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {selectedFindings.includes(`Video Media: ${facts.hasVideo ? "Present" : "Absent"}`) ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-200">
              {facts.hasVideo ? "HTML5 <video> Present" : "No Video Elements"}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>HTML5 &lt;video&gt; media verified</span>
            </div>
          </div>

          {/* Optional Theme Color Fact (only if present in evidence) */}
          {facts.themeColor && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5 text-emerald-400" />
                  Meta Theme Color
                </span>
                <button
                  type="button"
                  onClick={() => onToggleFinding(`Theme Color: ${facts.themeColor}`)}
                  className={`p-1 rounded text-xs transition-colors ${
                    selectedFindings.includes(`Theme Color: ${facts.themeColor}`)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedFindings.includes(`Theme Color: ${facts.themeColor}`) ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full border border-slate-700"
                  style={{ backgroundColor: facts.themeColor }}
                />
                <span className="font-mono text-sm text-slate-200">{facts.themeColor}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Extracted from &lt;meta name="theme-color"&gt;</span>
              </div>
            </div>
          )}

          {/* Optional Meta Description Fact */}
          {facts.metaDescription && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Meta Description</span>
                <button
                  type="button"
                  onClick={() => onToggleFinding(`Description: ${facts.metaDescription}`)}
                  className={`p-1 rounded text-xs transition-colors ${
                    selectedFindings.includes(`Description: ${facts.metaDescription}`)
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedFindings.includes(`Description: ${facts.metaDescription}`) ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-300 line-clamp-3">{facts.metaDescription}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>Extracted from &lt;meta name="description"&gt;</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: HEURISTIC DETECTIONS (STRICTLY PROBABILISTIC) */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-amber-900/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-amber-300">
                Heuristic Detections & Inferred Frameworks
              </h3>
              <p className="text-xs text-slate-400">
                Pattern matching on bundle signatures and runtime global cues.{" "}
                <strong className="text-amber-400">Probabilistic inferences, not confirmed facts.</strong>
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60">
            PROBABILISTIC INFERENCE
          </span>
        </div>

        {heuristics.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center">
            <p className="text-sm text-slate-400">
              No framework or library heuristics were triggered from the captured bundle signatures.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heuristics.map((h, idx) => {
              const findingKey = `Heuristic: ${h.name} (${h.category}) - ${Math.round(h.confidence * 100)}%`;
              const isSelected = selectedFindings.includes(findingKey);
              const isExpanded = expandedHeuristic === idx;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/40">
                          {h.category}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100">
                          {h.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedHeuristic(isExpanded ? null : idx)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200"
                        title="View Supporting Evidence"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFinding(findingKey)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                          isSelected
                            ? "bg-amber-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        <span>{isSelected ? "Selected" : "Add to Blueprint"}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Estimated Confidence</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {Math.round(h.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round(h.confidence * 100)}%` }}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-1.5 transition-all">
                      <span className="text-slate-400 font-medium block">
                        Supporting Evidence Citation:
                      </span>
                      <code className="text-amber-300 break-all font-mono block">
                        {(h as any).sourceCitation || (h as any).evidence || "Observed from page bundle analysis"}
                      </code>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: EXPLICIT EVIDENCE LIMITATIONS */}
      {limitations.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            Reported Capture Limitations
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-400">
            {limitations.map((lim, idx) => (
              <li key={idx}>
                {typeof lim === "string" ? lim : `${lim.type}: ${lim.description}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
