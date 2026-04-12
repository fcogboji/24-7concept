import crypto from "node:crypto";
import { getPaystackSecretKey } from "@/lib/paystack-env";

const API_BASE = "https://api.paystack.co";

type PaystackInitArgs = {
  email: string;
  amount: number;
  plan?: string;
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
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
  });

  return (await res.json()) as PaystackInitResponse;
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
