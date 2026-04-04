/**
 * Resolve Stripe-related env vars with common aliases (Vercel / docs naming drift).
 * Used by checkout, portal, and webhook routes.
 */

function trimmed(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** Server-side secret: `STRIPE_SECRET_KEY` or Stripe-dashboard-style `STRIPE_API_KEY`. */
export function getStripeSecretKey(): string | undefined {
  return trimmed("STRIPE_SECRET_KEY") ?? trimmed("STRIPE_API_KEY");
}

/**
 * Recurring Pro subscription price id (`price_…`).
 * Accepts several names so a misnamed Vercel env still works.
 */
export function getStripeProPriceId(): string | undefined {
  return (
    trimmed("STRIPE_PRICE_PRO") ??
    trimmed("STRIPE_PRO_PRICE_ID") ??
    trimmed("STRIPE_PRICE_ID") ??
    trimmed("NEXT_PUBLIC_STRIPE_PRICE_PRO")
  );
}

export type StripeCheckoutConfigCode = "MISSING_STRIPE_SECRET" | "MISSING_STRIPE_PRICE";

export function getStripeCheckoutConfigIssue():
  | { ok: true; secretKey: string; priceId: string }
  | { ok: false; code: StripeCheckoutConfigCode } {
  const secretKey = getStripeSecretKey();
  const priceId = getStripeProPriceId();
  if (!secretKey) return { ok: false, code: "MISSING_STRIPE_SECRET" };
  if (!priceId) return { ok: false, code: "MISSING_STRIPE_PRICE" };
  return { ok: true, secretKey, priceId };
}
