import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
import { getPaystackProPlanCode, getPaystackStarterPlanCode } from "@/lib/paystack-env";
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
          subscriptionStatus: "active",
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
