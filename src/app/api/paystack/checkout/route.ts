import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitStripeBilling } from "@/lib/rate-limit";
import { createPaystackCheckoutForUser } from "@/lib/checkout";
import type { PlanId } from "@/lib/pricing";

export const runtime = "nodejs";

async function readPlan(req: Request): Promise<PlanId> {
  try {
    const body = (await req.json()) as { plan?: unknown };
    if (body?.plan === "starter" || body?.plan === "pro") return body.plan;
  } catch {
    // empty body — fall through
  }
  return "pro";
}

export async function POST(req: Request) {
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

  const plan = await readPlan(req);
  const result = await createPaystackCheckoutForUser(appUser, plan);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }
  return NextResponse.json({ url: result.url });
}
