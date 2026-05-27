/**
 * Server-side PostHog analytics helpers.
 *
 * These functions are called from Server Actions and API routes to track
 * key Pollaris domain events. They are intentionally fire-and-forget;
 * analytics failures NEVER surface to users.
 *
 * Usage:
 *   import { track } from "@/lib/analytics";
 *   await track(userId, "poll_created", { pollId, visibility });
 */

type Properties = Record<string, string | number | boolean | null | undefined>;

/**
 * Track a server-side event in PostHog.
 * No-ops gracefully when NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export async function track(
  userId: string,
  event: string,
  properties?: Properties
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  try {
    const { PostHog } = await import("posthog-node");
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    const client = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });

    client.capture({
      distinctId: userId,
      event,
      properties: properties ?? {},
    });

    client.shutdown();
  } catch {
    // Analytics failures are non-fatal
  }
}

// ── Named domain event helpers ────────────────────────────────

export const Analytics = {
  pollCreated: (userId: string, pollId: string, visibility: string) =>
    track(userId, "poll_created", { pollId, visibility }),

  pollPublished: (userId: string, pollId: string) =>
    track(userId, "poll_published", { pollId }),

  pollClosed: (userId: string, pollId: string) =>
    track(userId, "poll_closed", { pollId }),

  voteCast: (userId: string, pollId: string, optionId: string) =>
    track(userId, "vote_cast", { pollId, optionId }),

  voteWithdrawn: (userId: string, pollId: string) =>
    track(userId, "vote_withdrawn", { pollId }),

  inviteSent: (userId: string, pollId: string, email: string) =>
    track(userId, "invite_sent", { pollId, email }),

  aiAssistantUsed: (userId: string, intent: string) =>
    track(userId, "ai_assistant_used", { intent }),

  aiAnalysisViewed: (userId: string, pollId: string) =>
    track(userId, "ai_analysis_viewed", { pollId }),
};
