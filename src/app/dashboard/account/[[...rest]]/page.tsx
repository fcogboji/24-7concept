import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function DashboardAccountPage() {
  return (
    <div>
      <Link href="/dashboard" className="text-sm font-medium text-stone-500 hover:text-stone-800">
        ← Assistants
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Account
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Manage your profile, security, and account deletion. Removing your account here signs you out everywhere and
        deletes your Clerk user; contact us if you need workspace data removed from our database.
      </p>
      <div className="mt-8 flex justify-center">
        <UserProfile path="/dashboard/account" routing="path" />
      </div>
    </div>
  );
}
