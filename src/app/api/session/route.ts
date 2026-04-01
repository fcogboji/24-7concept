import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

export const runtime = "nodejs";

/** Session probe for the widget (`user.id` = Prisma user id). Rewrites from `/api/auth/session` in `next.config`. */
export async function GET() {
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
