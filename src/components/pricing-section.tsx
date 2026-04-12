"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ANNUAL_DISCOUNT,
  CURRENCY_SYMBOL,
  formatPrice,
  PRICING_TIERS,
  type Currency,
} from "@/lib/pricing";

const teal = "bg-[#0d9488] hover:bg-[#0f7669]";

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-600">
            Prices shown in {CURRENCY_SYMBOL[currency]} {currency}. 14-day free trial on every tier — cancel anytime.
          </p>

          <div className="mt-8 inline-flex items-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBilling("annual")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "annual" ? "bg-[#0d9488] text-white shadow" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  billing === "annual" ? "bg-white/20 text-white" : "bg-teal-50 text-[#0f7669]"
                }`}
              >
                Save 25%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                billing === "monthly" ? "bg-[#0d9488] text-white shadow" : "text-gray-600 hover:text-gray-900"
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
            const href = plan.enterprise ? "/contact" : "/register";

            return (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative flex flex-col overflow-hidden rounded-xl border border-[#0d9488]/30 bg-white p-8 shadow-[0_12px_40px_-20px_rgba(13,148,136,0.2)]"
                    : "flex flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm"
                }
              >
                {plan.highlight && (
                  <span className="absolute right-6 top-6 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f7669]">
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
                      ? `mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white shadow-sm ${teal}`
                      : "mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
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
