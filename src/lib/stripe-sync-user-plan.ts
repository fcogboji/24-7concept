import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey } from "@/lib/stripe-env";

const STRIPE_API_VERSION = "2026-03-25.dahlia" as const;

function statusGrantsAccess(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

function planFromMetadata(meta: Stripe.Metadata | null | undefined): "starter" | "pro" {
  return meta?.plan === "starter" ? "starter" : "pro";
}

/**
 * After Checkout redirects back with ?session_id={CHECKOUT_SESSION_ID}, verify the session
 * belongs to this user and persist Pro state. Works even when webhooks are delayed or unreachable (e.g. localhost).
 */
export async function syncUserPlanFromCheckoutSession(
  sessionId: string,
  expectedUserId: string
): Promise<{ ok: boolean }> {
  const secret = getStripeSecretKey();
  if (!secret) return { ok: false };

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });
  } catch {
    return { ok: false };
  }

  const metaUserId = session.metadata?.userId;
  if (!metaUserId || metaUserId !== expectedUserId) {
    return { ok: false };
  }

  const subRaw = session.subscription;
  if (!subRaw) return { ok: false };

  const sub =
    typeof subRaw === "string" ? await stripe.subscriptions.retrieve(subRaw) : subRaw;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  if (!customerId) return { ok: false };

  const access = statusGrantsAccess(sub.status);
  const plan = planFromMetadata(session.metadata) || planFromMetadata(sub.metadata);
  await prisma.user.update({
    where: { id: expectedUserId },
    data: {
      plan: access ? plan : "free",
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.status === "canceled" ? null : sub.id,
      subscriptionStatus: sub.status,
    },
  });

  return { ok: true };
}

/**
 * Finds a Stripe customer by email and upgrades the app user if they have an active/trialing subscription.
 * Used when webhooks never reached this environment (common with local DB + production Stripe).
 */
export async function syncUserPlanFromStripeByEmail(
  userId: string,
  email: string
): Promise<{ ok: boolean }> {
  const secret = getStripeSecretKey();
  if (!secret) return { ok: false };

  const stripe = new Stripe(secret, { apiVersion: STRIPE_API_VERSION });
  const trimmed = email.trim();

  let customers: Stripe.Customer[];
  try {
    const list = await stripe.customers.list({ email: trimmed, limit: 5 });
    customers = list.data;
  } catch {
    return { ok: false };
  }

  if (customers.length === 0) return { ok: false };

  for (const c of customers) {
    let subs: Stripe.Subscription[];
    try {
      const res = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 15 });
      subs = res.data;
    } catch {
      continue;
    }
    const active = subs.find((s) => statusGrantsAccess(s.status));
    if (active) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: planFromMetadata(active.metadata),
          stripeCustomerId: c.id,
          stripeSubscriptionId: active.id,
          subscriptionStatus: active.status,
        },
      });
      return { ok: true };
    }
  }

  return { ok: false };
}
