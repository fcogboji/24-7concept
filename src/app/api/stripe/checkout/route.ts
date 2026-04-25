import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { createStripeCheckoutForUser } from "@/lib/checkout";

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
      { status: 429, headers: { "Retry-After": String(billingLimit.retryAfter) } },
    );
  }

  const result = await createStripeCheckoutForUser(appUser);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
