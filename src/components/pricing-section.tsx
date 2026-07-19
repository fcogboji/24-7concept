"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ANNUAL_DISCOUNT,
  formatPrice,
  PRICING_TIERS,
  type Currency,
} from "@/lib/pricing";
import { BRAND, BTN_BRAND, BTN_BRAND_OUTLINE } from "@/components/brand-logo";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      style={{ color: BRAND.teal }}
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
  const [billing, setBilling] = useState<"annual" | "monthly">("annual");

  return (
    <section id="pricing" className="border-t border-gray-100 bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2
            className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: BRAND.navy }}
          >
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-600">
            Every paid plan starts with a <strong>14-day free trial</strong>. We take your card details to start the
            trial but charge nothing until day 15 — cancel any time before then and you pay nothing.
            {currency === "NGN"
              ? " Prices shown in ₦ NGN, billed via Paystack."
              : " Prices shown in $ USD; cards in other currencies are converted by your bank."}
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "annual" ? `text-white ${BTN_BRAND}` : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={
                  billing === "annual"
                    ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                    : { backgroundColor: `${BRAND.orange}22`, color: BRAND.orange }
                }
              >
                Save 25%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "monthly" ? `text-white ${BTN_BRAND}` : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-5">
          {PRICING_TIERS.map((plan) => {
            const monthly = plan.monthly[currency];
            const displayed = billing === "annual" ? monthly * (1 - ANNUAL_DISCOUNT) : monthly;
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
                    ? "relative flex flex-col overflow-hidden rounded-xl border bg-white p-8 shadow-[0_12px_40px_-20px_rgba(0,160,157,0.35)]"
                    : "flex flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm"
                }
                style={plan.highlight ? { borderColor: `${BRAND.teal}55` } : undefined}
              >
                {plan.highlight && (
                  <span
                    className="absolute right-6 top-6 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: `${BRAND.purple}18`, color: BRAND.purple }}
                  >
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 min-h-[40px] text-sm text-gray-500">{plan.blurb}</p>

                {plan.enterprise ? (
                  <p className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900">Custom</span>
                  </p>
                ) : (
                  <>
                    <p className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight text-gray-900">
                        {formatPrice(displayed, currency)}
                      </span>
                      <span className="text-gray-500">/mo</span>
                    </p>
                    {billing === "annual" && (
                      <p className="mt-1 text-xs text-gray-500">
                        Billed annually · {formatPrice(displayed * 12, currency)}/yr
                      </p>
                    )}
                  </>
                )}

                <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-700">
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
                      ? `mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white ${BTN_BRAND}`
                      : `mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-semibold ${BTN_BRAND_OUTLINE}`
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
