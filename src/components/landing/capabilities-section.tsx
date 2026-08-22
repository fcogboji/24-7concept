import Link from "next/link";
import { LAND } from "@/lib/brand";
import { EarlyAccessForm } from "@/components/landing/early-access-form";

type Capability = {
  title: string;
  body: string;
  icon: "chat" | "knowledge" | "leads" | "booking" | "analytics" | "integrations";
};

const AVAILABLE: Capability[] = [
  {
    title: "AI website chat",
    body: "Answers visitor questions around the clock from a widget embedded on any website.",
    icon: "chat",
  },
  {
    title: "Website-trained knowledge",
    body: "Learns from your public pages and business notes, with retraining whenever content changes.",
    icon: "knowledge",
  },
  {
    title: "Leads & conversation inbox",
    body: "Captures contact details, page context, and complete conversations in one dashboard.",
    icon: "leads",
  },
  {
    title: "Appointment booking",
    body: "Shows services and availability, books appointments, and syncs with connected calendars.",
    icon: "booking",
  },
  {
    title: "Analytics & visitor insights",
    body: "Tracks conversations, conversion, visitor sources, devices, countries, and popular pages.",
    icon: "analytics",
  },
  {
    title: "Webhooks & automation",
    body: "Sends leads and bookings to Zapier, Make, CRMs, or your own backend automatically.",
    icon: "integrations",
  },
];

function CapabilityIcon({ name }: { name: Capability["icon"] }) {
  const common = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    "aria-hidden": true,
  } as const;

  if (name === "chat") {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 11.5a7.5 7.5 0 01-7.5 7.5H8l-4 2.5v-4.4A7.5 7.5 0 1119.5 14" />
        <path strokeLinecap="round" d="M8 11.5h8M8 8.5h5" />
      </svg>
    );
  }
  if (name === "knowledge") {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5.5A2.5 2.5 0 016.5 3H11v16H6.5A2.5 2.5 0 004 21V5.5zM20 5.5A2.5 2.5 0 0017.5 3H13v16h4.5A2.5 2.5 0 0120 21V5.5z" />
      </svg>
    );
  }
  if (name === "leads") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M18 12v6M15 15h6" />
      </svg>
    );
  }
  if (name === "booking") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M7 3v4M17 3v4M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 15l2.5 2.5L16 13" />
      </svg>
    );
  }
  if (name === "analytics") {
    return (
      <svg {...common}>
        <path strokeLinecap="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12a4 4 0 004 4h2M16 12a4 4 0 00-4-4h-2M7 8H5a4 4 0 000 8h2M17 8h2a4 4 0 010 8h-2" />
    </svg>
  );
}

function ChannelIcon({ type }: { type: "phone" | "whatsapp" }) {
  if (type === "phone") {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 3.5l3 4-2 2.5a16.5 16.5 0 007.5 7.5l2.5-2 4 3c.5.4.7 1 .5 1.6-.4 1.1-1.6 2.4-4.3 2-7.5-1-13.8-7.3-14.8-14.8-.4-2.7.9-3.9 2-4.3.6-.2 1.2 0 1.6.5z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 11.5a8.5 8.5 0 01-12.6 7.4L3 20.5l1.6-4.7A8.5 8.5 0 1120.5 11.5z" />
      <path strokeLinecap="round" d="M8 9.5c1 3 2.5 4.5 5.5 5.5" />
    </svg>
  );
}

export function CapabilitiesSection() {
  return (
    <section id="features" className="border-t border-gray-100 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: LAND.green }}>
            One customer-conversion workspace
          </p>
          <h2
            className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: LAND.ink }}
          >
            Everything you need to turn interest into customers
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: LAND.body }}>
            Start with the website assistant today. Add new conversation channels as they enter early access.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: LAND.greenSoft, color: LAND.green }}
                >
                  <CapabilityIcon name={feature.icon} />
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-bold uppercase tracking-wide text-emerald-700 sm:text-xs">
                  Available now
                </span>
              </div>
              <h3 className="mt-5 text-base font-bold" style={{ color: LAND.ink }}>
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: LAND.body }}>
                {feature.body}
              </p>
            </article>
          ))}
        </div>

        <div
          id="early-access"
          className="mt-14 overflow-hidden rounded-3xl border border-emerald-100 px-5 py-10 text-center sm:px-10 sm:py-12"
          style={{ backgroundColor: LAND.greenFaint }}
        >
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-bold uppercase tracking-[0.16em] text-amber-800 sm:text-xs">
            Early access
          </span>
          <h3
            className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-bold sm:text-3xl"
            style={{ color: LAND.ink }}
          >
            Help shape Faztino’s next customer channels
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: LAND.body }}>
            These channels are not included in the product today. Join early access to validate demand, influence
            rollout, and receive launch pricing before they become generally available.
          </p>

          <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-100 bg-white p-5">
              <div className="flex items-center gap-3" style={{ color: LAND.green }}>
                <ChannelIcon type="phone" />
                <h4 className="font-bold" style={{ color: LAND.ink }}>
                  AI phone answering
                </h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: LAND.body }}>
                An inbound AI receptionist that answers FAQs, captures callers, books appointments, and saves call
                summaries and transcripts.
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-100 bg-white p-5">
              <div className="flex items-center gap-3" style={{ color: LAND.green }}>
                <ChannelIcon type="whatsapp" />
                <h4 className="font-bold" style={{ color: LAND.ink }}>
                  Inbound WhatsApp AI
                </h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: LAND.body }}>
                Let customers message your business on WhatsApp and receive knowledge-based answers, lead capture,
                and booking help.
              </p>
            </article>
          </div>

          <EarlyAccessForm />
          <p className="mt-5 text-xs" style={{ color: LAND.body }}>
            Want to use what is live now?{" "}
            <Link href="/register" className="font-semibold underline underline-offset-2" style={{ color: LAND.green }}>
              Start the website assistant trial
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
