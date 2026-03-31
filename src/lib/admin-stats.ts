import { prisma } from "@/lib/prisma";

export async function getAdminOverviewStats() {
  const now = new Date();
  const dayMs = 86400000;
  const d7 = new Date(now.getTime() - 7 * dayMs);
  const prev7Start = new Date(now.getTime() - 14 * dayMs);
  const prev7End = d7;

  const [
    totalUsers,
    totalBots,
    totalMessages,
    totalLeads,
    proUsers,
    unverifiedUsers,
    usersLast7d,
    usersPrev7d,
    messagesLast24h,
    messagesLast7d,
    auditLast24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.bot.count(),
    prisma.message.count(),
    prisma.lead.count(),
    prisma.user.count({ where: { plan: "pro" } }),
    prisma.user.count({ where: { emailVerifiedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({
      where: { createdAt: { gte: prev7Start, lt: prev7End } },
    }),
    prisma.message.count({
      where: { createdAt: { gte: new Date(now.getTime() - dayMs) } },
    }),
    prisma.message.count({ where: { createdAt: { gte: d7 } } }),
    prisma.auditLog.count({
      where: { createdAt: { gte: new Date(now.getTime() - dayMs) } },
    }),
  ]);

  const signupGrowthPct =
    usersPrev7d === 0 ? null : Math.round(((usersLast7d - usersPrev7d) / usersPrev7d) * 100);

  return {
    totalUsers,
    totalBots,
    totalMessages,
    totalLeads,
    proUsers,
    unverifiedUsers,
    usersLast7d,
    usersPrev7d,
    signupGrowthPct,
    messagesLast24h,
    messagesLast7d,
    auditLast24h,
  };
}
