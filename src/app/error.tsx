"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#fafaf9] px-4 py-6 text-center sm:px-6"
      style={{
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
      }}
    >
      <p className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-stone-300">!</p>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-stone-600">
        We hit an unexpected error loading this page. Try again, or head back to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-stone-400">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-900 hover:border-stone-300"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
