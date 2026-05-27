import { adminDb } from "@/lib/firebase/admin";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowDownAZ, ArrowUpAZ, Clock, Filter, Users, Vote } from "lucide-react";

type FeedStatus = "all" | "open" | "closed";
type FeedSort = "createdAt" | "endAt" | "totalRespondents";
type FeedOrder = "asc" | "desc";

async function getPublicFeed(status: FeedStatus, sortBy: FeedSort, order: FeedOrder, page: number) {
  const pageSize = 20;
  let query = adminDb.collection("polls").where("visibility", "==", "public");

  if (status !== "all") {
    query = query.where("status", "==", status);
  } else {
    // Exclude drafts
    query = query.where("status", "in", ["open", "closed"]);
  }

  query = query.orderBy(sortBy, order);

  const countSnap = await query.count().get();
  const totalCount = countSnap.data().count;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  const snapshot = await query.offset(start).limit(pageSize).get();

  const polls = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      creatorName: data.creatorName || "Anonymous",
      totalRespondents: data.totalRespondents || 0,
      createdAt: data.createdAt?.toDate() || null,
      endAt: data.endAt?.toDate() || null,
      status: data.status as "draft" | "open" | "closed",
    };
  });

  return {
    polls,
    currentPage: safePage,
    totalPages,
    totalCount,
  };
}

function buildFeedHref(status: FeedStatus, sortBy: FeedSort, order: FeedOrder, page: number) {
  const params = new URLSearchParams({
    status,
    sort: sortBy,
    order,
    page: String(page),
  });

  return `/feed?${params.toString()}`;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: FeedStatus; sort?: FeedSort; order?: FeedOrder; page?: string }>;
}) {
  const params = await searchParams;
  const status: FeedStatus = params.status === "open" || params.status === "closed" ? params.status : "all";
  const sortBy: FeedSort =
    params.sort === "endAt" || params.sort === "totalRespondents" ? params.sort : "createdAt";
  const order: FeedOrder = params.order === "asc" ? "asc" : "desc";
  const page = Number(params.page || "1");

  const { polls, currentPage, totalPages, totalCount } = await getPublicFeed(status, sortBy, order, page);

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900/30 p-6 rounded-xl border border-zinc-900">
        <h1 className="text-xl font-bold tracking-tight text-zinc-100">Public Feed</h1>
        <p className="text-xs text-zinc-400 mt-1">Browse and search decisions open to the public.</p>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-900 rounded-xl p-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Status</label>
            <div className="flex gap-1.5">
              {(["all", "open", "closed"] as FeedStatus[]).map((value) => (
                <Link
                  key={value}
                  href={buildFeedHref(value, sortBy, order, 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors ${
                    status === value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Sort By</label>
            <div className="flex gap-1.5 flex-wrap">
              {([
                ["createdAt", "Created"],
                ["endAt", "Expiry"],
                ["totalRespondents", "Votes"],
              ] as [FeedSort, string][]).map(([value, label]) => (
                <Link
                  key={value}
                  href={buildFeedHref(status, value, order, 1)}
                  className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors ${
                    sortBy === value
                      ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500 inline-flex items-center gap-1.5">
            <Filter size={14} />
            {totalCount} poll{totalCount === 1 ? "" : "s"}
          </div>
          <Link
            href={buildFeedHref(status, sortBy, order === "asc" ? "desc" : "asc", 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            {order === "asc" ? <ArrowUpAZ size={14} /> : <ArrowDownAZ size={14} />}
            {order === "asc" ? "Ascending" : "Descending"}
          </Link>
        </div>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/10 rounded-xl border border-zinc-900">
          <Vote size={32} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-sm font-semibold text-zinc-300">No public decisions found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try changing sorting/filtering or create a new public decision.</p>
        </div>
      ) : (
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
                    poll.status === "open" ? "bg-green-950/50 text-green-400 border border-green-900/40" : "bg-red-950/50 text-red-400 border border-red-900/40"
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
                <div className="text-[10px] text-zinc-500 mt-2 font-medium">Created by {poll.creatorName}</div>
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
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Link
            href={buildFeedHref(status, sortBy, order, Math.max(1, currentPage - 1))}
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
            href={buildFeedHref(status, sortBy, order, Math.min(totalPages, currentPage + 1))}
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
    </div>
  );
}
