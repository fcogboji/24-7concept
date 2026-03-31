"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

const links = [
  { href: "#moments", label: "See it in action" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
] as const;

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user?.id);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-tight text-stone-900 sm:text-xl"
            onClick={() => setOpen(false)}
          >
            24/7concept
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-stone-600 md:flex lg:gap-6">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-stone-900">
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="hover:text-stone-900">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-full bg-stone-900 px-4 py-2.5 text-white hover:bg-stone-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-stone-900">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-stone-900 px-4 py-2.5 text-white hover:bg-stone-800"
                >
                  Start free
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-800 touch-manipulation md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 z-[100] flex flex-col bg-white md:hidden"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="flex min-h-14 items-center justify-between border-b border-stone-200 px-4">
            <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-stone-900">
              Menu
            </span>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-800 touch-manipulation"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6L18 18M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-3.5 text-lg font-medium text-stone-800 active:bg-stone-100"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-3.5 text-lg font-medium text-stone-800 active:bg-stone-100"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="mt-3 rounded-full bg-stone-900 px-4 py-3.5 text-center text-lg font-semibold text-white active:bg-stone-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3.5 text-lg font-medium text-stone-800 active:bg-stone-100"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="mt-3 rounded-full bg-stone-900 px-4 py-3.5 text-center text-lg font-semibold text-white active:bg-stone-800"
                  onClick={() => setOpen(false)}
                >
                  Start free
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
