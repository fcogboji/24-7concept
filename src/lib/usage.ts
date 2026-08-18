import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { sendPhoneQuotaAlertToOwner } from "@/lib/booking-emails";
import {
  allowancesForPlan,
  startOfUtcMonth,
  subscriptionIsActive,
} from "@/lib/plan";
import { getLogger } from "@/lib/logger";

const log = getLogger("usage");

export type PhoneCallDecision =
  | { ok: true }
  | { ok: false; reason: "inactive" | "minutes" | "concurrency"; usedMinutes: number; limitMinutes: number; concurrent: number; concurrentLimit: number };

export type UsageSnapshot = {
  plan: string;
  chatUsed: number;
  chatLimit: number;
  phoneMinutesUsed: number;
  phoneMinutesLimit: number;
  concurrent: number;
  concurrentLimit: number;
};

async function phoneMinutesUsedThisMonth(userId: string, excludeVapiCallId?: string): Promise<number> {
  const since = startOfUtcMonth();
  const [completed, live] = await Promise.all([
    prisma.callSession.aggregate({
      where: {
        bot: { userId },
        startedAt: { gte: since },
        durationSec: { not: null },
        ...(excludeVapiCallId ? { NOT: { vapiCallId: excludeVapiCallId } } : {}),
      },
      _sum: { durationSec: true },
    }),
    prisma.callSession.count({
      where: {
        bot: { userId },
        endedAt: null,
        status: { in: ["ringing", "queued", "in_progress", "in-progress"] },
        ...(excludeVapiCallId ? { NOT: { vapiCallId: excludeVapiCallId } } : {}),
      },
    }),
  ]);
  const completedMin = Math.ceil((completed._sum.durationSec ?? 0) / 60);
  // Count each *other* live call as at least 1 minute so a burst cannot sneak past the cap.
  return completedMin + live;
}

async function concurrentCalls(userId: string, excludeVapiCallId?: string): Promise<number> {
  return prisma.callSession.count({
    where: {
      bot: { userId },
      endedAt: null,
      status: { in: ["ringing", "queued", "in_progress", "in-progress"] },
      ...(excludeVapiCallId ? { NOT: { vapiCallId: excludeVapiCallId } } : {}),
    },
  });
}

export async function getWorkspaceUsage(userId: string): Promise<UsageSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user) return null;
  const limits = allowancesForPlan(user.plan);
  const [chatUsed, phoneMinutesUsed, concurrent] = await Promise.all([
    prisma.message.count({
      where: {
        role: "user",
        createdAt: { gte: startOfUtcMonth() },
        bot: { userId },
      },
    }),
    phoneMinutesUsedThisMonth(userId),
    concurrentCalls(userId),
  ]);
  return {
    plan: user.plan,
    chatUsed,
    chatLimit: limits.chatMessages,
    phoneMinutesUsed,
    phoneMinutesLimit: limits.phoneMinutes,
    concurrent,
    concurrentLimit: limits.concurrentCalls,
  };
}

export async function canWorkspaceAcceptCall(
  userId: string,
  excludeVapiCallId?: string,
): Promise<PhoneCallDecision> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  if (!user || !subscriptionIsActive(user.plan, user.subscriptionStatus)) {
    return {
      ok: false,
      reason: "inactive",
      usedMinutes: 0,
      limitMinutes: 0,
      concurrent: 0,
      concurrentLimit: 0,
    };
  }
  const limits = allowancesForPlan(user.plan);
  const [usedMinutes, concurrent] = await Promise.all([
    phoneMinutesUsedThisMonth(userId, excludeVapiCallId),
    concurrentCalls(userId, excludeVapiCallId),
  ]);
  if (concurrent >= limits.concurrentCalls) {
    return {
      ok: false,
      reason: "concurrency",
      usedMinutes,
      limitMinutes: limits.phoneMinutes,
      concurrent,
      concurrentLimit: limits.concurrentCalls,
    };
  }
  if (usedMinutes >= limits.phoneMinutes) {
    return {
      ok: false,
      reason: "minutes",
      usedMinutes,
      limitMinutes: limits.phoneMinutes,
      concurrent,
      concurrentLimit: limits.concurrentCalls,
    };
  }
  return { ok: true };
}

export async function maybeNotifyPhoneQuota(userId: string): Promise<void> {
  try {
    const usage = await getWorkspaceUsage(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!usage || !user?.email || usage.phoneMinutesLimit <= 0) return;

    const pct = Math.round((usage.phoneMinutesUsed / usage.phoneMinutesLimit) * 100);
    const level = pct >= 100 ? 100 : pct >= 80 ? 80 : 0;
    if (!level) return;

    const action = `phone.quota.${level}`;
    const already = await prisma.auditLog.findFirst({
      where: {
        userId,
        action,
        createdAt: { gte: startOfUtcMonth() },
      },
      select: { id: true },
    });
    if (already) return;

    await logAudit({
      userId,
      action,
      resourceType: "usage",
      meta: {
        usedMinutes: usage.phoneMinutesUsed,
        limitMinutes: usage.phoneMinutesLimit,
      },
    });

    await sendPhoneQuotaAlertToOwner({
      ownerEmail: user.email,
      usedMinutes: usage.phoneMinutesUsed,
      limitMinutes: usage.phoneMinutesLimit,
      percent: Math.min(pct, 100),
    });
  } catch (e) {
    log.error("quota notify failed", e, { userId });
  }
}
