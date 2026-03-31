import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

export const runtime = "nodejs";

/**
 * Session probe for the widget (same shape as legacy NextAuth `/api/auth/session` for `user.id`).
 */
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
