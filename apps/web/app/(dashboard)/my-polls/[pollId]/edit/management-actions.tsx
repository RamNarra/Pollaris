"use client";

import { useState } from "react";
import { publishPoll, closePoll, deleteDraft, extendPoll } from "@/lib/actions/poll.actions";
import { useRouter } from "next/navigation";
import { Rocket, Trash2, ShieldAlert, Clock, Link, Check, AlertTriangle } from "lucide-react";

export default function PollManagementActions({ poll }: { poll: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEndAt, setNewEndAt] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleAction = async (action: () => Promise<any>, redirect?: string, confirmText?: string) => {
    if (!confirmText || confirm(confirmText)) {
      setIsLoading(true);
      setError(null);
      try {
        await action();
        if (redirect) {
          router.push(redirect);
        } else {
          router.refresh();
        }
      } catch (err: any) {
        setError(err.message || "Action failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${poll.shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
        <ShieldAlert size={14} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">Management Actions</h3>
      </div>
      
      {error && (
        <div className="text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded p-2.5 text-xs font-mono flex items-center gap-1.5">
          <AlertTriangle size={12} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        {poll.status === "draft" && (
          <>
            <button 
              onClick={() => handleAction(() => publishPoll(poll.id), undefined, "Are you sure you want to publish this poll? Once published, voting options cannot be altered.")}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-mono font-medium px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Rocket size={12} />
              Publish Poll
            </button>
            <button 
              onClick={() => handleAction(() => deleteDraft(poll.id), '/my-polls', "Are you sure you want to permanently delete this draft?")}
              disabled={isLoading}
              className="bg-zinc-950 text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 disabled:opacity-50 text-xs font-mono font-medium px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              Delete Draft
            </button>
          </>
        )}

        {poll.status === "open" && (
          <div className="flex flex-wrap gap-4 items-center w-full justify-between">
            <button 
              onClick={() => handleAction(() => closePoll(poll.id), undefined, "Are you sure you want to close this poll? This will end all voting and lock the results.")}
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-mono font-medium px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert size={12} />
              Close Polling
            </button>
            <div className="flex bg-zinc-950 border border-zinc-800 rounded p-1 items-center gap-2 max-w-full">
              <span className="text-[10px] text-zinc-500 font-mono pl-1 uppercase">EXTEND DEADLINE</span>
              <input 
                type="datetime-local" 
                value={newEndAt} 
                onChange={(e) => setNewEndAt(e.target.value)} 
                className="text-xs bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100 outline-none focus:border-zinc-700 font-mono"
              />
              <button 
                onClick={() => handleAction(() => extendPoll(poll.id, newEndAt))}
                disabled={isLoading || !newEndAt}
                className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-semibold px-3 py-1 text-zinc-300 rounded hover:bg-zinc-850 hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {(poll.status === "open" || poll.status === "closed") && (
          <button 
            onClick={handleCopyLink}
            className="bg-zinc-950 text-zinc-300 border border-zinc-800 hover:bg-zinc-850 text-xs font-mono font-medium px-4 py-2 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                Copied Link!
              </>
            ) : (
              <>
                <Link size={12} />
                Copy Share Link
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
