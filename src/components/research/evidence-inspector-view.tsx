"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  FileCode2,
  Eye,
  Compass,
  ArrowLeft,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  Video,
  Box,
  BookmarkCheck,
  ExternalLink,
  Save,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { FactsVsHeuristics } from "./facts-vs-heuristics";
import { SafeDomViewer } from "./safe-dom-viewer";

interface ResearchSessionData {
  id: string;
  targetUrl: string;
  targetDomain: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  evidenceId?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  projectId?: string | null;
  industry?: string | null;
  selectedFindingsJson?: string;
}

interface EvidenceInspectorViewProps {
  session: ResearchSessionData;
}

export function EvidenceInspectorView({ session }: EvidenceInspectorViewProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "dom" | "a11y" | "media" | "blueprint">("summary");
  const [summaryData, setSummaryData] = useState<any>(null);
  const [domData, setDomData] = useState<string>("");
  const [a11yData, setA11yData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFindings, setSelectedFindings] = useState<string[]>(() => {
    if (session.selectedFindingsJson) {
      try {
        return JSON.parse(session.selectedFindingsJson);
      } catch {}
    }
    return [];
  });
  const [savingFindings, setSavingFindings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initial load
  useEffect(() => {
    // Fallback to localStorage if state had empty array
    if (selectedFindings.length === 0) {
      const saved = localStorage.getItem(`rea_findings_${session.id}`);
      if (saved) {
        try {
          setSelectedFindings(JSON.parse(saved));
        } catch {}
      }
    }

    // 2. Fetch evidence slices
    async function loadEvidence() {
      try {
        setLoading(true);

        // Fetch summary
        const summaryRes = await fetch(`/api/intelligence/research/${session.id}/evidence?slice=summary`);
        if (summaryRes.ok) {
          const json = await summaryRes.json();
          setSummaryData(json.data || {});

          // If server has stored selectedFindings, sync it
          if (Array.isArray(json.data?.selectedFindings) && json.data.selectedFindings.length > 0) {
            setSelectedFindings(json.data.selectedFindings);
          }
        }

        // Fetch DOM
        const domRes = await fetch(`/api/intelligence/research/${session.id}/evidence?slice=dom`);
        if (domRes.ok) {
          const json = await domRes.json();
          setDomData(json.data?.domText || json.data?.dom || "");
        }

        // Fetch Accessibility
        const a11yRes = await fetch(`/api/intelligence/research/${session.id}/evidence?slice=accessibility`);
        if (a11yRes.ok) {
          const json = await a11yRes.json();
          setA11yData(json.data?.accessibilityText || json.data?.accessibility || {});
        }
      } catch (e) {
        console.error("Failed to load evidence details", e);
      } finally {
        setLoading(false);
      }
    }

    if (session.status === "COMPLETED") {
      loadEvidence();
    } else {
      setLoading(false);
    }
  }, [session.id, session.status, session.selectedFindingsJson]);

  // Sync to database and local storage whenever findings change
  const persistFindings = async (updated: string[]) => {
    setSelectedFindings(updated);
    localStorage.setItem(`rea_findings_${session.id}`, JSON.stringify(updated));

    try {
      setSavingFindings(true);
      const res = await fetch(`/api/intelligence/research/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedFindings: updated }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (e) {
      console.error("Failed to persist findings to database", e);
    } finally {
      setSavingFindings(false);
    }
  };

  const toggleFinding = (finding: string) => {
    let updated: string[];
    if (selectedFindings.includes(finding)) {
      updated = selectedFindings.filter((f) => f !== finding);
    } else {
      updated = [...selectedFindings, finding];
    }
    persistFindings(updated);
  };

  return (
    <div className="space-y-6">
      {/* NAVIGATION & METADATA BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href="/research"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Research Studio</span>
            </Link>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-indigo-400">
              Session ID: {session.id.substring(0, 14)}...
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>{session.targetDomain}</span>
            </h1>
            <span
              className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                session.status === "COMPLETED"
                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  : session.status === "RUNNING"
                  ? "bg-amber-950 text-amber-400 border border-amber-800 animate-pulse"
                  : "bg-red-950 text-red-400 border border-red-800"
              }`}
            >
              {session.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <a
              href={session.targetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-indigo-400 transition-colors"
            >
              <span>{session.targetUrl}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            {session.evidenceId && (
              <span className="font-mono text-slate-500">
                Evidence: {session.evidenceId}
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500" suppressHydrationWarning>
              <Clock className="h-3 w-3" />
              {session.createdAt ? new Date(session.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""}
            </span>
          </div>
        </div>

        {/* BLUEPRINT SELECTION STATUS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Selected Findings:</span>{" "}
            <span className="font-bold text-indigo-400">{selectedFindings.length}</span>
            {savingFindings ? (
              <span className="text-[10px] text-amber-400 animate-pulse">(Saving...)</span>
            ) : savedSuccess ? (
              <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                <CheckCircle className="h-2.5 w-2.5" /> Persisted
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("blueprint")}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20"
          >
            <BookmarkCheck className="h-4 w-4" />
            <span>View Staged Findings ({selectedFindings.length})</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Facts & Heuristics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dom")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "dom"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          <span>Safe DOM Structure</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("a11y")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "a11y"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Accessibility Tree</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "media"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Video className="h-4 w-4" />
          <span>Media & 3D Signals</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blueprint")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
            activeTab === "blueprint"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/40"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Blueprint Staging ({selectedFindings.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {loading ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <div className="h-8 w-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading captured evidence from secure storage...</p>
        </div>
      ) : session.status === "FAILED" ? (
        <div className="p-8 rounded-2xl bg-red-950/20 border border-red-900/60 text-center space-y-3">
          <AlertCircle className="h-8 w-8 mx-auto text-red-400" />
          <p className="text-sm font-semibold text-red-300">Research Analysis Failed</p>
          <p className="text-xs text-red-400/80 font-mono max-w-lg mx-auto">
            {session.errorMessage || "Headless REA execution failed."}
          </p>
        </div>
      ) : (
        <div>
          {/* TAB 1: SUMMARY (FACTS VS HEURISTICS) */}
          {activeTab === "summary" && (
            <FactsVsHeuristics
              summary={summaryData || {}}
              selectedFindings={selectedFindings}
              onToggleFinding={toggleFinding}
            />
          )}

          {/* TAB 2: SAFE DOM VIEWER */}
          {activeTab === "dom" && (
            <SafeDomViewer rawDom={domData} sourceUrl={session.targetUrl} />
          )}

          {/* TAB 3: ACCESSIBILITY TREE */}
          {activeTab === "a11y" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 mb-2">
                  Captured Accessibility Tree
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Deterministic accessibility snapshot captured at scroll stabilization. Shows landmark roles and content structure.
                </p>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px]">
                  <code>
                    {typeof a11yData === "string"
                      ? a11yData
                      : JSON.stringify(a11yData, null, 2)}
                  </code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA & 3D SIGNALS */}
          {activeTab === "media" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-slate-200">3D & WebGL Capabilities</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleFinding(
                        `3D Requirement: ${
                          summaryData?.observedFacts?.hasCanvas ? "Interactive WebGL Canvas" : "Standard 2D"
                        }`
                      )
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    + Stage for Blueprint
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {summaryData?.observedFacts?.hasCanvas
                    ? "Interactive HTML5 <canvas> element observed in the captured DOM. WebGL shader or 3D scene engine likely active."
                    : "No HTML5 canvas element was detected on the initial or scrolled page."}
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Status: {summaryData?.observedFacts?.hasCanvas ? "3D / Canvas Active" : "No 3D Elements"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-pink-400" />
                    <h3 className="text-sm font-semibold text-slate-200">Video & Cinematic Media</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      toggleFinding(
                        `Media Requirement: ${
                          summaryData?.observedFacts?.hasVideo ? "Cinematic Video Sequences" : "Static Media"
                        }`
                      )
                    }
                    className="text-xs text-pink-400 hover:text-pink-300 font-medium"
                  >
                    + Stage for Blueprint
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {summaryData?.observedFacts?.hasVideo
                    ? "HTML5 <video> elements observed. Suggests cinematic hero or background storytelling media."
                    : "No HTML5 video elements were detected on this page."}
                </p>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Status: {summaryData?.observedFacts?.hasVideo ? "Video Storytelling Active" : "No HTML5 Video"}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BLUEPRINT STAGING */}
          {activeTab === "blueprint" && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-indigo-400" />
                    <span>Curated Findings Staged for Design Blueprint</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    These approved observations are permanently stored in the research database and will inform the Blueprint Engine.
                  </p>
                </div>
              </div>

              {selectedFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                  <p>No findings selected yet.</p>
                  <p className="text-slate-600">
                    Switch to the "Facts & Heuristics" tab or "Media & 3D Signals" tab and click the "+" button to stage findings.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-slate-100">{finding}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleFinding(finding)}
                        className="px-2.5 py-1 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
