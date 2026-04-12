function trimmed(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export function getPaystackSecretKey(): string | undefined {
  return trimmed("PAYSTACK_SECRET_KEY");
}

export function getPaystackPublicKey(): string | undefined {
  return trimmed("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY");
}

export function getPaystackProPlanCode(): string | undefined {
  return trimmed("PAYSTACK_PRO_PLAN_CODE");
}

export function isPaystackEnabled(): boolean {
  return Boolean(getPaystackSecretKey() && getPaystackPublicKey());
}
