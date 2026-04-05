import { SignIn } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

export default function AdminSignInPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-stone-100 px-4 py-10"
      style={{
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
      }}
    >
      <div className="mb-6 flex flex-col items-center gap-2">
        <BrandLogo variant="auth" />
        <p className="text-sm font-semibold text-stone-600">Admin</p>
      </div>
      <SignIn path="/admin/sign-in" routing="path" fallbackRedirectUrl="/admin" forceRedirectUrl="/admin" />
    </div>
  );
}
