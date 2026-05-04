import { CheckoutButton } from "./checkout-button";
import { ManageBillingButton } from "./manage-billing-button";
import { SyncPlanButton } from "./sync-plan-button";
import { SubscriptionWallSignOut } from "./subscription-wall-sign-out";

export function SubscriptionWall({
  identity,
  hasStripeCustomerId,
  reason,
}: {
  identity: string;
  hasStripeCustomerId: boolean;
  reason: "no-subscription" | "needs-attention";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">faztino</span>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-gray-500 sm:inline">{identity}</span>
          <SubscriptionWallSignOut />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12">
        {reason === "needs-attention" ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Your subscription needs attention
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              We paused dashboard access because your last payment didn&apos;t go through or your subscription was
              cancelled. Update your billing details or pick a plan to restore access immediately.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
              Pick a plan to access your dashboard
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Faztino is paid-only — there&apos;s no free tier. Every plan starts with a 14-day free trial; you
              won&apos;t be charged today and can cancel anytime.
            </p>
          </>
        )}

        <div className="mt-8 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CheckoutButton plan="starter" />
            <CheckoutButton plan="pro" />
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:gap-3">
            <SyncPlanButton />
            {hasStripeCustomerId && <ManageBillingButton />}
            <p className="text-xs text-gray-500 sm:ml-auto">
              Already paid? Use “Refresh plan from Stripe” if your dashboard hasn&apos;t unlocked yet.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
