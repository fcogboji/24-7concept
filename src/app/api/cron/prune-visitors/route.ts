import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLogger } from "@/lib/logger";

const log = getLogger("cron.prune-visitors");

export const runtime = "nodejs";

/** Must match the window stated in the privacy policy (section 7). */
const RETENTION_DAYS = 90;

/**
 * Deletes visitor analytics past the retention window promised in the privacy policy.
 *
 * Authorised by CRON_SECRET. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`;
 * we also accept `?token=` so the job can be driven from any scheduler. With no secret
 * configured we refuse rather than run: an unauthenticated delete endpoint is worse
 * than a missed prune.
 */
function authorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  return req.nextUrl.searchParams.get("token") === secret;
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  try {
    const { count } = await prisma.visitorSession.deleteMany({
      where: { lastSeenAt: { lt: cutoff } },
    });

    log.info("pruned visitor sessions", { count, cutoff: cutoff.toISOString() });
    return NextResponse.json({
      ok: true,
      deleted: count,
      retentionDays: RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
    });
  } catch (e) {
    log.error("prune failed", e);
    return NextResponse.json({ error: "Prune failed" }, { status: 500 });
  }
}
