import { adminDb } from "@/lib/firebase/admin";
import { getAuthUserId } from "@/lib/actions/poll.actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Users, Clock, Mail } from "lucide-react";

async function getSharedPolls(userId: string, page: number) {
  const pageSize = 20;
  const baseQuery = adminDb
    .collection("polls")
    .where("inviteeIds", "array-contains", userId)
    .orderBy("createdAt", "desc");

  const snapshot = await baseQuery.get();

  const polls = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        creatorName: data.creatorName || "Anonymous",
        totalRespondents: data.totalRespondents || 0,
        createdAt: data.createdAt?.toDate(),
        status: data.status,
      };
    })
    .filter((poll) => poll.status === "open" || poll.status === "closed");

  const totalCount = polls.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    polls: polls.slice(start, start + pageSize),
    currentPage: safePage,
    totalPages,
    totalCount,
  };
}

export default async function SharedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch (error) {
    return <div className="text-zinc-400 text-sm">Unauthorized. Please log in again.</div>;
  }

  const params = await searchParams;
  const page = Number(params.page || "1");
  const { polls, currentPage, totalPages, totalCount } = await getSharedPolls(userId, page);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Shared with me</h1>
        <p className="text-xs text-zinc-400 mt-1">Private decisions you have been explicitly invited to participate in.</p>
        <p className="text-[10px] text-zinc-500 font-semibold mt-2">{totalCount} visible invite{totalCount === 1 ? "" : "s"}</p>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/10 rounded-xl border border-dashed border-zinc-800">
          <Mail size={32} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-300">No shared decisions</h3>
          <p className="text-xs text-zinc-500 mt-1">When someone invites you to a private poll, it will appear here.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {polls.map((poll) => (
              <Link
                key={poll.id}
                href={`/poll/${poll.id}`}
                className="bg-zinc-900/20 group overflow-hidden border border-zinc-900 rounded-xl hover:border-zinc-850 hover:bg-zinc-900/35 transition flex flex-col"
              >
                <div className="p-5 flex-1 relative">
                  <div className="mb-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-full ${
                      poll.status === "open" ? "bg-green-950/50 text-green-400 border border-green-900/40" :
                      poll.status === "closed" ? "bg-red-950/50 text-red-400 border border-red-900/40" :
                      "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
                    }`}>
                      {poll.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100 leading-tight mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {poll.title}
                  </h3>
                  {poll.description && (
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
                  <div className="text-[10px] text-zinc-500 mt-2 font-medium">Invited by {poll.creatorName}</div>
                </div>

                <div className="px-5 py-3 bg-zinc-900/30 border-t border-zinc-900/60 flex items-center justify-between mt-auto">
                  <div className="flex items-center text-xs text-zinc-400 font-medium">
                    <Users size={12} className="mr-1.5 text-zinc-500" />
                    <span className="text-zinc-200 font-bold mr-1">{poll.totalRespondents}</span> votes
                  </div>
                  <div className="flex items-center text-xs text-zinc-500">
                    <Clock size={11} className="mr-1" />
                    {poll.createdAt && formatDistanceToNow(poll.createdAt, { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Link
                href={`/shared?page=${Math.max(1, currentPage - 1)}`}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  currentPage === 1
                    ? "pointer-events-none border-zinc-900 text-zinc-700"
                    : "border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-850"
                }`}
              >
                Previous
              </Link>
              <span className="text-xs text-zinc-500">
                Page {currentPage} of {totalPages}
              </span>
              <Link
                href={`/shared?page=${Math.min(totalPages, currentPage + 1)}`}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                  currentPage === totalPages
                    ? "pointer-events-none border-zinc-900 text-zinc-700"
                    : "border-zinc-800 text-zinc-300 bg-zinc-900 hover:bg-zinc-850"
                }`}
              >
                Next
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
