import { prisma } from "@/lib/prisma";

/**
 * True if the user has an active paid subscription (Starter or Pro), including
 * trial and past_due grace periods. There is no free tier — anyone without
 * an active sub has no access to gated features.
 *
 * `past_due` preserves entitlement during Stripe/Paystack dunning. Final
 * downgrade happens on customer.subscription.deleted (Stripe) or
 * subscription.disable (Paystack).
 *
 * Null/empty subscriptionStatus is treated as inactive — every paying user
 * row must have a status written by the webhook. Legacy rows should be
 * backfilled with the SQL migration in prisma/manual-migrations/.
 */
export function subscriptionIsActive(plan: string, subscriptionStatus: string | null): boolean {
  if (plan !== "starter" && plan !== "pro") return false;
  if (!subscriptionStatus) return false;
  return (
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due"
  );
}

/**
 * Included monthly usage. Phone minutes are the expensive meter; chat is cheap
 * so Pro stays generous. High-volume minutes are sold via Enterprise, not
 * bundled into a cheap flat fee.
 */
export const PLAN_ALLOWANCES = {
  starter: {
    chatMessages: 500,
    phoneMinutes: 30,
    concurrentCalls: 1,
    bots: 1,
  },
  pro: {
    chatMessages: 5_000,
    phoneMinutes: 150,
    concurrentCalls: 3,
    bots: 10,
  },
} as const;

export function allowancesForPlan(plan: string) {
  if (plan === "starter" || plan === "pro") return PLAN_ALLOWANCES[plan];
  return { chatMessages: 0, phoneMinutes: 0, concurrentCalls: 0, bots: 0 };
}

export function botLimitForPlan(plan: string): number {
  return allowancesForPlan(plan).bots;
}

export function monthlyMessageLimitForPlan(plan: string): number {
  return allowancesForPlan(plan).chatMessages;
}

export function monthlyPhoneMinutesForPlan(plan: string): number {
  return allowancesForPlan(plan).phoneMinutes;
}

export function concurrentCallLimitForPlan(plan: string): number {
  return allowancesForPlan(plan).concurrentCalls;
}

export function startOfUtcMonth(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export type SendMessageDecision =
  | { ok: true }
  | { ok: false; reason: "inactive" }
  | { ok: false; reason: "quota"; used: number; limit: number };

export async function canUserSendMessage(userId: string): Promise<SendMessageDecision> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, reason: "inactive" };
  if (!subscriptionIsActive(user.plan, user.subscriptionStatus)) {
    return { ok: false, reason: "inactive" };
  }
  const limit = monthlyMessageLimitForPlan(user.plan);
  if (limit > 0) {
    const used = await prisma.message.count({
      where: {
        role: "user",
        createdAt: { gte: startOfUtcMonth() },
        bot: { userId },
      },
    });
    if (used >= limit) {
      return { ok: false, reason: "quota", used, limit };
    }
  }
  return { ok: true };
}

export async function canUserCreateBot(userId: string): Promise<{ ok: true } | { ok: false; reason: "inactive" | "limit"; limit?: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, reason: "inactive" };
  if (!subscriptionIsActive(user.plan, user.subscriptionStatus)) {
    return { ok: false, reason: "inactive" };
  }
  const limit = botLimitForPlan(user.plan);
  const count = await prisma.bot.count({ where: { userId } });
  if (count >= limit) {
    return { ok: false, reason: "limit", limit };
  }
  return { ok: true };
}

export async function canUserTrain(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  return subscriptionIsActive(user.plan, user.subscriptionStatus);
}
