import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { getAppUrlForStripeRedirects } from "@/lib/public-app-url";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { initTransaction } from "@/lib/paystack";
import { getPaystackProPlanCode, isPaystackEnabled } from "@/lib/paystack-env";

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

  if (!isPaystackEnabled()) {
    return NextResponse.json(
      { error: "Paystack is not configured. Set PAYSTACK_SECRET_KEY and NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY." },
      { status: 503 }
    );
  }

  const planCode = getPaystackProPlanCode();
  if (!planCode) {
    return NextResponse.json(
      { error: "Paystack Pro plan code not set. Create a plan in Paystack dashboard and set PAYSTACK_PRO_PLAN_CODE." },
      { status: 503 }
    );
  }

  const appUrl = (await getAppUrlForStripeRedirects()).replace(/\/$/, "");

  try {
    const result = await initTransaction({
      email: appUser.email,
      amount: 49000,
      plan: planCode,
      callbackUrl: `${appUrl}/dashboard?paystack=callback`,
      metadata: { userId: appUser.id },
    });

    if (!result.status || !result.data?.authorization_url) {
      return NextResponse.json(
        { error: result.message || "Paystack init failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: result.data.authorization_url });
  } catch (e) {
    console.error("[paystack/checkout] failed", e);
    return NextResponse.json({ error: "Paystack checkout failed" }, { status: 502 });
  }
}
