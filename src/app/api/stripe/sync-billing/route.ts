import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { syncUserPlanFromStripeByEmail } from "@/lib/stripe-sync-user-plan";
import { getStripeSecretKey } from "@/lib/stripe-env";

export const runtime = "nodejs";

/** Pulls Pro status from Stripe by account email (recovery when webhooks did not update this DB). */
export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingLimit = await rateLimitStripeBilling(appUser.id);
  if (!billingLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(billingLimit.retryAfter) } }
    );
  }

  if (!getStripeSecretKey()) {
    return NextResponse.json({ error: "Billing is not configured on this server." }, { status: 503 });
  }

  const { ok } = await syncUserPlanFromStripeByEmail(appUser.id, appUser.email);
  return NextResponse.json({ synced: ok });
}
