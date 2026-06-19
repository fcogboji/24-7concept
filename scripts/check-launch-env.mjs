#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const productionMode = process.argv.includes("--production");
const root = process.cwd();
const envPath = path.join(root, ".env");

function loadDotEnvIfPresent() {
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function present(name) {
  return Boolean(process.env[name]?.trim());
}

function anyPresent(names) {
  return names.some((name) => present(name));
}

function fail(message) {
  failures.push(message);
}

loadDotEnvIfPresent();

const failures = [];

const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "HEALTH_CHECK_SECRET",
  "SECRET_ENCRYPTION_KEY",
];

for (const key of required) {
  if (!present(key)) fail(`${key} is missing`);
}

if (!anyPresent(["STRIPE_SECRET_KEY", "STRIPE_API_KEY"])) {
  fail("STRIPE_SECRET_KEY or STRIPE_API_KEY is missing");
}

if (!anyPresent(["STRIPE_PRICE_STARTER", "STRIPE_PRICE_STARTER_MONTHLY"])) {
  fail("STRIPE_PRICE_STARTER or STRIPE_PRICE_STARTER_MONTHLY is missing");
}

if (!anyPresent(["STRIPE_PRICE_PRO", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRO_PRICE_ID", "STRIPE_PRICE_ID"])) {
  fail("STRIPE_PRICE_PRO, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRO_PRICE_ID, or STRIPE_PRICE_ID is missing");
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
if (appUrl) {
  try {
    const url = new URL(appUrl);
    if (productionMode && url.protocol !== "https:") {
      fail("NEXT_PUBLIC_APP_URL must use https in production");
    }
    if (productionMode && /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i.test(url.hostname)) {
      fail("NEXT_PUBLIC_APP_URL must be the public production origin, not localhost");
    }
  } catch {
    fail("NEXT_PUBLIC_APP_URL is not a valid URL");
  }
}

const emailFrom = process.env.EMAIL_FROM ?? "";
if (productionMode && /onboarding@resend\.dev/i.test(emailFrom)) {
  fail("EMAIL_FROM is Resend's sandbox sender; use a verified production domain sender");
}

const clerkPub = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkSecret = process.env.CLERK_SECRET_KEY ?? "";
if (productionMode && (!clerkPub.startsWith("pk_live_") || !clerkSecret.startsWith("sk_live_"))) {
  fail("Clerk production launch should use live keys: pk_live_... and sk_live_...");
}

if (productionMode && process.env.ALLOW_LOCAL_TRAINING_URL) {
  fail("ALLOW_LOCAL_TRAINING_URL must not be set in production");
}

if (failures.length > 0) {
  console.error("Launch environment check failed:");
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(
  productionMode
    ? "Launch environment check passed for production."
    : "Environment check passed for local/dev coverage.",
);
