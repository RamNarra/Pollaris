"use client";

import { useState } from "react";
import { Sparkles, Loader, AlertTriangle, MessageSquareCode } from "lucide-react";

export default function AIAnalytics({ pollId }: { pollId: string }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pollId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate report");
      }

      const data = await res.json();
      setReport(data.analytics);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-semibold text-zinc-50">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return <h4 key={i} className="text-xs font-semibold text-zinc-200 mt-4 mb-1.5 uppercase font-mono">{trimmed.replace("### ", "")}</h4>;
      }
      if (trimmed.startsWith("## ")) {
        return <h3 key={i} className="text-sm font-semibold text-zinc-100 mt-5 mb-2 border-b border-zinc-800 pb-1 uppercase font-mono">{trimmed.replace("## ", "")}</h3>;
      }
      if (trimmed.startsWith("# ")) {
        return <h2 key={i} className="text-base font-bold text-zinc-50 mt-6 mb-3 font-mono">{trimmed.replace("# ", "")}</h2>;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const content = trimmed.replace(/^[-*]\s+/, "");
        return (
          <li key={i} className="ml-4 list-disc text-xs text-zinc-350 mb-1 leading-relaxed">
            {parseBold(content)}
          </li>
        );
      }
      if (trimmed === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-xs text-zinc-350 leading-relaxed mb-2">{parseBold(line)}</p>;
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
      <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={16} />
          <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">
            AI Decision Insights
          </h3>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3.5 py-1.5 rounded font-mono font-medium flex items-center gap-1.5 transition-colors"
        >
          {loading ? (
            <>
              <Loader size={12} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <MessageSquareCode size={12} />
              Generate Summary
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded text-xs font-mono">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {report ? (
        <div className="bg-zinc-950/40 border border-zinc-850 rounded-lg p-4 font-sans select-text">
          {renderMarkdown(report)}
        </div>
      ) : (
        !loading && (
          <p className="text-xs text-zinc-500 text-center py-6">
            Run AI synthesis on voter feedback and aggregate metrics to extract sentiment clusters, anomalies, and outcome summaries.
          </p>
        )
      )}

      {loading && (
        <div className="bg-zinc-950/20 border border-zinc-850/50 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3">
          <Loader className="text-zinc-500 animate-spin" size={24} />
          <div className="text-center space-y-0.5">
            <p className="text-xs text-zinc-400 font-mono">Aggregating vote counts & comments...</p>
            <p className="text-[10px] text-zinc-600 font-mono">Invoking Gemini LLM semantic feedback parser</p>
          </div>
        </div>
      )}
    </div>
  );
}
