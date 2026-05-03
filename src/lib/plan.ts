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

const BOT_LIMITS: Record<string, number> = {
  starter: 1,
  pro: 10,
};

export function botLimitForPlan(plan: string): number {
  return BOT_LIMITS[plan] ?? 0;
}

/**
 * Hard monthly message ceilings per plan. These cap how many *visitor*
 * messages a workspace can absorb before /api/chat starts returning 402,
 * which is the brake against a malicious embed running up the OpenAI bill.
 * Numbers are intentionally generous; tighten as real usage data comes in.
 */
const MONTHLY_MESSAGE_LIMITS: Record<string, number> = {
  starter: 2_000,
  pro: 20_000,
};

export function monthlyMessageLimitForPlan(plan: string): number {
  return MONTHLY_MESSAGE_LIMITS[plan] ?? 0;
}

function startOfUtcMonth(now: Date = new Date()): Date {
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
