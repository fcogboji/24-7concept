import type { Metadata } from "next";
import Link from "next/link";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { ForgotPasswordForm } from "./forgot-password-form";

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
      <div className="mx-auto w-full max-w-sm">
        <p className="text-center font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
          24/7concept
        </p>
        <h1 className="mt-2 text-center text-lg text-stone-600">Reset your password</h1>
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm text-stone-600">
          <Link href="/login" className="font-medium text-teal-800 underline">
            Sign in
          </Link>
        </p>
        <div className="mt-8">
          <LegalFooterLinks className="text-stone-400" />
        </div>
      </div>
    </div>
  );
}
