/**
 * Web Push notifications using web-push library
 * Sends push notifications to subscribed users
 */

import webpush from "web-push";
import { prisma } from "./prisma";

// VAPID keys for web push (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@faztino.com";

// Configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID keys not configured, skipping push notification");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    tag: payload.tag || "notification",
    requireInteraction: payload.requireInteraction || false,
    data: {
      url: payload.url || "/dashboard",
    },
  });

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload
        );
        sent++;
      } catch (error) {
        console.error(`Failed to send push to subscription ${sub.id}:`, error);
        failed++;

        // Remove invalid subscriptions (expired, unsubscribed, etc.)
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );

  return { sent, failed };
}

/**
 * Send new lead notification
 */
export async function sendNewLeadNotification(userId: string, leadData: {
  name?: string;
  email: string;
  temperature?: string;
}) {
  const title = "🔥 New Lead";
  const body = leadData.name
    ? `${leadData.name} (${leadData.email})`
    : leadData.email;

  return sendPushToUser(userId, {
    title,
    body,
    url: "/dashboard/leads",
    tag: "new-lead",
    requireInteraction: true, // Keep notification visible for important leads
  });
}

/**
 * Send new appointment notification
 */
export async function sendNewAppointmentNotification(userId: string, appointmentData: {
  name: string;
  service?: string;
  datetime: string;
}) {
  const title = "📅 New Appointment";
  const body = `${appointmentData.name} - ${appointmentData.service || "Appointment"} at ${appointmentData.datetime}`;

  return sendPushToUser(userId, {
    title,
    body,
    url: "/dashboard/appointments",
    tag: "new-appointment",
  });
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}
