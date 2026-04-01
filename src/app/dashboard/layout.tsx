import Link from "next/link";
import { LegalFooterLinks } from "@/components/legal-footer-links";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { subscriptionGrantsPro } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UserMenu } from "./user-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    redirect("/login");
  }

  const effectivePro = subscriptionGrantsPro(
    appUser.plan,
    appUser.subscriptionStatus ?? null
  );
  const badgeLabel =
    appUser.plan === "pro" && !effectivePro ? "Pro (inactive)" : effectivePro ? "Pro" : "Free";
  const identity = (appUser.name?.trim() || appUser.email || "User").trim();
  const initial = identity.charAt(0).toUpperCase();
  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: { stripeCustomerId: true },
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/dashboard"
              className="shrink-0 font-[family-name:var(--font-fraunces)] text-lg font-semibold text-stone-900"
            >
              24/7concept
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-stone-600">
              <Link href="/dashboard" className="rounded-lg py-2 hover:text-stone-900">
                Assistants
              </Link>
              <Link href="/dashboard/account" className="rounded-lg py-2 hover:text-stone-900">
                Account
              </Link>
            </nav>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              ← Back to site
            </Link>
            <UserMenu identity={identity} initial={initial} canManageBilling={Boolean(user?.stripeCustomerId)} />
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                appUser.plan === "pro" && !effectivePro
                  ? "bg-amber-100 text-amber-900"
                  : effectivePro
                    ? "bg-teal-100 text-teal-900"
                    : "bg-stone-100 text-stone-700"
              }`}
            >
              {badgeLabel}
            </span>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
      <footer className="border-t border-stone-200 bg-white py-6">
        <LegalFooterLinks className="text-stone-400" />
      </footer>
    </div>
  );
}
