import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooterLinks } from "@/components/legal-footer-links";

export const metadata: Metadata = {
  title: "Forgot password — 24/7concept",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div
      className="flex min-h-screen flex-col justify-center bg-stone-50 px-4 py-10 sm:px-6 sm:py-12"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
      }}
    >
      <div className="mx-auto w-full max-w-sm text-center">
        <p className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
          24/7concept
        </p>
        <h1 className="mt-2 text-lg text-stone-600">Reset your password</h1>
        <p className="mt-6 text-sm text-stone-600">
          Password reset is handled on the sign-in screen. Open Log in and use the &quot;Forgot password?&quot; link
          there.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Go to sign in
        </Link>
        <div className="mt-10">
          <LegalFooterLinks className="text-stone-400" />
        </div>
      </div>
    </div>
  );
}
