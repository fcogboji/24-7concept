import Link from "next/link";
import { headers } from "next/headers";
import { DemoWidget } from "@/components/demo-widget";
import { PricingSection } from "@/components/pricing-section";
import { currencyForCountry } from "@/lib/pricing";
import { isPaystackEnabled } from "@/lib/paystack-env";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { widgetDemoScriptUrl } from "@/lib/widget-embed-snippet";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { BrandLogo, BTN_FOREST } from "@/components/brand-logo";
import { LAND } from "@/lib/brand";
import { MarketingHeader } from "@/components/marketing-header";
import { DemoOpenButton } from "@/components/demo-open-button";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { CapabilitiesSection } from "@/components/landing/capabilities-section";

/* ---------------------------------- icons --------------------------------- */

function BrainIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 4.5A3 3 0 006.6 8 2.8 2.8 0 005 10.5c0 1 .5 1.9 1.3 2.4-.2.4-.3.9-.3 1.4a3 3 0 003.5 3v1.7M14.5 4.5A3 3 0 0117.4 8 2.8 2.8 0 0119 10.5c0 1-.5 1.9-1.3 2.4.2.4.3.9.3 1.4a3 3 0 01-3.5 3v1.7M12 4v15"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 12a7.5 7.5 0 01-7.5 7.5H8L4 22v-4.4A7.5 7.5 0 0112.5 4.5 7.5 7.5 0 0120 12z"
      />
    </svg>
  );
}

function LeadIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="10" cy="8" r="3.2" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5c0-3 2.7-5 6-5 1.4 0 2.7.35 3.7 1M18 14v5M15.5 16.5h5" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="2.5" y="5" width="12" height="9" rx="1.6" strokeLinejoin="round" />
      <rect x="16" y="9" width="5.5" height="10" rx="1.4" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M6 17.5h6" />
    </svg>
  );
}

function ClockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ShieldIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* --------------------------- how-it-works artwork -------------------------- */

function StepFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-xl border border-gray-100 bg-gray-50/80">
      {children}
    </div>
  );
}

function EmbedArt() {
  return (
    <StepFrame>
      <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none" aria-hidden>
        <rect x="8" y="8" width="80" height="48" rx="5" fill="#fff" stroke="#DCE5E0" />
        <path d="M8 18h80" stroke="#DCE5E0" />
        <circle cx="15" cy="13" r="1.6" fill="#CBD5D0" />
        <circle cx="21" cy="13" r="1.6" fill="#CBD5D0" />
        <text x="48" y="42" textAnchor="middle" fontSize="15" fontWeight="700" fill={LAND.green}>
          {"</>"}
        </text>
      </svg>
    </StepFrame>
  );
}

function LearnArt() {
  return (
    <StepFrame>
      <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none" aria-hidden>
        <rect x="8" y="8" width="80" height="48" rx="5" fill="#fff" stroke="#DCE5E0" />
        <path d="M8 18h80" stroke="#DCE5E0" />
        <circle cx="15" cy="13" r="1.6" fill="#CBD5D0" />
        <circle cx="21" cy="13" r="1.6" fill="#CBD5D0" />
        <g transform="translate(38 25)" stroke={LAND.green} strokeWidth="1.8" fill="none">
          <path
            strokeLinecap="round"
            d="M7 1.5A3.5 3.5 0 003.6 5 2.6 2.6 0 002.2 7.3c0 .9.5 1.7 1.2 2.2-.2.4-.3.8-.3 1.3a2.8 2.8 0 003.3 2.7M13 1.5A3.5 3.5 0 0116.4 5a2.6 2.6 0 011.4 2.3c0 .9-.5 1.7-1.2 2.2.2.4.3.8.3 1.3a2.8 2.8 0 01-3.3 2.7M10 1v14"
          />
        </g>
      </svg>
    </StepFrame>
  );
}

function EngageArt() {
  return (
    <StepFrame>
      <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none" aria-hidden>
        <rect x="10" y="12" width="46" height="28" rx="6" fill={LAND.greenSoft} stroke={LAND.greenSoft} />
        <path d="M22 40l-4 7 10-7" fill={LAND.greenSoft} />
        <path d="M20 22h26M20 29h18" stroke={LAND.green} strokeWidth="2" strokeLinecap="round" />
        <rect x="44" y="26" width="42" height="26" rx="6" fill={LAND.ink} />
        <path d="M74 52l4 6-10-6" fill={LAND.ink} />
        <path d="M52 35h26M52 42h16" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      </svg>
    </StepFrame>
  );
}

function BookedArt() {
  return (
    <StepFrame>
      <svg className="h-16 w-24" viewBox="0 0 96 64" fill="none" aria-hidden>
        <rect x="22" y="10" width="52" height="46" rx="6" fill="#fff" stroke="#DCE5E0" />
        <path d="M22 22h52" stroke="#DCE5E0" />
        <path d="M34 10v7M62 10v7" stroke={LAND.green} strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M38 39l6 6 14-14"
          stroke={LAND.green}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </StepFrame>
  );
}

/* ----------------------------------- data ---------------------------------- */

const FEATURES = [
  {
    icon: <BrainIcon />,
    title: "Trained on Your Website & Business Info",
    body: "Delivers accurate answers customised to your business.",
  },
  {
    icon: <ChatIcon />,
    title: "24/7 Visitor Engagement",
    body: "Never miss a lead, even outside business hours.",
  },
  {
    icon: <LeadIcon />,
    title: "Capture Leads & Bookings Automatically",
    body: "Turns conversations into qualified leads and appointments.",
  },
  {
    icon: <DevicesIcon />,
    title: "Works on Desktop & Mobile",
    body: "A seamless website-chat experience across every screen size.",
  },
] as const;

const STEPS = [
  {
    step: "1",
    art: <EmbedArt />,
    title: "Add to Your Website",
    body: "Paste one line of code into your site. Takes less than 2 minutes.",
  },
  {
    step: "2",
    art: <LearnArt />,
    title: "AI Learns Your Business",
    body: "Faztino reads your site and business info to become your AI assistant.",
  },
  {
    step: "3",
    art: <EngageArt />,
    title: "Engage Visitors 24/7",
    body: "Answers questions, captures leads, and qualifies visitors automatically.",
  },
  {
    step: "4",
    art: <BookedArt />,
    title: "Get Leads & Bookings",
    body: "Receive leads and bookings directly in your inbox or calendar.",
  },
] as const;

const INDUSTRIES = [
  "Dental & Clinics",
  "Salons & Barbers",
  "Real Estate",
  "Home Services",
  "Fitness Studios",
] as const;

const HERO_META = [
  { icon: <ClockIcon />, label: "Setup in 5 mins" },
  { icon: <ShieldIcon />, label: "14-day free trial" },
  { icon: <CheckIcon />, label: "Cancel anytime" },
] as const;

/* ----------------------------------- page ---------------------------------- */

export default async function HomePage() {
  const appUrl = await getPublicAppUrl();
  const demoWidgetScriptSrc = widgetDemoScriptUrl(appUrl);
  const h = await headers();
  const country = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("x-country") ?? null;
  const currency = isPaystackEnabled() ? currencyForCountry(country) : "USD";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <MarketingHeader />

      <main>
        {/* ---------------------------------- hero --------------------------------- */}
        <section className="relative overflow-hidden" style={{ backgroundColor: LAND.greenFaint }}>
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:pb-28 lg:pt-20">
            <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
              {/* copy */}
              <div className="text-center lg:text-left">
                <h1
                  className="font-[family-name:var(--font-fraunces)] text-[2.6rem] font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.5rem]"
                  style={{ color: LAND.ink }}
                >
                  Convert Website Visitors Into{" "}
                  <span className="relative inline-block" style={{ color: LAND.green }}>
                    Leads &amp; Bookings
                    <svg
                      className="absolute -bottom-2 left-0 h-3 w-full"
                      viewBox="0 0 300 12"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <path
                        d="M2 8.5C60 3.5 150 2.5 298 6"
                        stroke={LAND.greenMid}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                    </svg>
                  </span>
                </h1>

                <p
                  className="mx-auto mt-7 max-w-xl text-lg leading-relaxed lg:mx-0"
                  style={{ color: LAND.body }}
                >
                  Faztino is your trained AI assistant that answers questions, captures leads, and books appointments
                  while you focus on running your business.
                </p>

                <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className={`inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white sm:w-auto sm:max-w-none ${BTN_FOREST}`}
                  >
                    Start Free Trial
                    <ArrowRight />
                  </Link>
                  <DemoOpenButton
                    className="inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 text-base font-semibold shadow-sm transition hover:border-gray-300 sm:w-auto sm:max-w-none"
                    style={{ color: LAND.ink }}
                    icon={
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        aria-hidden
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor" stroke="none" />
                      </svg>
                    }
                  >
                    View live demo
                  </DemoOpenButton>
                </div>

                <div
                  className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] font-medium lg:justify-start"
                  style={{ color: LAND.body }}
                >
                  {HERO_META.map((m) => (
                    <span key={m.label} className="inline-flex items-center gap-1.5">
                      <span style={{ color: LAND.green }}>{m.icon}</span>
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* mockup */}
              <div className="relative" id="demo-section">
                <HeroMockup />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------- trust bar ------------------------------- */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="-mt-10 rounded-2xl border border-gray-100 bg-white px-6 py-7 shadow-[0_20px_50px_-30px_rgba(18,51,42,0.35)]">
              <p className="text-center text-xs font-medium" style={{ color: LAND.body }}>
                Built for local businesses like
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
                {INDUSTRIES.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400"
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ backgroundColor: LAND.greenSoft, color: LAND.green }}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------- feature band ----------------------------- */}
        <section className="bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div
              className="grid gap-8 rounded-3xl px-6 py-10 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:gap-6"
              style={{ backgroundColor: LAND.greenFaint }}
            >
              {FEATURES.map((f) => (
                <div key={f.title}>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm"
                    style={{ color: LAND.green }}
                  >
                    {f.icon}
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold leading-snug" style={{ color: LAND.ink }}>
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: LAND.body }}>
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CapabilitiesSection />

        {/* ------------------------------- how it works ----------------------------- */}
        <section id="how" className="bg-white pb-20 pt-4 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold" style={{ color: LAND.green }}>
                Simple. Fast. Powerful.
              </p>
              <h2
                className="mt-2 font-[family-name:var(--font-fraunces)] text-3xl font-bold tracking-tight sm:text-4xl"
                style={{ color: LAND.ink }}
              >
                How it works
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {STEPS.map((s, i) => (
                <div key={s.step} className="relative">
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="relative">
                      {s.art}
                      <span
                        className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                        style={{ backgroundColor: LAND.green }}
                      >
                        {s.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-bold" style={{ color: LAND.ink }}>
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: LAND.body }}>
                      {s.body}
                    </p>
                  </div>

                  {i < STEPS.length - 1 && (
                    <span
                      className="absolute -right-3 top-1/3 hidden lg:block"
                      style={{ color: LAND.line }}
                      aria-hidden
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection currency={currency} />

        {/* --------------------------------- CTA band -------------------------------- */}
        <section className="py-16 md:py-20" style={{ backgroundColor: LAND.ink }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Never miss another customer
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Start your free trial today and turn website visitors into leads and bookings — automatically.
            </p>
            <Link
              href="/register"
              className={`mt-8 inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center gap-2 rounded-full px-8 text-base font-semibold text-white sm:w-auto sm:max-w-none ${BTN_FOREST}`}
            >
              Start Free Trial
              <ArrowRight />
            </Link>
            <p className="mt-4 text-xs text-white/50">Setup in 5 mins · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        <footer className="border-t border-gray-100 bg-white px-4 py-12 text-center sm:px-6">
          <div className="flex justify-center">
            <BrandLogo variant="footer" />
          </div>
          <p className="mt-2 text-sm" style={{ color: LAND.body }}>
            The AI website assistant that captures leads and books appointments for local businesses.
          </p>
          <div className="mt-6">
            <LegalFooterLinks className="text-gray-400" />
          </div>
        </footer>
      </main>

      <DemoWidget scriptSrc={demoWidgetScriptSrc} />
    </div>
  );
}
