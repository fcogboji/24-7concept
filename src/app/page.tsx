import Image from "next/image";
import Link from "next/link";
import { DemoWidget } from "@/components/demo-widget";
import { HeroRobotMarquee } from "@/components/hero-robot-marquee";
import { LandingHeroBackground } from "@/components/landing-hero-background";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { BrandLogo } from "@/components/brand-logo";
import { MarketingHeader } from "@/components/marketing-header";

const teal = "bg-[#0d9488] hover:bg-[#0f7669]";

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

export default function HomePage() {
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
                AI support for your website
              </p>
              <h1 className="font-[family-name:var(--font-fraunces)] text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[2.75rem] lg:text-[2.85rem]">
                Answers that feel like your team — without another tool to manage.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white">
                Train on your public pages, embed one script, and give visitors instant help. Built for teams who want
                maturity without complexity.
              </p>
              {/* Solid buttons (no blend) so teal / light styles stay predictable */}
              <div className="relative z-10 mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/register"
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/25 transition ${teal}`}
                >
                  Create your assistant
                </Link>
                <a
                  href="#demo-section"
                  className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-black/25 transition ${teal}`}
                >
                  View live demo
                </a>
              </div>
              <p
                className={`mt-5 inline-block max-w-full rounded-lg px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-black/20 ${teal}`}
              >
                Free tier · 50 assistant replies / month · upgrade when you need more
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
                    "Grounded answers from your own content",
                    "One embed snippet — works on any stack",
                    "Dashboard for training, leads, and conversations",
                  ].map((t) => (
                    <li key={t} className="flex gap-3 text-sm leading-relaxed text-gray-700">
                      <CheckIcon />
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-center text-xs text-gray-500">
                  Open the chat bubble (bottom-right) to try the demo on this page.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value strip */}
        <section className="border-b border-gray-100 bg-white py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
            {[
              {
                title: "Train once",
                body: "We crawl your site and index passages so replies stay accurate.",
              },
              {
                title: "Embed anywhere",
                body: "Paste one script before the closing body tag — WordPress, Shopify, or custom HTML.",
              },
              {
                title: "See what matters",
                body: "Conversation volume, leads, and knowledge — same palette as your app.",
              },
            ].map((item) => (
              <div key={item.title} className="text-center sm:text-left">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#0d9488] sm:mx-0" />
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
                Built for real customer moments
              </h2>
              <p className="mt-4 text-base text-gray-600 sm:text-lg">
                Present when visitors need you, grounded in what you publish, and clear in every reply.
              </p>
            </div>
            <div className="mt-14 grid gap-10 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10">
              {[
                {
                  img: "/robot-support-call.png",
                  alt: "Assistant ready for customer conversations",
                  title: "Always on",
                  body: "Your assistant is there the moment someone opens chat — no queues, no forms first.",
                },
                {
                  img: "/robot-typing-laptop.png",
                  alt: "Learning from website content",
                  title: "Your content, not generic AI",
                  body: "Training pulls from the pages you already ship so answers match your offers and policies.",
                },
                {
                  img: "/robot-chat-replies.png",
                  alt: "Clear chat replies",
                  title: "Human tone",
                  body: "Short, helpful messages — streamed so it feels like a teammate typing back.",
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
              No flowcharts — add your URL, train, and paste the script. Most teams ship the same day.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Add your site",
                  body: "We read public pages on your domain — nothing to upload by hand for the first pass.",
                },
                {
                  step: "02",
                  title: "Train & index",
                  body: "Content is chunked and embedded so questions match the closest passages.",
                },
                {
                  step: "03",
                  title: "Paste the script",
                  body: "One line in your layout or theme. The widget appears for every visitor.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative rounded-xl border border-gray-100 bg-gray-50/50 p-6 shadow-sm transition hover:border-teal-200/60 hover:shadow-md"
                >
                  <span className="text-xs font-bold tabular-nums text-[#0d9488]">{item.step}</span>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-gray-100 bg-gray-50 py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-gray-900 sm:text-3xl md:text-4xl">
                Simple pricing
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-gray-600">
                Start free. Move to Pro when your assistant is handling real traffic.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
              <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-gray-900">£0</span>
                  <span className="text-gray-500">/mo</span>
                </p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <CheckIcon />
                    50 assistant replies / month
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon />
                    Website training + embed
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon />
                    Email support
                  </li>
                </ul>
                <Link
                  href="/register"
                  className="mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  Start free
                </Link>
              </div>
              <div className="relative flex flex-col overflow-hidden rounded-xl border border-[#0d9488]/30 bg-white p-8 shadow-[0_12px_40px_-20px_rgba(13,148,136,0.2)]">
                <span className="absolute right-6 top-6 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f7669]">
                  Popular
                </span>
                <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
                <p className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-gray-900">£29</span>
                  <span className="text-gray-500">/mo</span>
                </p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <CheckIcon />
                    Unlimited replies
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon />
                    Priority infrastructure
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon />
                    Help when you are stuck
                  </li>
                </ul>
                <Link
                  href="/register"
                  className={`mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white shadow-sm ${teal}`}
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA band */}
        <section className="border-t border-gray-100 bg-[#0d9488] py-14 md:py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-white sm:text-3xl">
              Ready to ship your assistant?
            </h2>
            <p className="mt-3 text-teal-100">
              Create an account, connect your site, and embed in minutes.
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
          <p className="mt-2 text-sm text-gray-500">Built for teams who ship — not configure.</p>
          <div className="mt-6">
            <LegalFooterLinks className="text-gray-400" />
          </div>
        </footer>
      </main>

      <DemoWidget />
    </div>
  );
}
