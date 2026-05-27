/**
 * @pollaris/logger
 *
 * Structured logger with Cloud Logging-compatible JSON output.
 * Integrates with Sentry (errors) and PostHog (product analytics) via
 * optional environment-gated initialization — no-ops gracefully when keys
 * are absent (e.g., local development without a .env.local).
 */

export type LogSeverity = "DEBUG" | "INFO" | "WARNING" | "ERROR";

export interface LogPayload {
  message: string;
  severity: LogSeverity;
  timestamp: string;
  context?: Record<string, any>;
  error?: { message: string; stack?: string };
}

class Logger {
  private log(
    severity: LogSeverity,
    message: string,
    context?: Record<string, any>,
    error?: any
  ) {
    const payload: LogPayload = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      context,
      error: error
        ? { message: error?.message ?? String(error), stack: error?.stack }
        : undefined,
    };

    // Structured JSON → compatible with Google Cloud Logging / Cloud Run stdout ingestion
    console.log(JSON.stringify(payload));

    if (severity === "ERROR" && error) {
      this.captureSentryException(error, context);
    }
  }

  public debug(message: string, context?: Record<string, any>) {
    this.log("DEBUG", message, context);
  }

  public info(message: string, context?: Record<string, any>) {
    this.log("INFO", message, context);
  }

  public warn(message: string, context?: Record<string, any>, error?: any) {
    this.log("WARNING", message, context, error);
  }

  public error(message: string, error?: any, context?: Record<string, any>) {
    this.log("ERROR", message, context, error);
  }

  /**
   * Capture an exception in Sentry.
   * Works in both browser (window.Sentry) and Node.js (@sentry/nextjs).
   */
  private captureSentryException(error: any, context?: Record<string, any>) {
    try {
      // Browser path — Sentry SDK injects itself onto window after init
      if (typeof window !== "undefined" && (window as any).__SENTRY_SDK__) {
        const Sentry = (window as any).__SENTRY_SDK__;
        Sentry.withScope((scope: any) => {
          if (context) scope.setExtras(context);
          Sentry.captureException(error);
        });
        return;
      }

      // Node.js path — dynamically require to avoid bundling issues in edge/browser
      if (typeof window === "undefined") {
        // Only attempt if the package is installed
        const SentryModule = (() => {
          try {
            return require("@sentry/nextjs");
          } catch {
            return null;
          }
        })();

        if (SentryModule) {
          SentryModule.withScope((scope: any) => {
            if (context) scope.setExtras(context);
            SentryModule.captureException(error);
          });
        }
      }
    } catch {
      // Never let telemetry break the application
    }
  }

  /**
   * Track a product analytics event via PostHog.
   *
   * Server-side: uses posthog-node capture.
   * Client-side: delegates to the PostHog singleton (initialized in PHProvider).
   */
  public trackEvent(
    userId: string,
    eventName: string,
    properties?: Record<string, any>
  ) {
    this.info(`[analytics] ${eventName}`, { userId, ...properties });

    try {
      if (typeof window !== "undefined") {
        // Browser — PostHog JS client (initialized via PHProvider)
        const ph = (window as any).__posthog__;
        if (ph) ph.capture(eventName, { distinct_id: userId, ...properties });
        return;
      }

      // Server-side — posthog-node
      const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const host =
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

      if (!key) return;

      const { PostHog } = (() => {
        try {
          return require("posthog-node");
        } catch {
          return { PostHog: null };
        }
      })();

      if (!PostHog) return;

      const client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 });
      client.capture({ distinctId: userId, event: eventName, properties });
      client.shutdown();
    } catch {
      // Never let analytics break the application
    }
  }

  /**
   * Simple synchronous span wrapper for structured tracing breadcrumbs.
   * For full distributed tracing, instrument via OpenTelemetry SDK directly.
   */
  public trace<T>(spanName: string, fn: () => T): T {
    const start = Date.now();
    this.info(`[span:start] ${spanName}`);
    try {
      const result = fn();
      this.info(`[span:end] ${spanName}`, { durationMs: Date.now() - start });
      return result;
    } catch (err) {
      this.error(`[span:error] ${spanName}`, err, {
        durationMs: Date.now() - start,
      });
      throw err;
    }
  }

  /**
   * Async variant of trace for async server actions and API handlers.
   */
  public async traceAsync<T>(spanName: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.info(`[span:start] ${spanName}`);
    try {
      const result = await fn();
      this.info(`[span:end] ${spanName}`, { durationMs: Date.now() - start });
      return result;
    } catch (err) {
      this.error(`[span:error] ${spanName}`, err, {
        durationMs: Date.now() - start,
      });
      throw err;
    }
  }
}

export const logger = new Logger();
