import { NextResponse } from "next/server";
import { logAudit } from "@/lib/audit";
import { requireAdminApi } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/request-ip";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await prisma.user.update({
    where: { id },
    data: { emailVerifiedAt: new Date() },
  });

  await logAudit({
    userId: id,
    actorClerkId: admin.clerkUserId,
    actorEmail: admin.email,
    action: "admin.user.email_verified_manually",
    resourceType: "user",
    resourceId: id,
    meta: { email: user.email },
    ip: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
