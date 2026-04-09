"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand-logo";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/bots", label: "Assistants" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/system", label: "System" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useLayoutEffect(() => {
    setDrawerOpen(false);
    document.body.style.overflow = "";
    document.body.style.removeProperty("overflow");
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [drawerOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-4">
        <Link
          href="/admin"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight text-white"
          aria-label="24/7concept admin home"
          onClick={closeDrawer}
        >
          <span className="rounded-md bg-white/95 p-1 ring-1 ring-white/10">
            <BrandLogo variant="adminBar" />
          </span>
          <span>Admin</span>
        </Link>
        <div className="shrink-0">
          <UserButton />
        </div>
      </div>
      <nav className="flex flex-col gap-1 overflow-y-auto p-2 pb-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeDrawer}
            className={`min-h-[44px] flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive(pathname, item.href)
                ? "bg-stone-800 text-white"
                : "text-stone-400 hover:bg-stone-800/80 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-stone-700 p-3 text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-300" onClick={closeDrawer}>
          &larr; Public site
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile: fixed top bar */}
      <header className="fixed inset-x-0 top-0 z-[45] flex h-14 items-center justify-between gap-3 border-b border-stone-700 bg-stone-900 px-3 pt-[env(safe-area-inset-top,0px)] md:hidden">
        <Link
          href="/admin"
          className="flex min-h-11 items-center gap-2 font-semibold tracking-tight text-white touch-manipulation"
          onClick={closeDrawer}
        >
          <span className="rounded-md bg-white/95 p-1 ring-1 ring-white/10">
            <BrandLogo variant="adminBar" />
          </span>
          <span>Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-300 touch-manipulation"
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Dim overlay when drawer open */}
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close navigation menu"
          onClick={closeDrawer}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(17.5rem,88vw)] max-w-full flex-col bg-stone-900 text-stone-100 shadow-2xl shadow-black/20 transition-transform duration-200 ease-out md:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          !drawerOpen ? "max-md:hidden" : "",
        ].join(" ")}
      >
        {/* Close button in drawer */}
        <div className="flex justify-end px-2 pt-[env(safe-area-inset-top,0px)]">
          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-stone-400 hover:text-white touch-manipulation"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop: static sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-stone-700 bg-stone-900 text-stone-100 md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
