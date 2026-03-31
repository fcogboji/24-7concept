import Image from "next/image";
import Link from "next/link";
import { DemoWidget } from "@/components/demo-widget";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { MarketingHeader } from "@/components/marketing-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">
      <MarketingHeader />

      <main>
        <section className="mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-12 md:pt-24">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-900">
              For busy teams who still reply to every email
            </p>
            <h1 className="font-[family-name:var(--font-fraunces)] text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-stone-900 sm:text-3xl md:text-4xl lg:text-5xl">
              Customer support that lives on your site — without another dashboard to learn.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
              24/7concept reads your public pages, answers common questions in plain language, and installs with a single line of code. No flowcharts, no ticket queues.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/register"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-teal-700 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 active:bg-teal-900"
              >
                Create your assistant
              </Link>
              <a
                href="#demo"
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-center text-sm font-semibold text-stone-800 hover:border-stone-400 active:bg-stone-50"
              >
                Try the demo
              </a>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              Free tier includes {50} replies per month · upgrade when you are ready
            </p>
          </div>

          <div
            id="demo"
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] sm:p-6"
          >
            <ul className="space-y-3 text-base text-stone-900">
              <li>AI Chat (Live)</li>
              <li className="text-stone-500">WhatsApp (Coming soon)</li>
              <li className="text-stone-500">Calls (Coming soon)</li>
            </ul>
          </div>
        </section>

        <section
          id="moments"
          className="border-t border-stone-200 bg-gradient-to-b from-stone-100/50 to-[#fafaf9] py-16 md:py-20"
          aria-label="Assistant in action"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-center font-[family-name:var(--font-fraunces)] text-xl font-semibold text-stone-900 sm:text-2xl md:text-3xl">
              Your assistant, in three moments
            </h2>
            <p className="mx-auto mt-3 max-w-2xl px-1 text-center text-sm text-stone-600 sm:text-base">
              Picking up every conversation, learning from your site, and answering in plain language — the way a good teammate would.
            </p>
            <div className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              <figure className="flex flex-col">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.2)]">
                  <Image
                    src="/robot-support-call.png"
                    alt="Humanoid service robot with headset, ready for customer conversations"
                    width={640}
                    height={480}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <figcaption className="mt-4 text-center">
                  <p className="text-sm font-semibold text-stone-900">There when they reach out</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    Like answering the phone — your assistant is ready the moment someone opens chat.
                  </p>
                </figcaption>
              </figure>
              <figure className="flex flex-col">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.2)]">
                  <Image
                    src="/robot-typing-laptop.png"
                    alt="Humanoid robot typing on a laptop, representing learning from your website content"
                    width={640}
                    height={480}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <figcaption className="mt-4 text-center">
                  <p className="text-sm font-semibold text-stone-900">Grounded in what you publish</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    It reads your pages so answers reflect your real offers, hours, and policies.
                  </p>
                </figcaption>
              </figure>
              <figure className="flex flex-col">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.2)]">
                  <Image
                    src="/robot-chat-replies.png"
                    alt="Humanoid assistant with chat bubbles, representing clear replies to visitors"
                    width={640}
                    height={480}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <figcaption className="mt-4 text-center">
                  <p className="text-sm font-semibold text-stone-900">Replies that read human</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    Short, helpful messages — streamed so it feels like someone is typing back.
                  </p>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="how" className="border-t border-stone-200 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900 sm:text-3xl">
              Three steps, then you are done
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Add your site",
                  body: "We pull text from the pages you already published — nothing to upload by hand for the first version.",
                },
                {
                  step: "2",
                  title: "Train once",
                  body: "We chunk the copy, embed it, and match questions to the closest passages so answers stay on-topic.",
                },
                {
                  step: "3",
                  title: "Paste the script",
                  body: "One snippet in your layout file. The chat bubble appears for every visitor, no theme edits required.",
                },
              ].map((item) => (
                <div key={item.step} className="rounded-2xl border border-stone-100 bg-stone-50/80 p-6">
                  <span className="text-sm font-bold text-teal-700">{item.step}</span>
                  <h3 className="mt-2 font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900 sm:text-3xl">
              Straightforward pricing
            </h2>
            <p className="mt-3 text-stone-600">
              Start free, move to Pro when the assistant is handling real volume.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm sm:p-8">
                <h3 className="text-lg font-semibold">Free</h3>
                <p className="mt-2 text-3xl font-semibold text-stone-900">
                  £0
                  <span className="text-base font-normal text-stone-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-stone-600">
                  <li>50 assistant replies / month</li>
                  <li>Website training + embed</li>
                  <li>Email support</li>
                </ul>
                <Link
                  href="/register"
                  className="mt-8 inline-flex w-full justify-center rounded-full border border-stone-300 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-50"
                >
                  Start free
                </Link>
              </div>
              <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-6 text-left shadow-sm sm:p-8">
                <h3 className="text-lg font-semibold text-teal-900">Pro</h3>
                <p className="mt-2 text-3xl font-semibold text-stone-900">
                  £29
                  <span className="text-base font-normal text-stone-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-2 text-sm text-stone-700">
                  <li>Unlimited replies</li>
                  <li>Priority infrastructure</li>
                  <li>Help from our team when you are stuck</li>
                </ul>
                <Link
                  href="/register"
                  className="mt-8 inline-flex w-full justify-center rounded-full bg-teal-700 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  Start free, upgrade later
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-stone-200 px-4 py-10 text-center text-sm text-stone-500 sm:px-6">
          <p>24/7concept — built for teams who would rather ship than configure.</p>
          <div className="mt-4">
            <LegalFooterLinks />
          </div>
        </footer>
      </main>

      <DemoWidget />
    </div>
  );
}
