"use client";

import { useState, useEffect } from "react";
import { castVote, withdrawVote } from "@/lib/actions/vote.actions";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquare, Keyboard } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

import ExportCsvButton from "@/components/polls/export-csv-button";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];

export default function VotingClientUI({ 
  poll: initialPoll, 
  initialMyVote, 
  initialMyReason, 
  userId 
}: { 
  poll: any, 
  initialMyVote: string[] | null, 
  initialMyReason: string, 
  userId: string 
}) {
  const router = useRouter();
  
  // Realtime state
  const [poll, setPoll] = useState(initialPoll);
  const [currentVote, setCurrentVote] = useState<string[] | null>(initialMyVote);
  const [currentReason, setCurrentReason] = useState<string>(initialMyReason);
  
  // Input states
  const [selected, setSelected] = useState<string[]>(initialMyVote || []);
  const [reason, setReason] = useState(initialMyReason || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Realtime updates
  useEffect(() => {
    if (!initialPoll?.id) return;
    const unsubscribe = onSnapshot(doc(db, "polls", initialPoll.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setPoll((prev: any) => ({
          ...prev,
          ...data,
          options: data.options || prev.options,
          totalRespondents: data.totalRespondents || 0,
          status: data.status || prev.status,
          endAt: data.endAt?.toDate?.()?.toISOString() || prev.endAt
        }));
      }
    }, (err) => {
      console.error("Failed to listen for poll updates:", err);
    });

    return () => unsubscribe();
  }, [initialPoll?.id]);

  const isClosed = poll.status === "closed";
  const hasVoted = currentVote !== null;
  
  const canSeeResults = 
    isClosed || 
    poll.resultsVisibility === "always" ||
    (poll.resultsVisibility === "after_voting" && hasVoted) ||
    poll.creatorId === userId;

  const totalVotes = poll.totalRespondents;

  const handleToggle = (id: string) => {
    if (isClosed) return;
    if (poll.type === "single") {
      setSelected([id]);
    } else {
      setSelected(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const options = [...poll.options].sort((a: any, b: any) => a.order - b.order);

  // Keyboard Navigation: keys '1' to '9' to select options
  useEffect(() => {
    if (isClosed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent running shortcuts when typing in the reasoning text area
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      const key = e.key;
      const index = parseInt(key, 10) - 1;
      if (index >= 0 && index < options.length) {
        e.preventDefault();
        handleToggle(options[index].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, isClosed, selected]);

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await castVote(poll.id, selected, reason);
      setCurrentVote([...selected]);
      setCurrentReason(reason);
      router.refresh(); 
    } catch (e: any) {
      setError(e.message || "Failed to vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawVote = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await withdrawVote(poll.id);
      setCurrentVote(null);
      setCurrentReason("");
      setReason("");
      setSelected([]);
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Failed to withdraw vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChanged = !currentVote || 
    [...currentVote].sort().join(",") !== [...selected].sort().join(",") || 
    currentReason !== reason;

  // Chart Data preparation
  const chartData = options.map((opt: any) => ({
    name: opt.label,
    value: opt.voteCount,
  })).filter(opt => opt.value > 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-md p-3 text-xs font-mono">
          {error}
        </div>
      )}
      
      {/* Options List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-zinc-500 mb-1 px-1">
          <div className="flex items-center gap-1.5">
            <Keyboard size={12} />
            <span>Use keys <span className="font-mono text-zinc-400 font-semibold">1-{options.length}</span> to select</span>
          </div>
          {poll.type === "multi" && <span className="text-indigo-400">Multiple selection enabled</span>}
        </div>

        {options.map((opt: any, idx: number) => {
          const isSelected = selected.includes(opt.id);
          const percentage = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
          
          return (
            <div 
              key={opt.id}
              onClick={() => handleToggle(opt.id)}
              className={`relative border rounded-lg p-3 transition-all duration-150 overflow-hidden cursor-pointer ${
                isSelected 
                  ? "border-indigo-500/50 bg-indigo-500/5 text-zinc-100" 
                  : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800/30 hover:border-zinc-700 text-zinc-300"
              } ${isClosed ? "cursor-default opacity-80 hover:bg-zinc-950/40 hover:border-zinc-800" : ""}`}
            >
              {/* Modern inline percentage filler */}
              {canSeeResults && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 z-0 transition-all duration-500 ease-out" 
                  style={{ width: `${percentage}%` }} 
                />
              )}
              
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* Option keyboard shortcut badge */}
                  {!isClosed && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500">
                      {idx + 1}
                    </span>
                  )}
                  
                  {/* Selector Dot/Checkbox Box */}
                  <div className={`w-4 h-4 flex items-center justify-center border ${
                    poll.type === "single" ? "rounded-full" : "rounded"
                  } ${
                    isSelected ? "border-indigo-500 bg-indigo-500 text-zinc-950" : "border-zinc-700 bg-zinc-900"
                  }`}>
                    {isSelected && (
                      <div className={`w-1.5 h-1.5 bg-zinc-950 ${poll.type === "single" ? "rounded-full" : "rounded-sm"}`} />
                    )}
                  </div>
                  
                  <span className="text-sm font-medium">
                    {opt.label}
                  </span>
                </div>

                {canSeeResults && (
                  <div className="text-right font-mono">
                    <span className="font-semibold text-sm text-zinc-100 block">{percentage}%</span>
                    <span className="text-[10px] text-zinc-500 block">{opt.voteCount} {opt.voteCount === 1 ? 'vote' : 'votes'}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Vote Rationale / Reason */}
      {!isClosed && (
        <div className="bg-zinc-950/50 border border-zinc-850 rounded-lg p-3 space-y-2">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
            <MessageSquare size={12} />
            Reasoning / Comment (Optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add context or notes about your choice..."
            rows={2}
            className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
          />
        </div>
      )}

      {/* Render saved reason if closed/results available and they left one */}
      {hasVoted && currentReason && (
        <div className="bg-zinc-950/30 border border-zinc-850/50 rounded-lg p-3 text-xs">
          <div className="text-zinc-500 font-medium mb-1">Your Vote Reason:</div>
          <p className="text-zinc-400 italic font-sans">"{currentReason}"</p>
        </div>
      )}

      {/* Charts Visualization (Raycast Theme) */}
      {canSeeResults && chartData.length > 0 && (
        <div className="pt-6 border-t border-zinc-850 space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            Results Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {poll.type === "single" ? (
              <div className="w-full min-h-[220px] bg-zinc-950/20 border border-zinc-850 rounded-lg p-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      animationDuration={600}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#18181b" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} votes`, 'Votes']}
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                      labelStyle={{ color: '#a1a1aa' }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full min-h-[220px] bg-zinc-950/20 border border-zinc-850 rounded-lg p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      formatter={(value: any) => [`${value} votes`, 'Votes']}
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="pt-4 border-t border-zinc-850 flex justify-between items-center flex-wrap gap-4">
        <div className="text-zinc-500 text-xs flex items-center gap-3">
          {!canSeeResults && !hasVoted ? (
            <span className="text-amber-500 font-mono">VOTE REQUIRED TO VIEW RESULTS</span>
          ) : (
            <div className="flex items-center gap-3">
              <span>{totalVotes} total {totalVotes === 1 ? "voter" : "voters"}</span>
              <ExportCsvButton pollTitle={poll.title} options={poll.options} totalRespondents={totalVotes} />
            </div>
          )}
          {hasVoted && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <CheckCircle2 size={10} /> VOTED
            </span>
          )}
        </div>

        {!isClosed && (
          <div className="flex items-center gap-2">
            {hasVoted && (
              <button
                onClick={handleWithdrawVote}
                disabled={isSubmitting}
                className="bg-zinc-950 text-zinc-300 border border-zinc-800 px-3.5 py-1.5 rounded text-xs font-medium hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw Vote
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selected.length === 0 || !isChanged}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : hasVoted ? "Update Vote" : "Cast Vote"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
