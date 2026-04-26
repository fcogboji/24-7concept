import type { ReactNode } from "react";
import Link from "next/link";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { subscriptionIsActive } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { syncUserPlanFromCheckoutSession, syncUserPlanFromStripeByEmail } from "@/lib/stripe-sync-user-plan";
import { redirect } from "next/navigation";
import { ConversationVolumeChart, TopicDistributionChart } from "@/components/dashboard/dashboard-charts";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { CheckoutButton } from "./checkout-button";
import { ManageBillingButton } from "./manage-billing-button";
import { SyncPlanButton } from "./sync-plan-button";

function TrendBadge({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        positive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {value}
    </span>
  );
}

function KpiCard({
  label,
  value,
  trend,
  trendPositive,
  icon,
}: {
  label: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="rounded-lg bg-teal-50 p-2 text-[#0d9488]">{icon}</div>
        <TrendBadge value={trend} positive={trendPositive} />
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) redirect("/login");

  const params = await searchParams;

  if (typeof params.session_id === "string" && params.session_id.length > 0) {
    await syncUserPlanFromCheckoutSession(params.session_id, appUser.id);
    redirect("/dashboard?checkout=success");
  }

  if (params.checkout === "success") {
    const snap = await prisma.user.findUnique({
      where: { id: appUser.id },
      select: { plan: true, subscriptionStatus: true },
    });
    if (snap && !subscriptionIsActive(snap.plan, snap.subscriptionStatus)) {
      const { ok } = await syncUserPlanFromStripeByEmail(appUser.id, appUser.email);
      if (ok) {
        redirect("/dashboard?checkout=success");
      }
    }
  }

  const bots = await prisma.bot.findMany({
    where: { userId: appUser.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sources: true, messages: true } } },
  });

  const user = await prisma.user.findUnique({
    where: { id: appUser.id },
    select: {
      plan: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });

  const isSubscribed = user
    ? subscriptionIsActive(user.plan, user.subscriptionStatus)
    : false;
  const trialing = isSubscribed && user?.subscriptionStatus === "trialing";
  const planName = user?.plan === "starter" ? "Starter" : user?.plan === "pro" ? "Pro" : null;

  const [totalMessages, totalLeads, totalChunks] = await Promise.all([
    prisma.message.count({ where: { bot: { userId: appUser.id } } }),
    prisma.lead.count({ where: { bot: { userId: appUser.id } } }),
    prisma.source.count({ where: { bot: { userId: appUser.id } } }),
  ]);

  return (
    <div>
      {params.checkout === "success" && (
        <p className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Thanks — your trial has started. If the sidebar still shows the wrong plan, click <strong>Refresh plan from Stripe</strong> below
          (your database may not have received the webhook yet, e.g. on localhost).
        </p>
      )}
      {params.checkout === "cancel" && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Checkout was cancelled. You can start your 14-day free trial anytime from this page.
        </p>
      )}

      {(user?.plan === "starter" || user?.plan === "pro") && !isSubscribed && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your subscription needs attention (payment or status). Update your payment method or review your plan in
          billing — access is paused until the subscription is active again.
        </p>
      )}

      <DashboardPageHeader
        title="Dashboard overview"
        subtitle="Welcome back — here’s how your assistants are doing."
        actions={
          <>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.082A2.02 2.02 0 0021 14.07V10a8 8 0 10-16 0v4.07a2.02 2.02 0 001.689 1.93 23.85 23.85 0 005.454 1.082m-8.5-4.072V10a4 4 0 118 0v3.01"
                />
              </svg>
            </button>
            <Link
              href="/dashboard/bots/new"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#0d9488] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f7669]"
            >
              + New assistant
            </Link>
          </>
        }
      />

      {!isSubscribed && (
        <div className="mb-8 rounded-xl border border-teal-200 bg-teal-50/60 p-5">
          <h2 className="text-base font-semibold text-teal-900">Start your 14-day free trial</h2>
          <p className="mt-1 text-sm text-teal-900/80">
            Pick a plan to use the dashboard. You won&apos;t be charged for 14 days and can cancel anytime.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <CheckoutButton plan="starter" />
            <CheckoutButton plan="pro" />
            <SyncPlanButton />
            {user?.stripeCustomerId && <ManageBillingButton />}
          </div>
        </div>
      )}

      {isSubscribed && (
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <p className="text-sm font-medium text-emerald-800">
            {planName} {trialing ? "trial — full access for 14 days" : "— full access"}.
          </p>
          {user?.stripeCustomerId && <ManageBillingButton />}
        </div>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total conversations"
          value={totalMessages.toLocaleString()}
          trend="+12.5%"
          trendPositive
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <KpiCard
          label="Indexed knowledge chunks"
          value={totalChunks.toLocaleString()}
          trend="+8.2%"
          trendPositive
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Avg. response time"
          value="—"
          trend="-2.1s"
          trendPositive={false}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Leads captured"
          value={totalLeads.toLocaleString()}
          trend="+14.3%"
          trendPositive
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
      </div>

      <div className="mb-10 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ConversationVolumeChart />
        </div>
        <div className="lg:col-span-2">
          <TopicDistributionChart />
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Your assistants</h2>
        <p className="mt-1 text-sm text-gray-600">Each assistant has its own embed code and trained content.</p>
        <ul className="mt-6 space-y-3">
          {bots.length === 0 && (
            <li className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-gray-600">
              No assistants yet.{" "}
              <Link href="/dashboard/bots/new" className="font-medium text-[#0d9488] underline">
                Create one
              </Link>{" "}
              and paste the script on your site.
            </li>
          )}
          {bots.map((bot) => (
            <li key={bot.id}>
              <Link
                href={`/dashboard/bots/${bot.id}`}
                className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:border-[#0d9488]/30 hover:shadow-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{bot.name}</p>
                  <p className="break-words text-sm text-gray-500">
                    {bot.websiteUrl ?? "No URL yet"} · {bot._count.sources} chunks · {bot._count.messages} messages
                  </p>
                </div>
                <span className="shrink-0 text-sm text-gray-400">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
