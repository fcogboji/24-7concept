import { prisma } from "@/lib/prisma";

export type WebhookEvent = "lead.created" | "appointment.created";

export interface WebhookPayload {
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
}

export async function fireWebhooks(userId: string, event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  try {
    const hooks = await prisma.webhook.findMany({ where: { userId, active: true } });
    if (hooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      createdAt: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    await Promise.allSettled(
      hooks
        .filter((h) => h.events.split(",").map((s) => s.trim()).includes(event) || h.events.trim() === "*")
        .map((h) =>
          fetch(h.url, {
            method: "POST",
            headers: { "content-type": "application/json", "x-nestbot-event": event },
            body,
            signal: AbortSignal.timeout(8000),
          }).catch((e) => {
            console.error(`[webhook] delivery failed for ${h.url}:`, e);
          })
        )
    );
  } catch (e) {
    console.error("[webhook] fireWebhooks failed:", e);
  }
}
