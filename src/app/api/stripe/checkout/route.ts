import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitStripeBilling } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser?.email) {
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
  const price = process.env.STRIPE_PRICE_PRO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!secret || !price || !appUrl) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
  });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: appUser.email,
    line_items: [{ price, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/dashboard?checkout=cancel`,
    metadata: { userId: appUser.id },
    allow_promotion_codes: true,
  });

  if (!checkout.url) {
    return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
  }

  return NextResponse.json({ url: checkout.url });
}
