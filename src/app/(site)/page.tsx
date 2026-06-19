import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { DemoWidget } from "@/components/demo-widget";
import { PricingSection } from "@/components/pricing-section";
import { currencyForCountry } from "@/lib/pricing";
import { isPaystackEnabled } from "@/lib/paystack-env";
import { getPublicAppUrl } from "@/lib/public-app-url";
import { widgetDemoScriptUrl } from "@/lib/widget-embed-snippet";
import { HeroRobotMarquee } from "@/components/hero-robot-marquee";
import { LandingHeroBackground } from "@/components/landing-hero-background";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingHeader } from "@/components/marketing-header";
import { DemoOpenButton } from "@/components/demo-open-button";

const teal = "bg-[#0d9488] hover:bg-[#0f7669]";

const brandAccents = ["#E53238", "#0064D2", "#F5AF02"] as const;

const HERO_IMAGES = [
  { src: "/robot-support-call.png", alt: "Assistant ready for conversations" },
  { src: "/robot-typing-laptop.png", alt: "Learning from your website" },
  { src: "/robot-chat-replies.png", alt: "Clear replies to visitors" },
] as const;

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
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
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      <MarketingHeader />

      <main>
        {/* Hero — curved navy / white split + floating image cards */}
        <section className="relative isolate min-h-[min(560px,92vh)] overflow-hidden border-b border-gray-100 sm:min-h-[620px] lg:min-h-[640px]">
          <LandingHeroBackground />

          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-12 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-16 lg:flex-row lg:items-center lg:gap-8 lg:pb-24 lg:pt-12 xl:gap-12">
            <div className="w-full max-lg:px-6 lg:max-w-none lg:w-[46%] lg:min-w-0 lg:px-0 lg:pr-4">
              <p className="mb-5 inline-flex items-center rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                For appointment-led local businesses
              </p>
              <h1 className="font-[family-name:var(--font-fraunces)] text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[2.75rem] lg:text-[2.85rem]">
                Turn website visitors into leads and booking requests while your team is busy.
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-snug text-white">
                Faztino answers common questions from your own website, captures contact details, and helps visitors ask
                for appointments before they disappear.
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90">
                Add a <strong className="font-semibold text-white">trained website assistant</strong> in one script. It
                uses your public pages and business notes, keeps conversations on topic, and gives every serious visitor
                a clear next step: ask, leave details, or request a booking.
              </p>
              <ul className="mt-6 max-w-xl space-y-2.5 text-sm leading-relaxed text-white/85 sm:text-[0.9375rem]">
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" aria-hidden />
                  <span>
                    <span className="font-semibold text-white">Dental &amp; aesthetic practices</span> — capture patient
                    intent when the phone is engaged or the desk is closed.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" aria-hidden />
                  <span>
                    <span className="font-semibold text-white">Salons &amp; barbers — women&apos;s &amp; men&apos;s</span>{" "}
                    — collect service, timing, and contact details from visitors browsing after hours.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" aria-hidden />
                  <span>
                    <span className="font-semibold text-white">Real estate</span> — qualify viewing and valuation
                    enquiries from people browsing serious properties after work.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" aria-hidden />
                  <span>
                    <span className="font-semibold text-white">Law firms &amp; solicitors</span> — capture enquiry
                    context clearly before a human follows up.
                  </span>
                </li>
              </ul>
              {/* Solid buttons (no blend) so teal / light styles stay predictable */}
              <div className="relative z-10 mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/register"
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/25 transition ${teal}`}
                >
                  Create your assistant
                </Link>
                <DemoOpenButton
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/25 transition ${teal}`}
                />
              </div>
              <p
                className={`mt-5 inline-block max-w-full rounded-lg px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-black/20 ${teal}`}
              >
                From $39/mo · website-trained replies · lead capture · booking requests
              </p>
            </div>

            {/* Three robot cards — infinite sliding marquee (duplicated strip) */}
            <div className="relative flex min-h-[240px] min-w-0 flex-1 items-center justify-end max-lg:px-6 sm:min-h-[300px] lg:min-h-[380px] lg:flex-[1.1] lg:px-0 lg:pl-4">
              <HeroRobotMarquee images={HERO_IMAGES} />
            </div>
          </div>
        </section>

        {/* Demo / product card (moved below hero for layout parity with reference) */}
        <section id="demo-section" className="scroll-mt-24 border-b border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_20px_60px_-24px_rgba(13,148,136,0.2)]">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-[#0d9488] px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="h-2 w-2 rounded-full bg-white/25" />
                <span className="ml-2 text-xs font-medium text-white/95">Your site — live assistant</span>
              </div>
              <div className="space-y-4 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">What you get</p>
                <ul className="space-y-3">
                  {[
                    "Answers from your website content instead of guessing from generic AI knowledge",
                    "Captures name, email, phone, page source, and conversation history in your dashboard",
                    "Creates booking requests and sends email notifications when visitors are ready to act",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                      <CheckIcon />
                      {t}
                    </li>
                  ))}
                </ul>
                <DemoOpenButton className="w-full rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-center text-xs font-semibold text-gray-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900" />
              </div>
            </div>
            <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live lead preview</p>
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-800">Hot lead</span>
              </div>
              <p className="mt-4 font-semibold text-gray-900">New booking request captured</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Visitor asked about Saturday availability, left a phone number, and viewed your whitening service page.
              </p>
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                Suggested WhatsApp reply ready: “Hi Sarah, thanks for asking about whitening. Are you still looking for
                a Saturday appointment?”
              </div>
            </div>
          </div>
        </section>

        {/* Value strip */}
        <section className="border-b border-gray-100 bg-white py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                title: "Train on your truth",
                body: "We index what you already publish — fees, services, areas — so guidance stays accurate to your business.",
              },
              {
                title: "One line of code",
                body: "Paste before the closing body tag on WordPress, Shopify, or custom HTML; the widget feels part of your site.",
              },
              {
                title: "Outcomes, not vanity metrics",
                body: "Conversations, leads, appointments, and follow-up signals in one place — not vanity chatbot metrics.",
              },
            ].map((item, i) => (
              <div key={item.title} className="text-center sm:text-left">
                <div
                  className="mx-auto mb-3 h-1 w-10 rounded-full sm:mx-0"
                  style={{ backgroundColor: brandAccents[i % brandAccents.length] }}
                />
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Moments */}
        <section
          id="moments"
          className="border-t border-gray-100 bg-gray-50 py-16 md:py-24"
          aria-label="Product story"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
                Catch the moment before they leave
              </h2>
              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                Visitors rarely come back later. Faztino gives them a useful answer now, then turns interest into a lead
                or booking request your team can actually follow up.
              </p>
            </div>
            <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
              {[
                {
                  img: "/robot-support-call.png",
                  alt: "Assistant ready for customer conversations",
                  title: "After hours and peak hours",
                  body: "When someone opens chat after work, during lunch, or while your line is engaged, they still get a helpful answer and a way to leave details.",
                },
                {
                  img: "/robot-typing-laptop.png",
                  alt: "Learning from website content",
                  title: "Your site, your answers",
                  body: "Training uses the pages and notes you already maintain, so replies reflect your services, prices, areas, tone, and boundaries.",
                },
                {
                  img: "/robot-chat-replies.png",
                  alt: "Clear chat replies",
                  title: "Conversations with a next step",
                  body: "Short, purposeful replies guide visitors toward leaving contact details, requesting a service, or booking a time.",
                },
              ].map((item) => (
                <figure key={item.title} className="flex flex-col">
                  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                    <Image
                      src={item.img}
                      alt={item.alt}
                      width={640}
                      height={480}
                      className="h-auto w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <figcaption className="mt-5">
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="border-t border-gray-100 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
              Three steps to go live
            </h2>
            <p className="mt-3 max-w-2xl text-gray-600">
              No complicated setup. Create an assistant, train it on your site, then paste one line of code into your
              website.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Point it at your website",
                  body: "Faztino reads public pages on your domain and lets you add business notes for details your site does not cover.",
                },
                {
                  step: "02",
                  title: "Train the answers",
                  body: "Your content is indexed so visitor questions are matched with the closest relevant information before the assistant replies.",
                },
                {
                  step: "03",
                  title: "Go live with one script",
                  body: "Paste the embed code into your site. Conversations, leads, and appointment requests appear in your dashboard.",
                },
              ].map((item, i) => (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm transition hover:border-teal-200/60 hover:shadow-md"
                >
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{ color: brandAccents[i % brandAccents.length] }}
                  >
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PricingSection currency={currency} />

        {/* CTA band */}
        <section className="border-t border-gray-100 bg-[#0d9488] py-14 md:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              Ready to capture the visitors you already paid to attract?
            </h2>
            <p className="mt-3 text-teal-100">
              Create an account, train your assistant, and give every visitor a clear path to ask, enquire, or book.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0d9488] shadow-lg transition hover:bg-teal-50"
            >
              Create your assistant
            </Link>
          </div>
        </section>

        <footer className="border-t border-gray-200 bg-white px-4 py-12 text-center sm:px-6">
          <div className="flex justify-center">
            <BrandLogo variant="footer" />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Built for busy teams, missed calls, after-hours visitors, and the leads that should not slip away.
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
