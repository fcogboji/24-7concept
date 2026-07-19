import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeMicrosoftCode, getMicrosoftUserEmail } from "@/lib/microsoft-calendar";

/**
 * Handle Microsoft Calendar OAuth callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?calendar_error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?calendar_error=missing_params`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeMicrosoftCode(code);
    const email = await getMicrosoftUserEmail(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Store or update calendar connection
    await prisma.calendarConnection.upsert({
      where: {
        userId_provider_email: {
          userId: state,
          provider: "microsoft",
          email,
        },
      },
      create: {
        userId: state,
        provider: "microsoft",
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        active: true,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        active: true,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/calendar?connected=microsoft`
    );
  } catch (error) {
    console.error("Error handling Microsoft OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?calendar_error=failed`
    );
  }
}
