"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

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

  return (
    <aside className="flex w-full flex-col border-b border-stone-700 bg-stone-900 text-stone-100 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-4">
        <Link href="/admin" className="shrink-0 font-semibold tracking-tight">
          Admin
        </Link>
        <div className="shrink-0">
          <UserButton />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col md:overflow-visible md:p-2 md:pb-4 [&::-webkit-scrollbar]:hidden">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition md:whitespace-normal ${
              isActive(pathname, item.href)
                ? "bg-stone-800 text-white"
                : "text-stone-400 hover:bg-stone-800/80 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="hidden border-t border-stone-700 p-3 text-xs text-stone-500 md:block">
        <Link href="/" className="hover:text-stone-300">
          ← Public site
        </Link>
      </div>
    </aside>
  );
}
