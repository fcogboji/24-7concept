import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSubscription,
  PAYSTACK_TRIAL_AUTH_PURPOSE,
  refundTransaction,
  verifyWebhookSignature,
} from "@/lib/paystack";
import { getPaystackPlanCode, getPaystackProPlanCode, getPaystackStarterPlanCode } from "@/lib/paystack-env";
import { TRIAL_PERIOD_DAYS } from "@/lib/pricing";
import { getLogger } from "@/lib/logger";

const log = getLogger("paystack.webhook");

export const runtime = "nodejs";

type PaystackEvent = {
  event: string;
  data: {
    id?: number | string;
    reference?: string;
    status?: string;
    customer?: { email?: string; customer_code?: string };
    metadata?: Record<string, unknown> | string;
    plan?: { plan_code?: string } | string;
    subscription_code?: string;
    next_payment_date?: string;
    authorization?: { authorization_code?: string; reusable?: boolean };
  };
};

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

function extractUserId(meta: PaystackEvent["data"]["metadata"]): string | null {
  if (!meta) return null;
  const obj = typeof meta === "string" ? safeJson(meta) : meta;
  const v = obj && typeof obj === "object" ? (obj as Record<string, unknown>).userId : undefined;
  return typeof v === "string" ? v : null;
}

function extractPlan(meta: PaystackEvent["data"]["metadata"]): "starter" | "pro" {
  if (!meta) return "pro";
  const obj = typeof meta === "string" ? safeJson(meta) : meta;
  const v = obj && typeof obj === "object" ? (obj as Record<string, unknown>).plan : undefined;
  return v === "starter" ? "starter" : "pro";
}

function extractPurpose(meta: PaystackEvent["data"]["metadata"]): string | null {
  if (!meta) return null;
  const obj = typeof meta === "string" ? safeJson(meta) : meta;
  const v = obj && typeof obj === "object" ? (obj as Record<string, unknown>).purpose : undefined;
  return typeof v === "string" ? v : null;
}

/**
 * A subscription we created with a future `start_date` is still in its trial:
 * Paystack has authorized the card but will not charge until that date.
 */
function statusForSubscription(nextPaymentDate: string | undefined): "trialing" | "active" {
  if (!nextPaymentDate) return "active";
  const due = Date.parse(nextPaymentDate);
  if (Number.isNaN(due)) return "active";
  return due > Date.now() + 60 * 60 * 1000 ? "trialing" : "active";
}

/**
 * Cross-check the plan code Paystack returned against the codes we registered
 * via env. Returns the validated plan id, or null if Paystack sent a code we
 * don't recognise (in which case we refuse to grant entitlement). This blocks
 * a tampered-checkout where metadata says "pro" but the actual subscription
 * is for an arbitrary or starter plan code.
 */
function validatePlanFromEvent(
  metaPlan: "starter" | "pro",
  eventPlan: PaystackEvent["data"]["plan"],
): "starter" | "pro" | null {
  const planCode =
    typeof eventPlan === "string"
      ? eventPlan
      : eventPlan && typeof eventPlan === "object"
        ? eventPlan.plan_code
        : undefined;

  // For one-off charges (charge.success without subscription), the event has
  // no plan code. Trust metadata in that case — Paystack still authenticated
  // the body via HMAC.
  if (!planCode) return metaPlan;

  const starter = getPaystackStarterPlanCode();
  const pro = getPaystackProPlanCode();
  if (pro && planCode === pro) return "pro";
  if (starter && planCode === starter) return "starter";
  return null;
}

function safeJson(s: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const eventId = String(event.data?.id ?? event.data?.reference ?? "");
  if (!eventId) {
    return NextResponse.json({ received: true });
  }

  try {
    await prisma.paystackWebhookEvent.create({ data: { eventId } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ received: true });
    }
    throw e;
  }

  try {
    const customerEmail = event.data.customer?.email;
    const customerCode = event.data.customer?.customer_code;
    const userId = extractUserId(event.data.metadata);

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : customerEmail
        ? await prisma.user.findUnique({ where: { email: customerEmail } })
        : null;

    if (!user) {
      return NextResponse.json({ received: true });
    }

    // The card-authorization charge that opens a trial. Turn the vaulted card
    // into a subscription that first bills on day 15, then refund the token
    // charge. Subscribe before refunding so a failed subscribe can be retried
    // by Paystack without refunding twice.
    if (event.event === "charge.success" && extractPurpose(event.data.metadata) === PAYSTACK_TRIAL_AUTH_PURPOSE) {
      const plan = extractPlan(event.data.metadata);
      const planCode = getPaystackPlanCode(plan);
      const authorization = event.data.authorization?.authorization_code;
      const reference = event.data.reference;

      if (!planCode || !authorization || !customerCode) {
        log.error("trial auth charge missing fields", undefined, {
          eventId,
          hasPlanCode: Boolean(planCode),
          hasAuthorization: Boolean(authorization),
          hasCustomerCode: Boolean(customerCode),
        });
        return NextResponse.json({ received: true });
      }

      const startDate = new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      const sub = await createSubscription({
        customer: customerCode,
        plan: planCode,
        authorization,
        startDate,
      });

      if (!sub.status || !sub.data?.subscription_code) {
        // Throwing releases the idempotency row so Paystack's retry can redo this.
        throw new Error(`Paystack subscription create failed: ${sub.message}`);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan,
          stripeCustomerId: customerCode,
          stripeSubscriptionId: sub.data.subscription_code,
          subscriptionStatus: "trialing",
        },
      });

      if (reference) {
        const refund = await refundTransaction(reference).catch((e: unknown) => {
          log.error("card auth refund threw", e, { eventId, reference });
          return { status: false, message: "refund threw" };
        });
        if (!refund.status) {
          // The trial is already live; a stuck ₦100 is a manual-refund problem,
          // not a reason to fail the webhook and re-create the subscription.
          log.error("card auth refund failed", undefined, { eventId, reference, message: refund.message });
        }
      }

      return NextResponse.json({ received: true });
    }

    if (event.event === "charge.success" || event.event === "subscription.create") {
      const metaPlan = extractPlan(event.data.metadata);
      const validatedPlan = validatePlanFromEvent(metaPlan, event.data.plan);
      if (!validatedPlan) {
        log.error("rejecting unknown plan_code", undefined, {
          eventId,
          type: event.event,
          metaPlan,
          eventPlan: event.data.plan,
        });
        return NextResponse.json({ received: true });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: validatedPlan,
          stripeCustomerId: customerCode ?? user.stripeCustomerId,
          stripeSubscriptionId: event.data.subscription_code ?? user.stripeSubscriptionId,
          // subscription.create fires for the trial subscription we just made;
          // its future next_payment_date must not be mistaken for a payment.
          subscriptionStatus:
            event.event === "subscription.create"
              ? statusForSubscription(event.data.next_payment_date)
              : "active",
        },
      });
    }

    if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "free",
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        },
      });
    }

    if (event.event === "invoice.payment_failed") {
      // Keep Pro active during Paystack's retry window; downgrade only on subscription.disable.
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: "past_due" },
      });
    }
  } catch (e) {
    log.error("handler failed", e, { eventId, type: event.event });
    await prisma.paystackWebhookEvent.delete({ where: { eventId } }).catch(() => {});
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
