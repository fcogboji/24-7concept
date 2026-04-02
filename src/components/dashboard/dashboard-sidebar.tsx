"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useRef, useState } from "react";

function NavIcon({ name }: { name: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (name) {
    case "dashboard":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25zM3.75 15.75a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-2.25z"
          />
        </svg>
      );
    case "chat":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.176C3.202 15.42 2.25 13.746 2.25 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
          />
        </svg>
      );
    case "leads":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      );
    case "appearance":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245m0 0a3 3 0 005.78 1.128 2.25 2.25 0 002.4 2.245 4.5 4.5 0 00-8.4-2.245m0 0V12a6 6 0 1112 0v3.75m-12 0v3.75m0-3.75h12"
          />
        </svg>
      );
    case "book":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      );
    case "code":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
          />
        </svg>
      );
    default:
      return null;
  }
}

function RobotLogo() {
  return (
    <svg className="h-8 w-8 text-white" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M16 4c-2.2 0-4 1.8-4 4v1H9a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V12a3 3 0 00-3-3h-3V8c0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2v1h-4V8c0-1.1.9-2 2-2zM9 11h14a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V12a1 1 0 011-1zm3 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm8 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 22h8v2h-8v-2z" />
    </svg>
  );
}

type NavItem = { href: string; label: string; icon: string; exact?: boolean };

export function DashboardSidebar({
  firstBotId,
  identity,
  initial,
  planLabel,
  onNavLinkClick,
}: {
  firstBotId: string | null;
  identity: string;
  initial: string;
  planLabel: string;
  /** Close mobile drawer after navigation */
  onNavLinkClick?: () => void;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const avatarUrl = user?.imageUrl;

  const activeBotId = useMemo(() => {
    const m = pathname.match(/^\/dashboard\/bots\/([^/]+)/);
    return m?.[1] ?? firstBotId;
  }, [pathname, firstBotId]);

  const configBase = activeBotId ? `/dashboard/bots/${activeBotId}` : null;

  const mainNav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", exact: true },
    { href: "/dashboard/conversations", label: "Conversations", icon: "chat" },
    { href: "/dashboard/leads", label: "Leads", icon: "leads" },
  ];

  const configNav: NavItem[] = configBase
    ? [
        { href: `${configBase}/appearance`, label: "Appearance", icon: "appearance" },
        { href: `${configBase}/knowledge`, label: "Knowledge Base", icon: "book" },
        { href: `${configBase}/integration`, label: "Integration", icon: "code" },
      ]
    : [];

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  function linkClass(active: boolean) {
    return [
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-white/15 text-white" : "text-teal-100/90 hover:bg-white/10 hover:text-white",
    ].join(" ");
  }

  return (
    <aside className="flex h-full min-h-screen w-full max-w-[17.5rem] shrink-0 flex-col bg-[#0d9488] text-white lg:max-w-none lg:w-64">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-5">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onNavLinkClick}>
          <RobotLogo />
          <span className="truncate font-[family-name:var(--font-fraunces)] text-lg font-semibold tracking-tight">
            24/7concept
          </span>
        </Link>
        {onNavLinkClick ? (
          <button
            type="button"
            onClick={onNavLinkClick}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-200/80">
            Main
          </p>
          <ul className="space-y-0.5">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass(isActive(item))} onClick={onNavLinkClick}>
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-200/80">
            Configuration
          </p>
          {configNav.length === 0 ? (
            <p className="px-3 text-xs leading-relaxed text-teal-200/70">
              Create an assistant to configure appearance, knowledge, and integration.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {configNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass(isActive(item))} onClick={onNavLinkClick}>
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/*
        Profile strip (matches mock: photo + bold name + plan on teal).
        Was previously minimal; Clerk photo + stronger typography makes it obvious.
      */}
      <div
        ref={ref}
        className="relative mt-auto border-t border-white/15 bg-[#0b7f6f]/55 px-3 py-4"
      >
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/10"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          {isLoaded && avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/35"
              width={44}
              height={44}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-base font-semibold text-white ring-2 ring-white/25">
              {initial}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-tight text-white">
              {identity}
            </span>
            <span className="mt-0.5 block truncate text-xs font-normal text-teal-100/80">
              {planLabel}
            </span>
          </span>
          <svg className="h-4 w-4 shrink-0 text-teal-100/90" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute bottom-full left-3 right-3 z-30 mb-1 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
            <Link
              href="/dashboard/account"
              className="block px-3 py-2 text-sm text-stone-800 hover:bg-stone-50"
              onClick={() => {
                setMenuOpen(false);
                onNavLinkClick?.();
              }}
            >
              Account & security
            </Link>
            <button
              type="button"
              onClick={() => {
                onNavLinkClick?.();
                void signOut({ redirectUrl: "/" });
              }}
              className="w-full px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
