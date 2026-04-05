"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { DashboardHelpFab } from "@/components/dashboard/dashboard-help-fab";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export function DashboardShell({
  children,
  firstBotId,
  identity,
  initial,
  planLabel,
}: {
  children: React.ReactNode;
  firstBotId: string | null;
  identity: string;
  initial: string;
  planLabel: string;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (navOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [navOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setNavOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="relative min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile: fixed top bar */}
      <header
        className="fixed inset-x-0 top-0 z-[45] border-b border-gray-200 bg-white/95 px-4 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm supports-[backdrop-filter]:bg-white/90 lg:hidden"
      >
        <div className="flex h-16 items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-800 touch-manipulation"
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Link
          href="/dashboard"
          className="flex min-h-11 items-center justify-center py-1"
          onClick={closeNav}
        >
          <BrandLogo variant="compact" />
        </Link>
        <span className="w-11 shrink-0" aria-hidden />
        </div>
      </header>

      {/* Dim overlay when drawer open */}
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeNav}
        />
      ) : null}

      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar: off-canvas on small screens */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-50 flex w-[min(17.5rem,88vw)] max-w-full transform shadow-2xl shadow-black/20 transition-transform duration-200 ease-out lg:static lg:z-0 lg:w-64 lg:max-w-none lg:translate-x-0 lg:shadow-none",
            navOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            // Closed drawer is visually off-screen but can still steal taps (~88vw strip) on mobile; desktop sidebar must stay interactive.
            navOpen ? "pointer-events-auto" : "pointer-events-none lg:pointer-events-auto",
          ].join(" ")}
        >
          <DashboardSidebar
            firstBotId={firstBotId}
            identity={identity}
            initial={initial}
            planLabel={planLabel}
            onNavLinkClick={closeNav}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col pt-[calc(4rem+env(safe-area-inset-top,0px))] lg:pt-0">
          <main className="flex-1 px-4 py-6 pb-[max(6.5rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-8 lg:pb-8">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="min-h-11 text-sm font-medium leading-10 text-gray-500 hover:text-gray-800"
              >
                ← Back to site
              </Link>
              <LegalFooterLinks className="text-gray-400" />
            </div>
          </footer>
        </div>
      </div>

      <DashboardHelpFab />
    </div>
  );
}
