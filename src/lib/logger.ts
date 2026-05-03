/**
 * Minimal structured logger. Wire to Sentry/Datadog by editing the `error`/`warn` sinks below.
 * Goals: machine-readable JSON in prod, redact known-secret keys, never throw.
 */

type LogContext = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "stripeSubscriptionId",
  "stripeCustomerId",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k.toLowerCase()) ? "[redacted]" : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function forwardToSentry(level: "warn" | "error", scope: string, msg: string, err: unknown, ctx?: LogContext) {
  if (!process.env.SENTRY_DSN) return;
  // Dynamic import so the Sentry SDK is never loaded when DSN is unset.
  import("@sentry/nextjs")
    .then((Sentry) => {
      Sentry.withScope((s) => {
        s.setTag("scope", scope);
        s.setLevel(level === "error" ? "error" : "warning");
        if (ctx) s.setContext("ctx", redact(ctx) as Record<string, unknown>);
        if (err instanceof Error) {
          Sentry.captureException(err);
        } else {
          Sentry.captureMessage(msg);
        }
      });
    })
    .catch(() => {
      // never throw out of a logger
    });
}

function emit(level: "info" | "warn" | "error", scope: string, msg: string, ctx?: LogContext, err?: unknown) {
  const entry = {
    level,
    scope,
    msg,
    ts: new Date().toISOString(),
    ...(ctx ? (redact(ctx) as LogContext) : {}),
  };
  if (process.env.NODE_ENV === "production") {
    // Single-line JSON for log aggregators.
    if (level === "error") console.error(JSON.stringify(entry));
    else if (level === "warn") console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
  } else {
    if (level === "error") console.error(`[${scope}] ${msg}`, ctx ?? "");
    else if (level === "warn") console.warn(`[${scope}] ${msg}`, ctx ?? "");
    else console.log(`[${scope}] ${msg}`, ctx ?? "");
  }
  if (level === "warn" || level === "error") {
    forwardToSentry(level, scope, msg, err, ctx);
  }
}

export function getLogger(scope: string) {
  return {
    info: (msg: string, ctx?: LogContext) => emit("info", scope, msg, ctx),
    warn: (msg: string, ctx?: LogContext) => emit("warn", scope, msg, ctx),
    error: (msg: string, err?: unknown, ctx?: LogContext) => {
      const errCtx: LogContext =
        err instanceof Error
          ? { error: { name: err.name, message: err.message, stack: err.stack } }
          : err !== undefined
            ? { error: err }
            : {};
      emit("error", scope, msg, { ...errCtx, ...(ctx ?? {}) }, err);
    },
  };
}

export type Logger = ReturnType<typeof getLogger>;
