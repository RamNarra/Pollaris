import { adminDb } from "@/lib/firebase/admin";
import { getAuthUserId } from "@/lib/actions/poll.actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BarChart2, Users, FileLock2, Globe, Clock, CheckCircle2 } from "lucide-react";

async function getMyPolls(userId: string, page: number) {
  const pageSize = 20;
  const baseQuery = adminDb
    .collection("polls")
    .where("creatorId", "==", userId)
    .orderBy("createdAt", "desc");

  const countSnap = await baseQuery.count().get();
  const totalCount = countSnap.data().count;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  const snapshot = await baseQuery.offset(start).limit(pageSize).get();

  const polls = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      status: data.status,
      visibility: data.visibility,
      totalRespondents: data.totalRespondents || 0,
      createdAt: data.createdAt?.toDate(),
      endAt: data.endAt?.toDate() || null,
    };
  });

  return {
    polls,
    currentPage: safePage,
    totalPages,
    totalCount,
  };
}

export default async function MyPollsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  let userId: string;
  try {
    userId = await getAuthUserId();
  } catch (error) {
    return <div className="text-zinc-400 text-sm">Unauthorized. Please log in again.</div>;
  }

  const params = await searchParams;
  const page = Number(params.page || "1");
  const { polls, currentPage, totalPages, totalCount } = await getMyPolls(userId, page);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900/30 p-6 rounded-xl border border-zinc-900">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">My Polls</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage and track your active, draft, and closed polls.</p>
          <p className="text-[10px] text-zinc-500 font-semibold mt-2">{totalCount} total poll{totalCount === 1 ? "" : "s"}</p>
        </div>
        <Link
          href="/my-polls/create"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25"
        >
          Create Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/10 rounded-xl border border-dashed border-zinc-800">
          <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800">
            <BarChart2 size={20} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">No polls yet</h3>
          <p className="mt-1 text-xs text-zinc-500 mb-6">Create your first poll to start gathering feedback from your audience.</p>
          <Link
            href="/my-polls/create"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
          >
            + Create your first poll
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {polls.map((poll) => (
              <Link
                key={poll.id}
                href={`/my-polls/${poll.id}/edit`}
                className="bg-zinc-900/20 group overflow-hidden border border-zinc-900 rounded-xl hover:border-zinc-850 hover:bg-zinc-900/35 transition flex flex-col"
              >
                <div className="p-5 flex-1 relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      {poll.status === "open" && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-950/50 text-green-400 border border-green-900/40"><CheckCircle2 size={11} className="mr-1" /> Active</span>}
                      {poll.status === "draft" && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">Draft</span>}
                      {poll.status === "closed" && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/50 text-red-400 border border-red-900/40">Closed</span>}

                      {poll.visibility === "public" ? (
                        <span className="inline-flex items-center text-[10px] font-medium text-zinc-400" title="Publicly accessible via share link">
                          <Globe size={12} className="mr-1" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-zinc-400" title="Invitation only">
                          <FileLock2 size={12} className="mr-1" /> Private
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-100 leading-tight mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                    {poll.title}
                  </h3>

                  {poll.description && (
                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">
                      {poll.description}
                    </p>
                  )}
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
                href={`/my-polls?page=${Math.max(1, currentPage - 1)}`}
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
                href={`/my-polls?page=${Math.min(totalPages, currentPage + 1)}`}
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
