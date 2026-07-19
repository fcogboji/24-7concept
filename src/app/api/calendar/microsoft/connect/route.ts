import { NextRequest, NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { getMicrosoftAuthUrl } from "@/lib/microsoft-calendar";

/**
 * Initiate Microsoft Calendar OAuth flow
 */
export async function GET(req: NextRequest) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authUrl = getMicrosoftAuthUrl(appUser.id);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Microsoft OAuth:", error);
    return NextResponse.json(
      { error: "Calendar sync not configured" },
      { status: 500 }
    );
  }
}
