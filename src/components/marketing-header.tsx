"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { useClerkAdminNav } from "@/hooks/use-clerk-admin-nav";

const links = [
  { href: "#moments", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
] as const;

const accent = "bg-[#0d9488] hover:bg-[#0f7669]";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const isLoggedIn = Boolean(isSignedIn);
  const showAdminNav = useClerkAdminNav();

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:min-h-[4.5rem] sm:px-6">
          <Link
            href="/"
            className="flex items-center outline-offset-4 rounded-md"
            onClick={() => setOpen(false)}
          >
            <BrandLogo variant="header" priority />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-gray-900"
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="transition-colors hover:text-gray-900">
                  Dashboard
                </Link>
                {showAdminNav ? (
                  <Link href="/admin" className="transition-colors hover:text-gray-900">
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white ${accent}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="transition-colors hover:text-gray-900">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${accent}`}
                >
                  Start free
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-800 touch-manipulation md:hidden"
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
          <div className="flex min-h-14 items-center justify-between border-b border-gray-200 px-4">
            <span className="font-[family-name:var(--font-fraunces)] text-lg font-semibold text-gray-900">
              Menu
            </span>
            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-800 touch-manipulation"
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
                className="rounded-xl px-3 py-3.5 text-lg font-medium text-gray-800 active:bg-gray-100"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-xl px-3 py-3.5 text-lg font-medium text-gray-800 active:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Dashboard
                </Link>
                {showAdminNav ? (
                  <Link
                    href="/admin"
                    className="rounded-xl px-3 py-3.5 text-lg font-medium text-gray-800 active:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    Admin
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut({ redirectUrl: "/" });
                  }}
                  className={`mt-3 rounded-full px-4 py-3.5 text-center text-lg font-semibold text-white ${accent}`}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-3.5 text-lg font-medium text-gray-800 active:bg-gray-100"
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`mt-3 rounded-full px-4 py-3.5 text-center text-lg font-semibold text-white ${accent}`}
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
