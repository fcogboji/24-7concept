import type { Instrumentation } from "next";

/**
 * Server + edge instrumentation hook. Activated only when SENTRY_DSN is set;
 * otherwise the app runs unchanged with no Sentry overhead. Wire your DSN in
 * the host env before going live so production errors get captured.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
};
