import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
      }}
    >
      <p className="mb-6 font-[family-name:var(--font-fraunces)] text-xl font-semibold text-stone-900">
        24/7concept admin
      </p>
      <SignIn path="/admin/sign-in" routing="path" fallbackRedirectUrl="/admin" forceRedirectUrl="/admin" />
    </div>
  );
}
