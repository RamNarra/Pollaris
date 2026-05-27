"use client";

import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";

export default function DashboardHeader({ userName, userEmail }: { userName?: string, userEmail?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (e) {
      toast.error("Error signing out");
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-zinc-900/30 backdrop-blur-md border-b border-zinc-900 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/my-polls" className="flex items-center gap-2 mr-6">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">P</div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Pollaris</h1>
        </Link>
        <nav className="hidden md:flex gap-1 pl-4">
          <Link 
            href="/feed" 
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive("/feed") 
                ? "bg-zinc-800 text-zinc-50" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Public Feed
          </Link>
          <Link 
            href="/my-polls" 
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive("/my-polls") 
                ? "bg-zinc-800 text-zinc-50" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            My Polls
          </Link>
          <Link 
            href="/shared" 
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive("/shared") 
                ? "bg-zinc-800 text-zinc-50" 
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            Shared with me
          </Link>
        </nav>
        <div className="flex items-center gap-4 ml-auto">
          {userName && (
            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              {userName} <span className="text-zinc-600">({userEmail})</span>
            </span>
          )}
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}