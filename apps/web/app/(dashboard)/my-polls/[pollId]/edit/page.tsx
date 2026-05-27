import { adminDb } from "@/lib/firebase/admin";
import { getAuthUserId } from "@/lib/actions/poll.actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import PollManagementActions from "./management-actions";
import InviteManager from "./invite-manager";
import ShareLink from "@/components/polls/share-link";
import { getInvites } from "@/lib/actions/invite.actions";
import PollForm from "@/components/polls/poll-form";
import { getRecentPollTemplates } from "@/lib/actions/poll.actions";
import AIAnalytics from "./ai-analytics";
import { ChevronLeft } from "lucide-react";

async function getPoll(pollId: string) {
  const pollDoc = await adminDb.collection("polls").doc(pollId).get();
  if (!pollDoc.exists) return null;
  const data = pollDoc.data()!;
  return {
    id: pollDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate().toISOString(),
    updatedAt: data.updatedAt?.toDate().toISOString(),
    endAt: data.endAt?.toDate().toISOString() || null,
  };
}

export default async function PollManagementPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch {
    return <div className="text-zinc-400 text-xs font-mono p-4">Unauthorized</div>;
  }

  const poll: any = await getPoll(pollId);
  
  if (!poll) notFound();
  if (poll.creatorId !== userId) {
    return <div className="text-rose-400 text-xs font-mono p-4">Forbidden - You did not create this poll.</div>;
  }

  let invites: any[] = [];
  if (poll.visibility === "private") {
    invites = await getInvites(poll.id);
  }

  const recentPolls = await getRecentPollTemplates(6, poll.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4">
      {/* Back button */}
      <div>
        <Link 
          href="/my-polls" 
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ChevronLeft size={14} />
          Back to My Polls
        </Link>
      </div>

      {poll.status === "draft" && (
        <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 space-y-4">
          <div className="border-b border-zinc-850 pb-3">
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider font-mono">Edit Draft</h2>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              Update this draft, or load one of your recent polls as a template and save it back to this draft.
            </p>
          </div>
          <PollForm
            draftPollId={poll.id}
            recentPolls={recentPolls}
            initialData={{
              title: poll.title,
              description: poll.description || "",
              type: poll.type,
              visibility: poll.visibility,
              resultsVisibility: poll.resultsVisibility,
              endAt: poll.endAt || "",
              options: [...poll.options].sort((a: any, b: any) => a.order - b.order).map((opt: any) => ({ label: opt.label })),
              allowedEmails: poll.allowedEmails || [],
            }}
          />
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={poll.visibility === "private" ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="bg-zinc-900 p-5 rounded-lg border border-zinc-800 space-y-5 h-full">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h1 className="text-lg font-semibold text-zinc-50 tracking-tight">{poll.title}</h1>
                <p className="text-xs text-zinc-400 mt-1">{poll.description || "No description provided."}</p>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-mono font-semibold rounded uppercase border ${
                poll.status === 'draft' ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                poll.status === 'open' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}>
                {poll.status}
              </span>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-950/40 rounded border border-zinc-850">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Choice Type</span>
                <p className="font-semibold text-xs text-zinc-200 mt-1 capitalize">{poll.type}</p>
              </div>
              <div className="p-3 bg-zinc-950/40 rounded border border-zinc-850">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Visibility</span>
                <p className="font-semibold text-xs text-zinc-200 mt-1 capitalize">{poll.visibility}</p>
              </div>
              <div className="p-3 bg-zinc-950/40 rounded border border-zinc-850">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold font-mono">Total Voters</span>
                <p className="font-semibold text-xs text-zinc-200 mt-1">{poll.totalRespondents}</p>
              </div>
              <ShareLink shareToken={poll.shareToken} />
            </div>

            {/* Options display */}
            <div className="border-t border-zinc-850 pt-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">Poll Options</h3>
              <div className="space-y-2">
                {poll.options.sort((a: any, b: any) => a.order - b.order).map((opt: any) => (
                  <div key={opt.id} className="flex justify-between items-center p-3 rounded bg-zinc-950/20 border border-zinc-850 text-xs font-mono">
                    <span className="font-medium text-zinc-300">{opt.label}</span>
                    <span className="text-zinc-500">{opt.voteCount} {opt.voteCount === 1 ? 'vote' : 'votes'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {poll.visibility === "private" && (
          <div className="lg:col-span-1">
            <InviteManager pollId={poll.id} existingInvites={invites} />
          </div>
        )}
      </div>

      {/* AI Decision Insight synthesis */}
      {poll.status !== "draft" && (
        <AIAnalytics pollId={poll.id} />
      )}
      
      {/* Management Actions */}
      <PollManagementActions poll={poll} />
    </div>
  );
}
