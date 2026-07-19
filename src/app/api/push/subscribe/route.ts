import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

/**
 * Subscribe to push notifications
 */
export async function POST(req: NextRequest) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
    }

    // Get user agent for debugging
    const userAgent = req.headers.get("user-agent") || undefined;

    // Store subscription
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: appUser.id,
          endpoint: subscription.endpoint,
        },
      },
      create: {
        userId: appUser.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
