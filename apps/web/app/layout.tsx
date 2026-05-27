import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { PHProvider } from "@/lib/providers/posthog-provider";
import PostHogPageview from "@/lib/providers/posthog-pageview";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pollaris | AI-Native Polling Platform",
  description:
    "Pollaris is the intelligent polling platform that synthesizes decisions, analyses sentiment, and surfaces insights — powered by Gemini.",
  keywords: ["polling", "decisions", "AI", "voting", "feedback"],
  openGraph: {
    title: "Pollaris",
    description: "AI-native polling and decision intelligence platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <PHProvider>
        <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
          <PostHogPageview />
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                background: "#18181b",
                border: "1px solid #27272a",
                color: "#fafafa",
              },
            }}
          />
        </body>
      </PHProvider>
    </html>
  );
}
