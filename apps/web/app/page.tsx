import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-50 selection:bg-indigo-500/30">
      <header className="w-full bg-zinc-900/40 backdrop-blur-md border-b border-zinc-900 py-4 px-6 md:px-12 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-lg">P</div>
          <span className="text-xl font-bold text-zinc-100 tracking-tight">Pollaris</span>
        </div>
        <div className="space-x-4">
          <Link href="/sign-in" className="text-zinc-400 hover:text-zinc-100 font-medium text-sm transition-colors">Log in</Link>
          <Link href="/sign-up" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20">Get Started</Link>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-20 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-zinc-50 mb-6 leading-tight tracking-tight">
            Empower Decisions with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">Intelligent Polling</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto">
            The AI-native decision orchestration platform built for high-performing teams. Create secure polls, analyze sentiment, and align company decisions instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/sign-up" className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5">
              Create an Account
            </Link>
            <Link href="/sign-in" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:border-zinc-700 px-8 py-4 rounded-xl font-semibold text-base transition-all">
              Sign In to Dashboard
            </Link>
          </div>
        </div>
        
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
          <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-900 hover:border-zinc-800/80 transition-all group">
            <div className="w-12 h-12 bg-indigo-950/60 text-indigo-400 rounded-xl flex items-center justify-center text-xl mb-6 font-bold border border-indigo-900/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-200 mb-3 group-hover:text-zinc-50 transition-colors">Instant Polling</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Spin up a new poll and share it across the network instantly. Gather results in real-time with zero friction.</p>
          </div>
          <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-900 hover:border-zinc-800/80 transition-all group">
            <div className="w-12 h-12 bg-teal-950/60 text-teal-400 rounded-xl flex items-center justify-center text-xl mb-6 font-bold border border-teal-900/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-200 mb-3 group-hover:text-zinc-50 transition-colors">Secure & Private</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Granular access controls and private invitations secure your data. Guessing URLs simply will not work.</p>
          </div>
          <div className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-900 hover:border-zinc-800/80 transition-all group">
            <div className="w-12 h-12 bg-indigo-950/60 text-indigo-400 rounded-xl flex items-center justify-center text-xl mb-6 font-bold border border-indigo-900/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-200 mb-3 group-hover:text-zinc-50 transition-colors">AI-Native Insights</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Leverage the AI Analytics agent to extract decision sentiment, summarize feedback, and identify controversy factors.</p>
          </div>
        </div>
      </main>

      <footer className="bg-zinc-950 py-12 text-center text-zinc-500 text-xs border-t border-zinc-900">
        <p>&copy; {new Date().getFullYear()} Pollaris Decision Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
