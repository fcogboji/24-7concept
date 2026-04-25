import Stripe from "stripe";
import { getAppUrlForStripeRedirects } from "@/lib/public-app-url";
import { getStripeCheckoutConfigIssue } from "@/lib/stripe-env";
import { initTransaction } from "@/lib/paystack";
import { getPaystackProPlanCode, isPaystackEnabled } from "@/lib/paystack-env";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; body: { error: string; code?: string } };

export async function createStripeCheckoutForUser(user: {
  id: string;
  email: string | null;
}): Promise<CheckoutResult> {
  if (!user.email) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  const cfg = getStripeCheckoutConfigIssue();
  if (!cfg.ok) {
    const error =
      cfg.code === "MISSING_STRIPE_SECRET"
        ? "Stripe secret key is not set on the server. Add STRIPE_SECRET_KEY (or STRIPE_API_KEY) in your deployment environment and redeploy."
        : "Stripe Pro price id is not set. Add STRIPE_PRICE_PRO with your recurring price id (price_…) from Stripe → Products, in the server environment, then redeploy.";
    return { ok: false, status: 503, body: { error, code: cfg.code } };
  }

  const appUrl = (await getAppUrlForStripeRedirects()).replace(/\/$/, "");
  const stripe = new Stripe(cfg.secretKey, { apiVersion: "2026-03-25.dahlia" });

  try {
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: cfg.priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard?checkout=cancel`,
      metadata: { userId: user.id },
      allow_promotion_codes: true,
      subscription_data: { trial_period_days: 14 },
    });

    if (!checkout.url) {
      return { ok: false, status: 500, body: { error: "No checkout URL" } };
    }
    return { ok: true, url: checkout.url };
  } catch (e) {
    console.error("[checkout/stripe] sessions.create failed", e);
    return {
      ok: false,
      status: 502,
      body: {
        error:
          "Stripe rejected checkout. Confirm the secret key mode (test/live) matches the price id and that STRIPE_PRICE_PRO is a subscription price.",
        code: "STRIPE_CHECKOUT_FAILED",
      },
    };
  }
}

export async function createPaystackCheckoutForUser(user: {
  id: string;
  email: string | null;
}): Promise<CheckoutResult> {
  if (!user.email) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  if (!isPaystackEnabled()) {
    return {
      ok: false,
      status: 503,
      body: { error: "Paystack is not configured. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY." },
    };
  }

  const planCode = getPaystackProPlanCode();
  if (!planCode) {
    return {
      ok: false,
      status: 503,
      body: { error: "Paystack Pro plan code not set. Create a plan in Paystack dashboard and set PAYSTACK_PRO_PLAN_CODE." },
    };
  }

  const appUrl = (await getAppUrlForStripeRedirects()).replace(/\/$/, "");

  try {
    const result = await initTransaction({
      email: user.email,
      amount: 49000,
      plan: planCode,
      callbackUrl: `${appUrl}/dashboard?paystack=callback`,
      metadata: { userId: user.id },
    });

    if (!result.status || !result.data?.authorization_url) {
      return { ok: false, status: 502, body: { error: result.message || "Paystack init failed" } };
    }
    return { ok: true, url: result.data.authorization_url };
  } catch (e) {
    console.error("[checkout/paystack] failed", e);
    return { ok: false, status: 502, body: { error: "Paystack checkout failed" } };
  }
}
