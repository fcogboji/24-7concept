import Link from "next/link";
import { UserProfile } from "@clerk/nextjs";

export default function DashboardAccountPage() {
  return (
    <div className="min-w-0">
      <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-medium text-gray-500 hover:text-gray-800">
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-gray-900">
        Account
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Manage your profile, security, and account deletion. Removing your account here signs you out everywhere and
        deletes your Clerk user; contact us if you need workspace data removed from our database.
      </p>
      <div className="mt-8 flex w-full min-w-0 justify-center overflow-x-auto">
        <div className="w-full max-w-full">
          <UserProfile path="/dashboard/account" routing="path" />
        </div>
      </div>
    </div>
  );
}
