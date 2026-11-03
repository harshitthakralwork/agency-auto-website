"use client";

import React, { useState, useMemo } from "react";
import { Search, Copy, Check, ShieldAlert, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface SafeDomViewerProps {
  rawDom: string;
  sourceUrl?: string;
}

export function SafeDomViewer({ rawDom, sourceUrl }: SafeDomViewerProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [lineLimit, setLineLimit] = useState(1000);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawDom);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute safe non-executable tag counts directly from text without parsing HTML
  const tagSummary = useMemo(() => {
    if (!rawDom) return [];
    const tagsToCheck = ["canvas", "video", "header", "nav", "main", "footer", "section", "form", "svg"];
    return tagsToCheck
      .map((tag) => {
        const regex = new RegExp(`<${tag}[\\s>]`, "gi");
        const count = (rawDom.match(regex) || []).length;
        return { tag, count };
      })
      .filter((t) => t.count > 0);
  }, [rawDom]);

  // Safe slicing and filtering without regex execution vulnerability
  const allLines = useMemo(() => {
    if (!rawDom) return [];
    return rawDom.split("\n");
  }, [rawDom]);

  const filteredLines = useMemo(() => {
    if (!filterQuery.trim()) return allLines;
    const lower = filterQuery.toLowerCase();
    return allLines.filter((line) => line.toLowerCase().includes(lower));
  }, [allLines, filterQuery]);

  const visibleLines = filteredLines.slice(0, lineLimit);
  const hasMore = filteredLines.length > lineLimit;

  return (
    <div className="space-y-4">
      {/* SECURITY BANNER */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <span className="font-semibold text-amber-200">Untrusted Content Sandbox:</span>{" "}
          Captured DOM is rendered strictly as inert, escaped text inside an isolated preformatted block.
          Scripts, style sheets, and external embeds are never parsed into DOM nodes or executed.
        </div>
      </div>

      {/* DETECTED STRUCTURAL TAG METRICS */}
      {tagSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1.5 mr-2">
            <FileText className="h-3.5 w-3.5 text-indigo-400" />
            Detected Structural Tags:
          </span>
          {tagSummary.map((item) => (
            <span
              key={item.tag}
              className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]"
            >
              &lt;{item.tag}&gt; <strong className="text-indigo-400">{item.count}</strong>
            </span>
          ))}
        </div>
      )}

      {/* FILTER & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => {
              setFilterQuery(e.target.value);
              setLineLimit(1000); // reset page on filter change
            }}
            placeholder="Filter DOM lines by tag, class, id, or text..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Copied Raw DOM</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-slate-400" />
              <span>Copy Raw DOM</span>
            </>
          )}
        </button>
      </div>

      {/* INERT DOM TEXT CONTAINER */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <span>SOURCE: {sourceUrl || "Captured Website DOM"}</span>
          <span>
            Showing {visibleLines.length.toLocaleString()} of {filteredLines.length.toLocaleString()} lines (
            {rawDom.length.toLocaleString()} chars)
          </span>
        </div>

        <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-300 max-h-[550px] leading-relaxed selection:bg-indigo-900 selection:text-indigo-200">
          <code>{visibleLines.join("\n") || "No matching lines found for query."}</code>
        </pre>

        {hasMore && (
          <div className="p-3 border-t border-slate-800 bg-slate-900/80 text-center">
            <button
              type="button"
              onClick={() => setLineLimit((prev) => prev + 1000)}
              className="px-4 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 rounded-lg transition-colors border border-indigo-900/60"
            >
              Load Next 1,000 Lines ({filteredLines.length - visibleLines.length} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
