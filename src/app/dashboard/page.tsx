import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import {
  countUserMessagesThisMonth,
  FREE_MAX_ASSISTANTS,
  FREE_MONTHLY_MESSAGE_CAP,
  subscriptionGrantsPro,
} from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckoutButton } from "./checkout-button";
import { ManageBillingButton } from "./manage-billing-button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const params = await searchParams;
  const bots = await prisma.bot.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sources: true } } },
  });

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: {
      plan: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });

  const effectivePro = user
    ? subscriptionGrantsPro(user.plan, user.subscriptionStatus)
    : false;
  const messagesUsed = await countUserMessagesThisMonth(appUser.id);
  const showFreeUsage = !effectivePro;

  return (
    <div>
      {params.checkout === "success" && (
        <p className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Thanks — payment received. Your plan should show Pro within a few seconds; refresh if needed.
        </p>
      )}
      {params.checkout === "cancel" && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Checkout was cancelled. You can upgrade anytime from this page.
        </p>
      )}

      {user?.plan === "pro" && !effectivePro && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your subscription needs attention (payment or status). Update your payment method or review your plan in
          billing — free-tier limits apply until Pro is active again.
        </p>
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-3xl font-semibold text-stone-900">
            Your assistants
          </h1>
          <p className="mt-1 text-stone-600">
            Each assistant gets its own embed code and trained content.
          </p>
          {showFreeUsage && (
            <p className="mt-3 text-sm text-stone-600">
              <span className="font-medium text-stone-800">Free plan:</span>{" "}
              {messagesUsed.toLocaleString()} / {FREE_MONTHLY_MESSAGE_CAP} assistant messages this calendar month · up
              to {FREE_MAX_ASSISTANTS} assistants.{" "}
              <span className="text-stone-500">Pro removes the message cap.</span>
            </p>
          )}
          {effectivePro && (
            <p className="mt-3 text-sm font-medium text-teal-900">Pro — unlimited assistant messages this month.</p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          {!effectivePro && <CheckoutButton />}
          {user?.stripeCustomerId && <ManageBillingButton />}
          <Link
            href="/dashboard/bots/new"
            className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-stone-900 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-stone-800 active:bg-stone-950"
          >
            New assistant
          </Link>
        </div>
      </div>

      <ul className="mt-10 space-y-3">
        {bots.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-600">
            No assistants yet.{" "}
            <Link href="/dashboard/bots/new" className="font-medium text-teal-800 underline">
              Create one
            </Link>{" "}
            and paste the script on your site.
          </li>
        )}
        {bots.map((bot) => (
          <li key={bot.id}>
            <Link
              href={`/dashboard/bots/${bot.id}`}
              className="flex min-h-[56px] items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm transition hover:border-stone-300 active:bg-stone-50 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-900">{bot.name}</p>
                <p className="break-words text-sm text-stone-500">
                  <span className="line-clamp-2 sm:line-clamp-none">
                    {bot.websiteUrl ?? "No URL yet"} · {bot._count.sources} indexed chunks
                  </span>
                </p>
              </div>
              <span className="shrink-0 text-sm text-stone-400">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
