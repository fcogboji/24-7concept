import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooterLinks } from "@/components/legal-footer-links";

export const metadata: Metadata = {
  title: "Privacy Policy — faztino",
  description: "How faztino collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <BrandLogo variant="compact" />
          </Link>
          <LegalFooterLinks />
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-stone-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-stone mt-8 max-w-none space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="text-base font-semibold text-stone-900">1. Who we are</h2>
            <p className="mt-2">
              faztino (“we”, “us”) provides an AI assistant product for websites. This policy explains how we process
              personal data when you use our website, dashboard, or customer-facing chat widget. If you use faztino on
              someone else’s site, that site’s operator is also responsible for how they use the service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">2. Data we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>Account data:</strong> email and name when you register; sign-in is handled by our
                authentication provider (Clerk), which may process credentials or OAuth according to your chosen method.
              </li>
              <li>
                <strong>Service data:</strong> assistant configuration, training content derived from URLs you provide,
                chat messages, and optional lead emails submitted through the widget.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, and similar diagnostics from your requests
                (including rate limiting and security).
              </li>
              <li>
                <strong>Billing:</strong> if you subscribe, Stripe or our payment provider handles card data; we
                receive identifiers and subscription status.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">3. How we use data</h2>
            <p className="mt-2">
              To provide and improve the service, authenticate users, prevent abuse, process payments, and comply with
              law. We process chat content to generate responses and to store conversation history as configured
              per-account.
            </p>
            <p className="mt-2">
              <strong>UK / EEA users:</strong> we rely on contract (Art. 6(1)(b) GDPR), legitimate interests (e.g.
              security and product improvement, Art. 6(1)(f)), and consent where required (e.g. non-essential cookies).
            </p>
          </section>

          <section id="cookies">
            <h2 className="text-base font-semibold text-stone-900">4. Cookies</h2>
            <p className="mt-2">
              We use <strong>essential cookies</strong> (e.g. session cookies) so you can stay signed in. Where we
              introduce analytics or marketing cookies, we will ask for your consent where required.
            </p>
            <p className="mt-2">
              <strong>Third parties:</strong> Clerk may set cookies when you sign in (including the dashboard). Stripe may
              set cookies during checkout. Those providers have their own privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">5. Processors & sub-processors</h2>
            <p className="mt-2">
              We use infrastructure and service providers (e.g. hosting, database, email provider, OpenAI for AI
              processing, Clerk for authentication, Stripe for payments). They process data in line with our
              instructions and contracts.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">6. International transfers</h2>
            <p className="mt-2">
              Your data may be processed outside your country of residence. Where we transfer personal data from the UK
              or EEA, we use appropriate safeguards (e.g. Standard Contractual Clauses) where required.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">7. Retention</h2>
            <p className="mt-2">
              We keep data only as long as needed for the purposes above or as required by law. You may delete your
              account or request deletion (subject to legal exceptions) by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">8. Your rights</h2>
            <p className="mt-2">
              Depending on where you live, you may have rights to access, correct, delete, restrict, or object to
              processing, and to data portability. You may lodge a complaint with your supervisory authority. For
              UK/EEA requests, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">9. Children</h2>
            <p className="mt-2">The service is not directed at children under 16.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">10. Changes</h2>
            <p className="mt-2">
              We may update this policy. We will post the new date at the top. Continued use after changes may
              constitute acceptance where permitted by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">11. Contact</h2>
            <p className="mt-2">
              faztino — privacy inquiries:{" "}
              <a href="mailto:privacy@faztino.app" className="font-medium text-teal-800 underline">
                privacy@faztino.app
              </a>
              . Replace this address with your company contact before production.
            </p>
          </section>
        </div>

        <p className="mt-10 text-center text-xs text-stone-500">
          This is a template. Have a lawyer review your final version.
        </p>
      </article>
    </div>
  );
}
