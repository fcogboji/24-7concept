import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paystack";
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
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "pro",
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
