"use client";

import { useState } from "react";
import { inviteUserByEmail, revokeInvite } from "@/lib/actions/invite.actions";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Mail, UserMinus } from "lucide-react";

export default function InviteManager({ pollId, existingInvites = [] }: { pollId: string, existingInvites?: any[] }) {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: "success" | "error", text: string} | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    
    setIsLoading(true);
    setMessage(null);
    try {
      const emails = inputVal.split(',').map(e => e.trim()).filter(Boolean);
      let successCount = 0;
      let errorCount = 0;
      
      for (const email of emails) {
        try {
          await inviteUserByEmail(pollId, email);
          successCount++;
        } catch (err: any) {
          if (err.message !== "User is already invited") {
             errorCount++;
          }
        }
      }
      
      if (successCount > 0) {
        setMessage({ type: "success", text: `Invited ${successCount} user(s).${errorCount > 0 ? ` Failed to invite ${errorCount}.` : ''}` });
        setInputVal("");
        router.refresh();
      } else {
        setMessage({ type: "error", text: "Failed to invite. Ensure the email addresses are valid registered users." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to invite" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) return;
    
    setIsLoading(true);
    setMessage(null);
    try {
      await revokeInvite(pollId, userId);
      setMessage({ type: "success", text: "Invitation revoked successfully." });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to revoke" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
        <Mail size={14} className="text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">Invite Participants</h3>
      </div>
      
      {message && (
        <div className={`p-2.5 rounded text-xs font-mono flex items-start gap-1.5 border ${
          message.type === 'error' 
            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        }`}>
          {message.type === 'error' ? <AlertCircle size={14} className="shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleInvite} className="flex gap-2">
        <input 
          type="text" 
          placeholder="user@example.com, another@example.com" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 text-xs bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
          required
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputVal.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-mono font-medium transition-colors shrink-0"
        >
          Invite
        </button>
      </form>

      {existingInvites.length > 0 && (
        <div className="mt-2 border-t border-zinc-850 pt-4 space-y-3">
          <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
            Invited Users ({existingInvites.length})
          </h4>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
            {existingInvites.map((invite) => (
              <div key={invite.id} className="flex justify-between items-center bg-zinc-950/40 p-2 rounded border border-zinc-850 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-zinc-200 truncate">{invite.userName || "Unknown"}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{invite.userEmail}</div>
                  <div className="text-[9px] text-zinc-600 mt-0.5">
                    Invited {invite.invitedAt ? format(new Date(invite.invitedAt), "PPP p") : "recently"}
                  </div>
                </div>
                <button 
                  onClick={() => handleRevoke(invite.id)}
                  disabled={isLoading}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded transition-colors shrink-0"
                  title="Revoke Invite"
                >
                  <UserMinus size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
