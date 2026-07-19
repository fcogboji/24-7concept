import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { disconnectCalendar } from "@/lib/calendar-sync";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Disconnect a calendar connection
 */
export async function POST(req: NextRequest, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await disconnectCalendar(id, appUser.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting calendar:", error);
    return NextResponse.json({ error: "Failed to disconnect calendar" }, { status: 500 });
  }
}
