"use client";

import Link from "next/link";

export function DashboardHelpFab() {
  return (
    <Link
      href="/terms"
      className="fixed z-20 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-violet-600 px-4 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-500"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      Help
    </Link>
  );
}
