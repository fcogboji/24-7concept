import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isDeepHealthAuthorized(req: NextRequest): boolean {
  const secret = process.env.HEALTH_CHECK_SECRET?.trim();
  if (!secret) return false;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("token") === secret) return true;

  return false;
}

/**
 * Public: minimal response (no DB details) — safe for load balancers.
 * Deep check (DB ping): set `HEALTH_CHECK_SECRET` and send
 * `Authorization: Bearer <secret>` or `?token=<secret>`.
 */
export async function GET(req: NextRequest) {
  if (!isDeepHealthAuthorized(req)) {
    return NextResponse.json({ ok: true });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      db: "up",
      time: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
