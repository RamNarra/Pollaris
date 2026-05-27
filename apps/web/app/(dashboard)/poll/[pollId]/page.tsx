import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getAuthUserId, pollCanBeViewedByUser, PollRecord } from "@/lib/actions/poll.actions";
import { notFound } from "next/navigation";
import VotingClientUI from "./voting-client";

function resolveEndAt(value: PollRecord["endAt"]) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if ("toDate" in value && typeof value.toDate === "function") return value.toDate();
  return null;
}

function resolveTimestamp(value?: { toDate?: () => Date }) {
  if (!value || typeof value.toDate !== "function") return null;
  return value.toDate();
}

async function getPollAndVote(pollId: string) {
  let userId: string | null = null;
  let userEmail: string | null = null;
  try {
    userId = await getAuthUserId();
    if (userId) {
      const userRecord = await adminAuth.getUser(userId);
      userEmail = userRecord.email || null;
    }
  } catch {
    // Unauthenticated request
  }

  const pollDoc = await adminDb.collection("polls").doc(pollId).get();
  if (!pollDoc.exists) return null;
  
  const pollData = pollDoc.data() as PollRecord;
  const endAt = resolveEndAt(pollData.endAt);
  
  // Auto-close check (FR14)
  if (pollData.status === "open" && endAt && endAt < new Date()) {
    pollData.status = "closed";
    // Fire and forget
    adminDb.collection("polls").doc(pollId).update({ status: "closed" }).catch(() => {});
  }

  // Access check
  if (!userId || !(await pollCanBeViewedByUser(pollData, userId, userEmail))) {
    return { status: "forbidden" };
  }

  // Strip sensitive PII before sending to the client (Fixes FR31/PII Leak)
  const { allowedEmails, inviteeIds, ...safePollData } = pollData;

  const poll = {
    id: pollDoc.id,
    ...safePollData,
    createdAt: resolveTimestamp(pollData.createdAt)?.toISOString(),
    updatedAt: resolveTimestamp(pollData.updatedAt)?.toISOString(),
    endAt: endAt?.toISOString() || null,
  };

  let myVote = null;
  let myReason = "";
  if (userId) {
    const voteDoc = await adminDb.collection("polls").doc(pollId).collection("votes").doc(userId).get();
    if (voteDoc.exists) {
      const voteData = voteDoc.data()!;
      myVote = voteData.selectedOptionIds;
      myReason = voteData.reason || "";
    }
  }

  return { status: "ok", poll, myVote, myReason, userId };
}

export default async function PollDetailPage({ params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params;
  const result: any = await getPollAndVote(pollId);
  
  if (!result) {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-zinc-950 p-6 rounded-lg border border-red-500/20 shadow-lg">
          <h1 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            This is a private poll and you are not on the guest list. Please ask the creator to invite your email address if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  const { poll, myVote, myReason, userId } = result;

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-xl">
        <div className="mb-6 pb-6 border-b border-zinc-850 flex justify-between items-start gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded uppercase tracking-wide border ${
                poll.status === 'open' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                poll.status === 'closed' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              }`}>
                {poll.status}
              </span>
              <span className="text-xs text-zinc-500">
                Created by <span className="font-mono text-zinc-300">{poll.creatorName}</span>
              </span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">{poll.title}</h1>
            {poll.description && (
              <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed mt-1">{poll.description}</p>
            )}
          </div>
          {poll.endAt && (
            <div className="text-right text-xs text-zinc-500 font-mono">
              <div>DEADLINE</div>
              <div className="text-zinc-300 mt-1">{new Date(poll.endAt).toLocaleDateString()}</div>
            </div>
          )}
        </div>

        {poll.status === "draft" && userId !== poll.creatorId ? (
          <div className="text-center text-zinc-500 py-12 bg-zinc-950 rounded-lg border border-zinc-850 border-dashed text-sm">
            This poll has not been published yet.
          </div>
        ) : (
          <VotingClientUI poll={poll} initialMyVote={myVote} initialMyReason={myReason} userId={userId} />
        )}
      </div>
    </div>
  );
}
