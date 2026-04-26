import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey } from "@/lib/stripe-env";
import { getLogger } from "@/lib/logger";

const log = getLogger("stripe.webhook");

export const runtime = "nodejs";

function statusGrantsAccess(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

function planFromMetadata(meta: Stripe.Metadata | null | undefined): "starter" | "pro" {
  return meta?.plan === "starter" ? "starter" : "pro";
}

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function POST(req: Request) {
  const secret = getStripeSecretKey();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
  });

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.stripeWebhookEvent.create({ data: { eventId: event.id } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ received: true });
    }
    throw e;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId;
      if (userId && s.subscription) {
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        let initialStatus: Stripe.Subscription.Status = "active";
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            initialStatus = sub.status;
          } catch {
            // fall back to "active"
          }
        }
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planFromMetadata(s.metadata),
            stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
            stripeSubscriptionId: subId,
            subscriptionStatus: initialStatus,
          },
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) {
        return NextResponse.json({ received: true });
      }

      const subId = sub.id;
      const status = sub.status;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ stripeSubscriptionId: subId }, { stripeCustomerId: customerId }],
        },
      });

      if (user) {
        const access = statusGrantsAccess(status);
        const planFromSub = planFromMetadata(sub.metadata);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeCustomerId: customerId,
            subscriptionStatus: status,
            plan: access ? planFromSub : "free",
            stripeSubscriptionId: status === "canceled" ? null : subId,
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        // Mark past_due but keep Pro entitlement active during Stripe's dunning retry
        // window. Final downgrade happens on customer.subscription.deleted or status=unpaid.
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "past_due" },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          },
        });
      }
    }
  } catch (e) {
    log.error("handler failed", e, { eventId: event.id, type: event.type });
    await prisma.stripeWebhookEvent.delete({ where: { eventId: event.id } }).catch(() => {});
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
