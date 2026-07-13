import Stripe from "stripe";
import { getAppUrlForStripeRedirects } from "@/lib/public-app-url";
import { getStripeCheckoutConfigIssue, STRIPE_PRICE_ENV_HINT } from "@/lib/stripe-env";
import { initTransaction, PAYSTACK_TRIAL_AUTH_PURPOSE } from "@/lib/paystack";
import { getPaystackPlanCode, isPaystackEnabled } from "@/lib/paystack-env";
import { PAYSTACK_CARD_AUTH_NGN, TRIAL_PERIOD_DAYS, type PlanId } from "@/lib/pricing";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; body: { error: string; code?: string } };

export async function createStripeCheckoutForUser(
  user: { id: string; email: string | null },
  plan: PlanId = "pro",
): Promise<CheckoutResult> {
  if (!user.email) {
    return { ok: false, status: 401, body: { error: "Unauthorized" } };
  }

  const cfg = getStripeCheckoutConfigIssue(plan);
  if (!cfg.ok) {
    const envHint = STRIPE_PRICE_ENV_HINT[plan];
    const error =
      cfg.code === "MISSING_STRIPE_SECRET"
        ? "Stripe secret key is not set on the server. Add STRIPE_SECRET_KEY (or STRIPE_API_KEY) in your deployment environment and redeploy."
        : `Stripe ${plan} price id is not set. Add ${envHint} with your recurring price id (price_…) from Stripe → Products, in the server environment, then redeploy.`;
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
      metadata: { userId: user.id, plan },
      allow_promotion_codes: true,
      // Card is collected up front; Stripe charges nothing until the trial ends.
      payment_method_collection: "always",
      subscription_data: { trial_period_days: TRIAL_PERIOD_DAYS, metadata: { plan } },
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
          "Stripe rejected checkout. Confirm the secret key mode (test/live) matches the price id and that the price id is for a subscription.",
        code: "STRIPE_CHECKOUT_FAILED",
      },
    };
  }
}

export async function createPaystackCheckoutForUser(
  user: { id: string; email: string | null },
  plan: PlanId = "pro",
): Promise<CheckoutResult> {
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

  const planCode = getPaystackPlanCode(plan);
  if (!planCode) {
    const envName = plan === "starter" ? "PAYSTACK_STARTER_PLAN_CODE" : "PAYSTACK_PRO_PLAN_CODE";
    return {
      ok: false,
      status: 503,
      body: { error: `Paystack ${plan} plan code not set. Create a plan in Paystack dashboard and set ${envName}.` },
    };
  }

  const appUrl = (await getAppUrlForStripeRedirects()).replace(/\/$/, "");

  try {
    // Do NOT pass `plan` here: Paystack would create the subscription and bill
    // the full amount today. Instead we take a refundable card-authorization
    // charge, then the webhook creates the subscription with a start_date 14
    // days out so the first real charge lands on day 15.
    const result = await initTransaction({
      email: user.email,
      amount: PAYSTACK_CARD_AUTH_NGN,
      channels: ["card"],
      callbackUrl: `${appUrl}/dashboard?paystack=callback`,
      metadata: { userId: user.id, plan, purpose: PAYSTACK_TRIAL_AUTH_PURPOSE, planCode },
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
