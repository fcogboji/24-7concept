"use client";

import Link from "next/link";

export function DashboardHelpFab() {
  return (
    <Link
      href="/terms"
      className="btn-brand fixed z-20 flex h-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-full px-4 text-sm font-semibold text-white shadow-lg transition"
      style={{
        bottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      Help
    </Link>
  );
}
