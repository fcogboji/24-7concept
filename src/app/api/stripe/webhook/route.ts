import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function grantsProFromStripeStatus(status: Stripe.Subscription.Status): boolean {
  return status === "active" || status === "trialing";
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.metadata?.userId;
      if (userId && s.subscription) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
            stripeSubscriptionId:
              typeof s.subscription === "string" ? s.subscription : s.subscription?.id,
            subscriptionStatus: "active",
          },
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
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
        const pro = grantsProFromStripeStatus(status);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            stripeCustomerId: customerId,
            subscriptionStatus: status,
            plan: pro ? "pro" : "free",
            stripeSubscriptionId: status === "canceled" ? null : subId,
          },
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
    console.error(e);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
