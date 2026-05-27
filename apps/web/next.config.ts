import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://pollaris-497520.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print upload logs in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser error reports through a Next.js rewrite to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Hide source maps from generated client bundles (new API name)
  sourcemaps: {
    disable: false,
  },
});
