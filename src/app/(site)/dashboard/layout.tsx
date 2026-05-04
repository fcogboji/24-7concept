import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { subscriptionIsActive } from "@/lib/plan";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SubscriptionWall } from "./subscription-wall";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    // If Clerk still has an active session here, redirecting to /login
    // creates a flicker loop (login → dashboard → login). Surface a
    // dead-end error instead so the user can sign out cleanly.
    const { userId } = await auth();
    if (userId) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-10 text-center">
          <h1 className="text-lg font-semibold text-gray-900">We couldn&apos;t load your workspace</h1>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Your account exists in Clerk but we couldn&apos;t link it to a workspace record. Please sign out and try again, or contact support.
          </p>
          <Link
            href="/login"
            prefetch={false}
            className="mt-6 inline-flex h-10 items-center rounded-full bg-[#0d9488] px-5 text-sm font-semibold text-white"
          >
            Back to login
          </Link>
        </div>
      );
    }
    redirect("/login");
  }

  const active = subscriptionIsActive(
    appUser.plan,
    appUser.subscriptionStatus ?? null
  );
  const identity = (appUser.name?.trim() || appUser.email || "User").trim();

  if (!active) {
    // Hard paywall: no dashboard rendering until the user is on Starter/Pro and
    // status is active|trialing|past_due. Webhooks (Stripe/Paystack) flip the
    // status; the SyncPlanButton on the wall is a manual fallback for delays.
    // Users mid-checkout-redirect briefly see this wall before the webhook
    // fires — that's intentional and far less risky than letting non-payers in.
    return (
      <SubscriptionWall
        identity={identity}
        hasStripeCustomerId={Boolean(appUser.stripeCustomerId)}
        reason={
          appUser.plan === "starter" || appUser.plan === "pro"
            ? "needs-attention"
            : "no-subscription"
        }
      />
    );
  }

  const planLabel =
    appUser.subscriptionStatus === "trialing"
      ? appUser.plan === "starter"
        ? "Starter (trial)"
        : "Pro (trial)"
      : appUser.plan === "starter"
        ? "Starter plan"
        : "Pro plan";
  const initial = identity.charAt(0).toUpperCase();

  const firstBot = await prisma.bot.findFirst({
    where: { userId: appUser.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return (
    <DashboardShell
      firstBotId={firstBot?.id ?? null}
      identity={identity}
      initial={initial}
      planLabel={planLabel}
    >
      {children}
    </DashboardShell>
  );
}
