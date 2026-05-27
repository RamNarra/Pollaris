import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 font-sans">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #27272a 1px, transparent 0)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
        }}
        aria-hidden="true"
      />

      {/* Top glow accent */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, #6366f118 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md py-3 px-6 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30">
            P
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-100">
            Pollaris
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm animate-fade-in-scale">
          {/* Card */}
          <div className="bg-zinc-900/70 backdrop-blur border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/40">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
                Welcome to{" "}
                <span className="text-indigo-400">Pollaris</span>
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                The AI-native polling platform
              </p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
