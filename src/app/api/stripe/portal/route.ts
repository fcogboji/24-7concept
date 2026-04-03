import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { rateLimitStripeBilling } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingLimit = await rateLimitStripeBilling(appUser.id);
  if (!billingLimit.ok) {
    return NextResponse.json(
      { error: "Too many billing requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(billingLimit.retryAfter) } }
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!secret || !appUrl) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer on file. Subscribe first or contact support." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
  });

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/dashboard`,
  });

  if (!portal.url) {
    return NextResponse.json({ error: "No portal URL" }, { status: 500 });
  }

  return NextResponse.json({ url: portal.url });
}
