"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Layers,
} from "lucide-react";

interface ResearchSessionItem {
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
}

const INDUSTRY_PACKS = [
  "Healthcare",
  "Hotels & Banquets",
  "Schools & Coaching",
  "Food & Restaurants",
  "Fitness & Sports",
  "Salon & Beauty",
];

export function ResearchStudioView() {
  const [sessions, setSessions] = useState<ResearchSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUrl, setTargetUrl] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("Hotels & Banquets");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastCompletedId, setLastCompletedId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/intelligence/research");
      if (res.ok) {
        const json = await res.json();
        setSessions(json.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => {
      // If there are running sessions, poll periodically
      fetchSessions();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError("Please enter a valid website URL.");
      return;
    }

    try {
      setLaunching(true);
      const res = await fetch("/api/intelligence/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: trimmed,
          industry: selectedIndustry,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start research session");
      }

      setSuccessMsg(`Research analysis completed for ${data.data?.targetDomain || trimmed}!`);
      if (data.data?.id) {
        setLastCompletedId(data.data.id);
      }
      setTargetUrl("");
      await fetchSessions();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during research launch.");
    } finally {
      setLaunching(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this research session and purge its evidence files?")) {
      return;
    }

    try {
      const res = await fetch(`/api/intelligence/research/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete session");
      }
    } catch (err: any) {
      alert(err.message || "Network error deleting session");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Compass className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Phase 4.0 Research Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Research Studio</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Analyze reference websites via REA under sandboxed egress protection. Extract deterministic facts,
            isolate probabilistic heuristics, inspect safe DOM trees, and curate design blueprints.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Egress Proxy Enforced (SSRF Protected)</span>
        </div>
      </div>

      {/* LAUNCH NEW RESEARCH FORM */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Launch Reference Website Analysis</span>
        </h2>

        <form onSubmit={handleLaunch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Target Website URL (HTTP/HTTPS)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={launching}
                  className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Enter a public website URL. Internal loopback, private RFC 1918, and link-local destinations are strictly blocked.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Target Industry Category Pack
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {INDUSTRY_PACKS.map((pack) => (
                  <button
                    key={pack}
                    type="button"
                    onClick={() => setSelectedIndustry(pack)}
                    disabled={launching}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left truncate ${
                      selectedIndustry === pack
                        ? "bg-indigo-600 text-white shadow-sm font-semibold"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {pack}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {launching && (
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-indigo-300 flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                  REA Sandboxed Chromium Execution Active
                </span>
                <span className="text-slate-500 font-mono">Analyzing Target...</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-400 h-1.5 rounded-full animate-pulse w-3/4" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400">✓ SSRF Guard</span>
                <span className="text-indigo-300">● Egress Proxy</span>
                <span>○ DOM Extract</span>
                <span>○ Facts & Heuristics</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              {lastCompletedId && (
                <Link
                  href={`/research/${lastCompletedId}`}
                  className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs transition-colors shrink-0"
                >
                  Inspect Evidence →
                </Link>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={launching || !targetUrl.trim()}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {launching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Executing Sandboxed Research...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Start Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* SESSIONS CATALOG */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>Research Sessions History</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400">
              {sessions.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={fetchSessions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl">
            Loading research sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl space-y-3">
            <Compass className="h-10 w-10 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-300">No Research Sessions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Launch an analysis above on an industry reference site (e.g. cuberto.com, aman.com) to observe and curate design intelligence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-900 hover:bg-slate-900/80 border border-slate-800 transition-all gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-100">
                      {session.targetDomain}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        session.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800/60"
                          : session.status === "RUNNING"
                          ? "bg-amber-950 text-amber-400 border border-amber-800/60 animate-pulse"
                          : "bg-red-950 text-red-400 border border-red-800/60"
                      }`}
                    >
                      {session.status}
                    </span>
                    {session.industry && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {session.industry}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="truncate max-w-md">{session.targetUrl}</span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]" suppressHydrationWarning>
                      <Clock className="h-3 w-3" />
                      {session.createdAt ? new Date(session.createdAt).toISOString().replace("T", " ").substring(0, 19) : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/research/${session.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-lg transition-colors"
                  >
                    <span>Inspect Evidence</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(session.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

