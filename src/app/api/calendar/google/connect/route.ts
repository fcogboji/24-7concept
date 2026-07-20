import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

/**
 * Initiate Google Calendar OAuth flow
 */
export async function GET() {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authUrl = getGoogleAuthUrl(appUser.id);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.json(
      { error: "Calendar sync not configured" },
      { status: 500 }
    );
  }
}
