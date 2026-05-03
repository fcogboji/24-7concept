/**
 * Client-side Sentry init. Loaded automatically by Next when present.
 * Skips when SENTRY_DSN (forwarded as NEXT_PUBLIC_SENTRY_DSN) is unset so
 * unconfigured deployments stay zero-cost and ship no Sentry payload.
 */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Dynamic import keeps Sentry out of the bundle entirely when the DSN is
  // not configured.
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.05"),
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    });
  });
}
