import Link from "next/link";
import { formatPrice, PRICING_TIERS, type Currency } from "@/lib/pricing";
import { BTN_FOREST, BTN_FOREST_OUTLINE } from "@/components/brand-logo";
import { LAND } from "@/lib/brand";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      style={{ color: LAND.green }}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function PricingSection({ currency }: { currency: Currency }) {
  return (
    <section id="pricing" className="border-t border-gray-100 py-16 md:py-24" style={{ backgroundColor: LAND.greenFaint }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            className="font-[family-name:var(--font-fraunces)] text-4xl font-bold tracking-tight sm:text-4xl"
            style={{ color: LAND.ink }}
          >
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-gray-600 sm:text-base">
            Every paid plan starts with a <strong>14-day free trial</strong>. We take your card details to start the
            trial but charge nothing until day 15 — cancel any time before then and you pay nothing.
            {currency === "NGN"
              ? " Prices shown in ₦ NGN, billed via Paystack."
              : " Prices shown in $ USD; cards in other currencies are converted by your bank."}
          </p>

          <p className="mt-6 text-sm font-semibold" style={{ color: LAND.green }}>
            Simple monthly billing · cancel anytime
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
            Every plan includes the website widget, live chat, booking, WhatsApp, and contact us. Phone minutes
            are metered (chat is generous because it costs far less). Need 10,000 minutes? That&apos;s a custom quote —
            not a cheap unlimited plan.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-5">
          {PRICING_TIERS.map((plan) => {
            const monthly = plan.monthly[currency];
            const href = plan.enterprise
              ? "mailto:hello@faztino.com?subject=Enterprise%20plan%20enquiry"
              : plan.id
                ? `/register?plan=${plan.id}`
                : "/register";

            return (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative flex flex-col overflow-hidden rounded-xl border bg-white p-8 shadow-[0_12px_40px_-20px_rgba(28,124,74,0.35)]"
                    : "flex flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm"
                }
                style={plan.highlight ? { borderColor: `${LAND.green}55` } : undefined}
              >
                {plan.highlight && (
                  <span
                    className="absolute right-6 top-6 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: LAND.greenSoft, color: LAND.green }}
                  >
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-gray-900 sm:text-lg">{plan.name}</h3>
                <p className="mt-2 min-h-[40px] text-base text-gray-500 sm:text-sm">{plan.blurb}</p>

                {plan.enterprise ? (
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900">Custom</span>
                  </p>
                ) : (
                  <>
                    <p className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
                        {formatPrice(monthly, currency)}
                      </span>
                      <span className="text-gray-500">/mo</span>
                    </p>
                  </>
                )}

                <ul className="mt-8 flex-1 space-y-3 text-base text-gray-700 sm:text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className={
                    plan.highlight
                      ? `mt-10 inline-flex min-h-[56px] w-full items-center justify-center rounded-full py-3 text-base font-semibold text-white sm:min-h-[48px] sm:text-sm ${BTN_FOREST}`
                      : `mt-10 inline-flex min-h-[56px] w-full items-center justify-center rounded-full py-3 text-base font-semibold sm:min-h-[48px] sm:text-sm ${BTN_FOREST_OUTLINE}`
                  }
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
