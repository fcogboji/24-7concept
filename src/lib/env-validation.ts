import { z } from "zod";

/**
 * Production environment validation.
 * Validates all required environment variables at startup to fail fast with clear errors.
 * Call this in instrumentation.ts or at the top of your app.
 */

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database (REQUIRED)
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required for Prisma migrations"),

  // OpenAI (REQUIRED for chat functionality)
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required").startsWith("sk-", "Invalid OpenAI API key format"),

  // App URL (REQUIRED)
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),

  // Clerk Auth (REQUIRED)
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),

  // Stripe (REQUIRED for payments)
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),

  // Stripe Price IDs (REQUIRED for checkout)
  STRIPE_PRICE_STARTER: z.string().min(1, "STRIPE_PRICE_STARTER is required"),
  STRIPE_PRICE_PRO: z.string().min(1, "STRIPE_PRICE_PRO is required"),

  // Encryption (REQUIRED for webhook secrets, calendar tokens)
  SECRET_ENCRYPTION_KEY: z.string().min(20, "SECRET_ENCRYPTION_KEY must be at least 20 characters"),

  // VAPID (REQUIRED for push notifications)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1, "NEXT_PUBLIC_VAPID_PUBLIC_KEY is required"),
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY is required"),
  VAPID_SUBJECT: z.string().email("VAPID_SUBJECT must be a valid mailto: email").or(z.string().startsWith("mailto:")),

  // Cron secret (REQUIRED for scheduled jobs)
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),

  // Optional but recommended in production
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  HEALTH_CHECK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  WIDGET_ALLOWED_ORIGINS: z.string().optional(),

  // Paystack (optional)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().optional(),

  // Calendar (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Admin (optional)
  ADMIN_CLERK_USER_IDS: z.string().optional(),

  // Dev only
  ALLOW_LOCAL_TRAINING_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Validates and returns typed environment variables.
 * Caches the result after first validation.
 * Throws descriptive errors if validation fails.
 */
export function getValidatedEnv(): Env {
  if (cachedEnv) return cachedEnv;

  try {
    cachedEnv = envSchema.parse(process.env);
    return cachedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`).join("\n");

      console.error("\nL Environment validation failed:\n");
      console.error(missingVars);
      console.error("\nPlease check your .env file and ensure all required variables are set.");
      console.error("See .env.example for reference.\n");

      throw new Error(`Environment validation failed. Missing or invalid variables:\n${missingVars}`);
    }
    throw error;
  }
}

/**
 * Production-only validations.
 * Enforces stricter requirements for production deployments.
 */
export function validateProductionEnv(): void {
  const env = getValidatedEnv();

  if (env.NODE_ENV !== "production") {
    return; // Skip production checks in dev
  }

  const errors: string[] = [];

  // Ensure production Stripe keys (not test keys)
  if (env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
    errors.push("L STRIPE_SECRET_KEY: Using TEST key in production! Replace with live key (sk_live_...)");
  }
  if (env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_")) {
    errors.push("L NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: Using TEST key in production! Replace with live key (pk_live_...)");
  }

  // Ensure production Clerk keys (not test keys)
  if (env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("_test_")) {
    errors.push("L NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Using TEST key in production! Replace with live key");
  }
  if (env.CLERK_SECRET_KEY.includes("_test_")) {
    errors.push("L CLERK_SECRET_KEY: Using TEST key in production! Replace with live key");
  }

  // Ensure Upstash is configured (required for rate limiting)
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    errors.push("L UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are REQUIRED in production for distributed rate limiting");
  }

  // Ensure HTTPS for production URL
  if (!env.NEXT_PUBLIC_APP_URL.startsWith("https://")) {
    errors.push("L NEXT_PUBLIC_APP_URL must use HTTPS in production");
  }

  // Warn if health check secret is missing
  if (!env.HEALTH_CHECK_SECRET) {
    console.warn("   HEALTH_CHECK_SECRET is not set. Health check endpoint will be public.");
  }

  // Warn if CORS is wide open
  if (!env.WIDGET_ALLOWED_ORIGINS) {
    console.warn("   WIDGET_ALLOWED_ORIGINS is not set. Widget will accept requests from any origin.");
  }

  if (errors.length > 0) {
    console.error("\nL Production environment validation failed:\n");
    errors.forEach((err) => console.error(err));
    console.error("\nFix these issues before deploying to production!\n");
    throw new Error("Production environment validation failed");
  }

  console.log(" Production environment validation passed");
}

/**
 * Helper to get a required env var with a clear error message.
 * Use this for one-off env checks outside the main schema.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Helper to check if a feature is enabled via env var.
 */
export function isFeatureEnabled(key: string): boolean {
  const value = process.env[key]?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
