export type Currency = "GBP" | "EUR" | "USD" | "NGN";

export type PricingTier = {
  name: string;
  blurb: string;
  monthly: Record<Currency, number>;
  features: string[];
  cta: string;
  highlight: boolean;
  enterprise?: boolean;
};

const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
]);

export function currencyForCountry(country: string | null | undefined): Currency {
  if (!country) return "USD";
  const cc = country.toUpperCase();
  if (cc === "NG") return "NGN";
  if (cc === "GB" || cc === "UK") return "GBP";
  if (EU_COUNTRIES.has(cc)) return "EUR";
  return "USD";
}

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
  USD: "$",
  NGN: "₦",
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  GBP: "en-GB",
  EUR: "en-IE",
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

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    blurb: "For small sites testing the waters.",
    monthly: { GBP: 29, EUR: 35, USD: 39, NGN: 19000 },
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
    name: "Pro",
    blurb: "For teams handling real visitor volume.",
    monthly: { GBP: 79, EUR: 89, USD: 99, NGN: 49000 },
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
    name: "Business",
    blurb: "For growing teams with multiple sites.",
    monthly: { GBP: 199, EUR: 229, USD: 249, NGN: 129000 },
    features: [
      "Unlimited replies",
      "Multiple sites & team seats",
      "Webhooks + API access",
      "Analytics & exports",
      "Dedicated onboarding",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Enterprise",
    blurb: "For large teams with custom needs.",
    monthly: { GBP: 0, EUR: 0, USD: 0, NGN: 0 },
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
