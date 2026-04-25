import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-[#fafaf9] px-4 py-6 text-center sm:px-6"
      style={{
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
      }}
    >
      <p className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold text-stone-300">404</p>
      <h1 className="mt-4 font-[family-name:var(--font-fraunces)] text-2xl font-semibold text-stone-900">
        This page is not here
      </h1>
      <p className="mt-2 max-w-md text-stone-600">
        The link may be wrong, or we moved something. Head back to faztino and keep going.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800"
      >
        Back to home
      </Link>
    </div>
  );
}
