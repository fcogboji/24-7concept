export type Currency = "USD" | "NGN";

export type PlanId = "starter" | "pro";

export type PricingTier = {
  id?: PlanId;
  name: string;
  blurb: string;
  monthly: Record<Currency, number>;
  features: string[];
  cta: string;
  highlight: boolean;
  enterprise?: boolean;
};

export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "USD";
  return country.toUpperCase() === "NG" ? "NGN" : "USD";
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: "$",
  NGN: "₦",
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  USD: "en-US",
  NGN: "en-NG",
};

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOL[currency];
  const rounded = Math.round(amount);
  const withCommas = rounded.toLocaleString(CURRENCY_LOCALE[currency]);
  return `${symbol}${withCommas}`;
}

export const ANNUAL_DISCOUNT = 0.25;

export const PAYSTACK_AMOUNT_NGN: Record<PlanId, number> = {
  starter: 19000,
  pro: 49000,
};

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "For small sites testing the waters.",
    monthly: { USD: 39, NGN: 19000 },
    features: [
      "500 assistant replies / month",
      "Website training + embed",
      "Basic lead capture",
      "Email support",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    blurb: "For teams handling real visitor volume.",
    monthly: { USD: 99, NGN: 49000 },
    features: [
      "5,000 replies / month",
      "Calendar booking + reminders",
      "CRM sync (HubSpot, Pipedrive, Zapier)",
      "Custom branding",
      "Priority support",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Enterprise",
    blurb: "For large teams with custom needs.",
    monthly: { USD: 0, NGN: 0 },
    features: [
      "Custom reply volume",
      "SSO & advanced security",
      "Custom SLA & uptime",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Request a call",
    highlight: false,
    enterprise: true,
  },
];
