import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { getAppUrlForStripeRedirects } from "@/lib/public-app-url";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { getStripeSecretKey } from "@/lib/stripe-env";

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

  const secret = getStripeSecretKey();

  if (!secret) {
    return NextResponse.json(
      {
        error:
          "Stripe secret key is not set on the server. Add STRIPE_SECRET_KEY (or STRIPE_API_KEY) and redeploy.",
        code: "MISSING_STRIPE_SECRET",
      },
      { status: 503 }
    );
  }

  const appUrl = (await getAppUrlForStripeRedirects()).replace(/\/$/, "");

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
