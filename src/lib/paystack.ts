import crypto from "node:crypto";
import { getPaystackSecretKey } from "@/lib/paystack-env";

const API_BASE = "https://api.paystack.co";

/** Marks a checkout transaction as a trial card authorization rather than a real payment. */
export const PAYSTACK_TRIAL_AUTH_PURPOSE = "trial_card_auth";

type PaystackInitArgs = {
  email: string;
  amount: number;
  plan?: string;
  channels?: string[];
  callbackUrl: string;
  metadata: Record<string, unknown>;
};

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: { authorization_url: string; access_code: string; reference: string };
};

export async function initTransaction(args: PaystackInitArgs): Promise<PaystackInitResponse> {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not set");

  const res = await fetch(`${API_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amount * 100),
      currency: "NGN",
      plan: args.plan,
      channels: args.channels,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
  });

  return (await res.json()) as PaystackInitResponse;
}

type PaystackSubscriptionResponse = {
  status: boolean;
  message: string;
  data?: { subscription_code: string; email_token?: string; next_payment_date?: string };
};

/**
 * Paystack has no `trial_period_days`. A trial is expressed by creating the
 * subscription against an already-authorized card with `start_date` set to the
 * first billing date — Paystack charges nothing until then.
 */
export async function createSubscription(args: {
  customer: string;
  plan: string;
  authorization: string;
  startDate: Date;
}): Promise<PaystackSubscriptionResponse> {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not set");

  const res = await fetch(`${API_BASE}/subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: args.customer,
      plan: args.plan,
      authorization: args.authorization,
      start_date: args.startDate.toISOString(),
    }),
  });

  return (await res.json()) as PaystackSubscriptionResponse;
}

/** Refunds a transaction in full. Used to return the card-authorization charge. */
export async function refundTransaction(reference: string): Promise<{ status: boolean; message: string }> {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not set");

  const res = await fetch(`${API_BASE}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction: reference }),
  });

  return (await res.json()) as { status: boolean; message: string };
}

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    customer: { email: string; customer_code: string };
    metadata?: Record<string, unknown>;
    plan?: string;
  };
};

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const secret = getPaystackSecretKey();
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY not set");

  const res = await fetch(`${API_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  return (await res.json()) as PaystackVerifyResponse;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = getPaystackSecretKey();
  if (!secret || !signature) return false;
  const computed = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
