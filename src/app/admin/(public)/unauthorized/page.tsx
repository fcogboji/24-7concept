import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-100 px-4 text-center">
      <h1 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Admin access required
      </h1>
      <p className="max-w-md text-stone-600">
        Your account is signed in, but it does not have the <code className="rounded bg-stone-200 px-1">admin</code>{" "}
        role in Clerk public metadata. Ask a platform owner to grant access.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <UserButton />
        <Link href="/" className="text-sm font-medium text-teal-800 underline">
          Back to site
        </Link>
      </div>
    </div>
  );
}
