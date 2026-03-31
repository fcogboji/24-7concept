import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logAudit(event: {
  userId?: string | null;
  actorClerkId?: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  meta?: Prisma.InputJsonValue | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: event.userId ?? undefined,
        actorClerkId: event.actorClerkId ?? undefined,
        actorEmail: event.actorEmail ?? undefined,
        action: event.action,
        resourceType: event.resourceType ?? undefined,
        resourceId: event.resourceId ?? undefined,
        meta: event.meta ?? undefined,
        ip: event.ip ?? undefined,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
