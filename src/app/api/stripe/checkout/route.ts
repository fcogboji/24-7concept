import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { getStripeCheckoutConfigIssue } from "@/lib/stripe-env";

export const runtime = "nodejs";

export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingLimit = await rateLimitStripeBilling(appUser.id);
  if (!billingLimit.ok) {
    return NextResponse.json(
      { error: "Too many billing requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(billingLimit.retryAfter) } }
    );
  }

  const cfg = getStripeCheckoutConfigIssue();
  if (!cfg.ok) {
    const body =
      cfg.code === "MISSING_STRIPE_SECRET"
        ? {
            error:
              "Stripe secret key is not set on the server. Add STRIPE_SECRET_KEY (or STRIPE_API_KEY) in your deployment environment and redeploy.",
            code: cfg.code,
          }
        : {
            error:
              "Stripe Pro price id is not set. Add STRIPE_PRICE_PRO with your recurring price id (price_…) from Stripe → Products, in the server environment, then redeploy.",
            code: cfg.code,
          };
    return NextResponse.json(body, { status: 503 });
  }

  const appUrl = (await getPublicAppUrl()).replace(/\/$/, "");

  const stripe = new Stripe(cfg.secretKey, {
    apiVersion: "2026-03-25.dahlia",
  });

  let checkout: Stripe.Response<Stripe.Checkout.Session>;
  try {
    checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: appUser.email,
      line_items: [{ price: cfg.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?checkout=cancel`,
      metadata: { userId: appUser.id },
      allow_promotion_codes: true,
    });
  } catch (e) {
    console.error("[stripe/checkout] sessions.create failed", e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        error: "Stripe rejected checkout. Confirm the secret key mode (test/live) matches the price id and that STRIPE_PRICE_PRO is a subscription price.",
        code: "STRIPE_CHECKOUT_FAILED",
        ...(process.env.NODE_ENV === "development" ? { detail } : {}),
      },
      { status: 502 }
    );
  }

  if (!checkout.url) {
    return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url });
}
