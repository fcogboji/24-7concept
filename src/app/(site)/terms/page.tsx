import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooterLinks } from "@/components/legal-footer-links";

export const metadata: Metadata = {
  title: "Terms of Service — nestbot",
  description: "Terms governing use of nestbot.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="prose prose-stone mt-8 max-w-none space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="text-base font-semibold text-stone-900">1. Agreement</h2>
            <p className="mt-2">
              By accessing or using nestbot (“Service”), you agree to these Terms. If you use the Service on behalf of a
              company, you represent that you have authority to bind that organisation.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">2. The Service</h2>
            <p className="mt-2">
              nestbot provides tools to train an AI assistant on your website content and embed a chat widget. Features
              are described on the site and may change over time. We may suspend or limit the Service for maintenance,
              security, or legal reasons.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">3. Accounts</h2>
            <p className="mt-2">
              You are responsible for keeping your login credentials secure and for activity under your account. You must
              provide accurate information and keep it updated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">4. Acceptable use</h2>
            <p className="mt-2">You must not:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Use the Service to break the law, infringe third-party rights, or mislead end users (including about
                AI-generated content).
              </li>
              <li>
                Attempt to probe, scrape, or disrupt our systems beyond normal use, or to extract other customers’ data.
              </li>
              <li>
                Upload or train on content you do not have rights to use, or that is unlawful, abusive, or
                discriminatory.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">5. AI outputs</h2>
            <p className="mt-2">
              AI responses may be inaccurate or incomplete. You are responsible for how you deploy the assistant and for
              any reliance by your visitors or customers. You should not rely on the Service for legal, medical, or
              safety-critical decisions without human review.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">6. Fees</h2>
            <p className="mt-2">
              Paid plans are billed as described at checkout. Payments are processed by our payment provider (Stripe).
              Taxes may apply. Unless stated otherwise, subscriptions renew until cancelled. You may cancel or update
              payment methods through the billing portal linked from your account where available.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">7. Intellectual property</h2>
            <p className="mt-2">
              We retain rights in the Service, software, and branding. You retain rights in your content. You grant us a
              licence to host, process, and display your content as needed to run the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">8. Disclaimer</h2>
            <p className="mt-2">
              The Service is provided “as is” and “as available”. To the fullest extent permitted by law, we disclaim
              warranties of merchantability, fitness for a particular purpose, and non-infringement. Some jurisdictions
              do not allow certain disclaimers; in those cases our liability is limited to the maximum extent permitted.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">9. Limitation of liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, we are not liable for indirect, incidental, special,
              consequential, or punitive damages, or loss of profits, data, or goodwill. Our aggregate liability
              arising out of the Service is limited to the greater of amounts you paid us in the twelve months before the
              claim or £100, unless mandatory law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">10. Termination</h2>
            <p className="mt-2">
              You may stop using the Service at any time. We may suspend or terminate access for breach of these Terms
              or where required by law. Provisions that survive termination (e.g. liability, governing law) remain in
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">11. Governing law</h2>
            <p className="mt-2">
              These Terms are governed by the laws of England and Wales, unless mandatory consumer protections in your
              country require otherwise. Courts of England and Wales have exclusive jurisdiction, subject to those
              protections.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-stone-900">12. Contact</h2>
            <p className="mt-2">
              Legal notices:{" "}
              <a href="mailto:legal@nestbot.app" className="font-medium text-teal-800 underline">
                legal@nestbot.app
              </a>
              . Replace with your legal entity before production.
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
