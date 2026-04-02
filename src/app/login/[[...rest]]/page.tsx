import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { safeAppRedirectPath } from "@/lib/safe-redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const afterSignIn = safeAppRedirectPath(params.callbackUrl, appUrl);

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
        <h1 className="mt-2 text-center text-lg text-stone-600">Log in to your workspace</h1>
        {params.reset === "success" && (
          <p className="mt-4 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-sm text-teal-900">
            Password updated. You can sign in below.
          </p>
        )}
        <div className="mt-8 flex w-full justify-center overflow-x-auto">
          <div className="w-full max-w-[100vw] sm:max-w-none">
            <SignIn
              path="/login"
              routing="path"
              signUpUrl="/register"
              fallbackRedirectUrl={afterSignIn}
            />
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-stone-600">
          No account?{" "}
          <Link href="/register" className="font-medium text-teal-800 underline">
            Create one
          </Link>
        </p>
        <div className="mt-8">
          <LegalFooterLinks className="text-stone-400" />
        </div>
      </div>
    </div>
  );
}
