import type { Metadata } from "next";
import { Suspense } from "react";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { VerifyEmailClient } from "./verify-email-client";

export const metadata: Metadata = {
  title: "Verify email — 24/7concept",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-stone-50 px-4 py-10 sm:px-6 sm:py-12"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
      }}
    >
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-sm text-center text-sm text-stone-600">Loading…</div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
      <div className="mt-12">
        <LegalFooterLinks className="text-stone-400" />
      </div>
    </div>
  );
}
