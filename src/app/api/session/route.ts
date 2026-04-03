import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { rateLimitSessionProbe } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

export const runtime = "nodejs";

/** Session probe for the widget (`user.id` = Prisma user id). Rewrites from `/api/auth/session` in `next.config`. */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await rateLimitSessionProbe(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const user = await getOrCreateAppUser();
  if (!user) {
    return NextResponse.json({});
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
    },
  });
}
