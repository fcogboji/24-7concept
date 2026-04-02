import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { safeAppRedirectPath } from "@/lib/safe-redirect";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const afterSignUp = safeAppRedirectPath(params.callbackUrl, appUrl);

  return (
    <div
      className="flex min-h-screen flex-col justify-center overflow-x-hidden bg-gray-50 px-4 py-10 sm:px-6 sm:py-12"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="mx-auto w-full max-w-sm min-w-0">
        <p className="text-center font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
          24/7concept
        </p>
        <h1 className="mt-2 text-center text-lg text-stone-600">Create your workspace</h1>
        <div className="mt-8 flex w-full justify-center overflow-x-auto">
          <div className="w-full max-w-[100vw] sm:max-w-none">
            <SignUp
              path="/register"
              routing="path"
              signInUrl="/login"
              fallbackRedirectUrl={afterSignUp}
            />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-stone-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-teal-800 underline">
            Log in
          </Link>
        </p>
        <div className="mt-8">
          <LegalFooterLinks className="text-stone-400" />
        </div>
      </div>
    </div>
  );
}
