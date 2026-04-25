import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { createPaystackCheckoutForUser, createStripeCheckoutForUser } from "@/lib/checkout";
import { isPaystackEnabled } from "@/lib/paystack-env";

export const runtime = "nodejs";

async function detectCountry(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country") ??
    null
  );
}

export async function POST() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const billingLimit = await rateLimitStripeBilling(appUser.id);
  if (!billingLimit.ok) {
    return NextResponse.json(
      { error: "Too many billing requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(billingLimit.retryAfter) } },
    );
  }

  const country = (await detectCountry())?.toUpperCase() ?? null;
  const useNaira = country === "NG" && isPaystackEnabled();

  const result = useNaira
    ? await createPaystackCheckoutForUser(appUser)
    : await createStripeCheckoutForUser(appUser);

  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
