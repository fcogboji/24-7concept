import Link from "next/link";
import { headers } from "next/headers";
import { DemoWidget } from "@/components/demo-widget";
import { PricingSection } from "@/components/pricing-section";
import { currencyForCountry } from "@/lib/pricing";
import { isPaystackEnabled } from "@/lib/paystack-env";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { widgetDemoScriptUrl } from "@/lib/widget-embed-snippet";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { BrandLogo, BRAND, BTN_FOREST, BTN_FOREST_OUTLINE } from "@/components/brand-logo";
import { MarketingHeader } from "@/components/marketing-header";
import { DemoOpenButton } from "@/components/demo-open-button";

const HERO_POINTS = [
  "Trained on your website & business info",
  "24/7 visitor engagement",
  "Capture leads & bookings automatically",
  "Works on desktop & mobile",
] as const;

function CheckCircle({ color = BRAND.emerald }: { color?: string }) {
  return (
    <span
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full sm:h-5 sm:w-5"
      style={{ backgroundColor: `${color}22` }}
    >
      <svg className="h-3.5 w-3.5 sm:h-3 sm:w-3" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </span>
  );
}

function Stars({ rating }: { rating: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <svg key={i} className="h-3.5 w-3.5" style={{ color: BRAND.orange }} viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.76 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.4 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69L9.05 2.93z" />
          </svg>
        ))}
      </span>
      <span className="text-xs font-semibold text-gray-500">{rating}</span>
    </span>
  );
}

function ToothIcon() {
  return (
    <svg className="h-6 w-6" style={{ color: BRAND.sky }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5.5c-2-1.6-5-1.8-6.4.3-1.2 1.8-.5 4.3 0 6.5.4 1.7.3 3 .7 4.7.3 1.3.6 2.7 1.6 2.7 1.2 0 1.2-2 1.5-3.4.2-1 .5-1.8 1-1.8s.8.8 1 1.8c.3 1.4.3 3.4 1.5 3.4 1 0 1.3-1.4 1.6-2.7.4-1.7.3-3 .7-4.7.5-2.2 1.2-4.7 0-6.5-1.4-2.1-4.4-1.9-6.4-.3z" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg className="h-6 w-6" style={{ color: BRAND.purple }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <circle cx="6" cy="6" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.1 7.9L20 18M20 6L8.1 16.1" />
    </svg>
  );
}

function HouseIcon() {
  return (
    <svg className="h-6 w-6" style={{ color: BRAND.orange }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5 9.5V20h14V9.5" />
    </svg>
  );
}

const CATEGORIES = [
  { icon: <ToothIcon />, name: "Dental Clinics", rating: "4.9/5", bg: `${BRAND.sky}14` },
  { icon: <ScissorsIcon />, name: "Salons & Barbers", rating: "4.8/5", bg: `${BRAND.purple}14` },
  { icon: <HouseIcon />, name: "Real Estate", rating: "4.8/5", bg: `${BRAND.orange}14` },
] as const;

const FEATURES = [
  {
    title: "Answers from your content",
    body: "Trained on your website and business notes, so replies match your real services, prices, and hours.",
    color: BRAND.teal,
  },
  {
    title: "Captures every lead",
    body: "Name, email, phone, page source, and full chat history land in your dashboard automatically.",
    color: BRAND.purple,
  },
  {
    title: "Books appointments",
    body: "Visitors request or confirm a time in chat, and you get notified the moment it happens.",
    color: BRAND.orange,
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Point it at your website",
    body: "Faztino reads your public pages and lets you add notes for anything your site does not cover.",
    color: BRAND.teal,
  },
  {
    step: "02",
    title: "Train the answers",
    body: "Your content is indexed so every question is matched to the closest, most relevant information.",
    color: BRAND.purple,
  },
  {
    step: "03",
    title: "Go live with one script",
    body: "Paste the embed code into your site. Conversations, leads, and bookings appear in your dashboard.",
    color: BRAND.orange,
  },
] as const;

type ChannelKind = "web" | "phone" | "whatsapp";

/** Static chat mockup shown in hero phone frames. */
function ChatMockup({ channel = "web" }: { channel?: ChannelKind }) {
  const badge =
    channel === "web"
      ? { label: "Website Chat", color: BRAND.teal }
      : channel === "phone"
        ? { label: "Phone Call", color: BRAND.orange }
        : { label: "WhatsApp", color: BRAND.emerald };

  const inputPlaceholder = channel === "phone" ? "Call summary…" : "Type a message…";

  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[320px]">
      {/* Soft multicolour glow behind the phone */}
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-60 blur-3xl"
        style={{
          background: `radial-gradient(circle at 30% 40%, ${BRAND.teal}55, transparent 55%), radial-gradient(circle at 70% 60%, ${BRAND.purple}50, transparent 55%), radial-gradient(circle at 50% 80%, ${BRAND.orange}40, transparent 50%)`,
        }}
        aria-hidden
      />
      <div className="flex h-[620px] flex-col overflow-hidden rounded-[2rem] border-[10px] border-[#1F2A44] bg-white shadow-2xl sm:h-[560px]">
        <div className="flex items-center gap-2.5 px-4 py-4 text-white sm:py-3.5" style={{ backgroundColor: BRAND.navy }}>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
            style={{ backgroundColor: badge.color }}
          >
            F
          </span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold sm:text-sm">Faztino Assistant</div>
            <div className="flex items-center gap-1 text-xs text-white/80 sm:text-[11px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
              {badge.label}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 bg-gray-50 px-3 py-4 sm:px-3 sm:py-4">
          {channel === "web" ? (
            <>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Hi! How can I help you today?
              </div>
              <div
                className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.teal }}
              >
                Do you offer teeth whitening?
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Yes, we offer professional teeth whitening. It takes about 60 minutes.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Would you like to book an appointment?
              </div>
              <div
                className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.purple }}
              >
                Yes, this Friday at 10am works.
              </div>
            </>
          ) : channel === "phone" ? (
            <>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Incoming call: “I need a haircut today.”
              </div>
              <div
                className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.orange }}
              >
                I can help with that. Do you prefer 3:30pm or 5:00pm?
              </div>
              <div className="max-w-[70%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                5:00pm works.
              </div>
              <div
                className="ml-auto max-w-[90%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.purple }}
              >
                Great, booked for 5:00pm today. Confirmation sent by SMS.
              </div>
            </>
          ) : (
            <>
              <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Hi, any slots tomorrow?
              </div>
              <div
                className="ml-auto max-w-[86%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.emerald }}
              >
                Yes, 11:00am and 2:30pm are available.
              </div>
              <div className="max-w-[74%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
                Book 2:30pm please.
              </div>
              <div
                className="ml-auto max-w-[88%] rounded-2xl rounded-tr-sm px-3 py-2.5 text-[13.5px] leading-snug text-white shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]"
                style={{ backgroundColor: BRAND.teal }}
              >
                Done! You&apos;re booked for 2:30pm tomorrow.
              </div>
            </>
          )}
          <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[13.5px] leading-snug text-gray-700 shadow-sm sm:px-3 sm:py-2 sm:text-[12.5px]">
            All conversations are saved to your dashboard automatically.
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-3 sm:py-2.5">
          <div className="flex-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-400 sm:text-[11px]">{inputPlaceholder}</div>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: BRAND.orange }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const appUrl = await getPublicAppUrl();
  const demoWidgetScriptSrc = widgetDemoScriptUrl(appUrl);
  const h = await headers();
  const country =
    h.get("x-vercel-ip-country") ??
    h.get("cf-ipcountry") ??
    h.get("x-country") ??
    null;
  const currency = isPaystackEnabled() ? currencyForCountry(country) : "USD";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      <MarketingHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: `radial-gradient(ellipse 80% 60% at 10% 0%, ${BRAND.teal}18, transparent 55%), radial-gradient(ellipse 70% 50% at 90% 10%, ${BRAND.purple}16, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, ${BRAND.orange}12, transparent 45%)`,
            }}
            aria-hidden
          />

          <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
            {/* Text column — centred */}
            <div className="mx-auto max-w-3xl text-center">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold sm:px-3 sm:py-1 sm:text-xs"
                style={{ backgroundColor: `${BRAND.teal}18`, color: BRAND.teal }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l1.9 5.7L19.6 9l-4.8 3.5L16.7 18 12 14.6 7.3 18l1.9-5.5L4.4 9l5.7-1.3L12 2z" />
                </svg>
                AI Website Assistant for Local Businesses
              </span>

              <h1
                className="mt-5 font-[family-name:var(--font-fraunces)] text-[2.65rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]"
                style={{ color: BRAND.navy }}
              >
                Convert Website Visitors Into Leads &amp; Bookings
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-xl leading-relaxed text-gray-600 sm:text-lg">
                Faztino is your trained AI assistant that answers questions, captures leads, and books appointments while
                you focus on running your business.
              </p>

              <ul className="mt-7 inline-flex flex-col items-start gap-3 text-left">
                {HERO_POINTS.map((point, i) => (
                  <li key={point} className="flex items-start gap-3 text-base text-gray-700 sm:text-[15px]">
                    <CheckCircle color={[BRAND.teal, BRAND.purple, BRAND.orange, BRAND.emerald][i % 4]} />
                    {point}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
                <Link
                  href="/register"
                  className={`inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center gap-2 rounded-full px-8 py-3 text-center text-base font-semibold text-white sm:min-h-[52px] sm:w-auto sm:max-w-none sm:text-sm ${BTN_FOREST}`}
                >
                  Start Free Trial
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <DemoOpenButton
                  className={`inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center rounded-full px-8 py-3 text-center text-base font-semibold sm:min-h-[52px] sm:w-auto sm:max-w-none sm:text-sm ${BTN_FOREST_OUTLINE}`}
                />
              </div>

              <div className="mt-6 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs font-medium text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" style={{ color: BRAND.teal }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                  </svg>
                  Setup in 5 mins
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" style={{ color: BRAND.purple }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                  </svg>
                  14-day free trial
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-4 w-4" style={{ color: BRAND.orange }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Cancel anytime
                </span>
              </div>
            </div>

            {/* Channel demos */}
            <div className="mt-14" id="demo-section">
              <div className="grid gap-6 md:grid-cols-3 md:gap-5">
                <ChatMockup channel="web" />
                <ChatMockup channel="phone" />
                <ChatMockup channel="whatsapp" />
              </div>
            </div>
          </div>

          {/* Trusted by */}
          <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
            <p className="text-center text-sm font-semibold uppercase tracking-wider text-gray-400 sm:text-xs">
              Trusted by local businesses
            </p>
            <div className="mx-auto mt-5 grid max-w-3xl gap-4 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
                    style={{ backgroundColor: c.bg }}
                  >
                    {c.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900 sm:text-sm">{c.name}</p>
                    <Stars rating={c.rating} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* More Leads */}
        <section className="border-t border-gray-100 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="font-[family-name:var(--font-fraunces)] text-4xl font-bold tracking-tight sm:text-4xl"
                style={{ color: BRAND.navy }}
              >
                More Leads. More Bookings. Less Manual Work.
              </h2>
              <p className="mt-4 text-xl leading-relaxed text-gray-600 sm:text-lg">
                Faztino handles conversations and books appointments so you never miss a customer.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 transition hover:shadow-md"
                  style={{ borderColor: undefined }}
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 sm:text-base">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600 sm:text-sm">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-gray-100 bg-gray-50 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                className="font-[family-name:var(--font-fraunces)] text-4xl font-bold tracking-tight sm:text-4xl"
                style={{ color: BRAND.navy }}
              >
                Live in three simple steps
              </h2>
              <p className="mt-3 text-xl text-gray-600 sm:text-lg">
                No complicated setup. Create your assistant, train it on your site, then paste one line of code.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <span className="text-base font-bold sm:text-sm" style={{ color: item.color }}>
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-gray-900 sm:text-lg">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-gray-600 sm:text-sm">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection currency={currency} />

        {/* CTA band */}
        <section className="py-16 md:py-20" style={{ backgroundColor: BRAND.navy }}>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-4xl font-bold tracking-tight text-white sm:text-4xl">
              Never miss another customer
            </h2>
            <p className="mt-4 text-xl sm:text-lg" style={{ color: `${BRAND.sky}cc` }}>
              Start your free trial today and turn website visitors into leads and bookings — automatically.
            </p>
            <Link
              href="/register"
              className={`mt-8 inline-flex min-h-[56px] w-full max-w-[340px] items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold text-white sm:min-h-[52px] sm:w-auto sm:max-w-none sm:text-sm ${BTN_FOREST}`}
            >
              Start Free Trial
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <p className="mt-4 text-xs text-white/50">Setup in 5 mins · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        <footer className="border-t border-gray-200 bg-white px-4 py-12 text-center sm:px-6">
          <div className="flex justify-center">
            <BrandLogo variant="footer" />
          </div>
          <p className="mt-2 text-sm text-gray-500">
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
