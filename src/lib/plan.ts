import { prisma } from "@/lib/prisma";

/**
 * True if the user has an active paid subscription (Starter or Pro), including
 * trial and past_due grace periods. There is no free tier — anyone without
 * an active sub has no access to gated features.
 *
 * `subscriptionStatus` is null for legacy / manual rows; treat as active.
 * `past_due` preserves entitlement during Stripe/Paystack dunning. Final
 * downgrade happens on customer.subscription.deleted (Stripe) or
 * subscription.disable (Paystack).
 */
export function subscriptionIsActive(plan: string, subscriptionStatus: string | null): boolean {
  if (plan !== "starter" && plan !== "pro") return false;
  if (subscriptionStatus == null || subscriptionStatus === "") return true;
  return (
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due"
  );
}

export async function canUserSendMessage(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return subscriptionIsActive(user.plan, user.subscriptionStatus);
}

export async function canUserCreateBot(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return subscriptionIsActive(user.plan, user.subscriptionStatus);
}

export async function canUserTrain(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return subscriptionIsActive(user.plan, user.subscriptionStatus);
}
