import { prisma } from "@/lib/prisma";

export const FREE_MONTHLY_MESSAGE_CAP = 50;
/** Free workspaces may create up to this many assistants (excluding demo bots owned by system). */
export const FREE_MAX_ASSISTANTS = 2;

/**
 * Pro entitlements: paid plan with Stripe subscription in good standing.
 * If `subscriptionStatus` is null (legacy / manual), treat as pro when `plan === "pro"`.
 */
export function subscriptionGrantsPro(plan: string, subscriptionStatus: string | null): boolean {
  if (plan !== "pro") return false;
  if (subscriptionStatus == null || subscriptionStatus === "") return true;
  return subscriptionStatus === "active" || subscriptionStatus === "trialing";
}

export async function canUserSendMessage(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (subscriptionGrantsPro(user.plan, user.subscriptionStatus)) {
    return true;
  }

  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const used = await prisma.message.count({
    where: {
      createdAt: { gte: start },
      bot: { userId },
    },
  });

  return used < FREE_MONTHLY_MESSAGE_CAP;
}

export async function canUserCreateBot(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (subscriptionGrantsPro(user.plan, user.subscriptionStatus)) {
    return true;
  }

  const count = await prisma.bot.count({ where: { userId } });
  return count < FREE_MAX_ASSISTANTS;
}

export function monthStartUtc(): Date {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export async function countUserMessagesThisMonth(userId: string): Promise<number> {
  const start = monthStartUtc();
  return prisma.message.count({
    where: {
      createdAt: { gte: start },
      bot: { userId },
    },
  });
}
