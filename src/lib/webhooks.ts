import { createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getLogger } from "@/lib/logger";

const log = getLogger("webhooks");

export type WebhookEvent = "lead.created" | "appointment.created";

export interface WebhookPayload {
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

function sign(secret: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
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
            headers: {
              "content-type": "application/json",
              "x-faztino-event": event,
              "x-faztino-signature": sign(h.secret, body),
            },
            body,
            signal: AbortSignal.timeout(8000),
            redirect: "manual",
          }).catch((e) => {
            log.error("delivery failed", e, { url: h.url, hookId: h.id });
          })
        )
    );
  } catch (e) {
    log.error("fireWebhooks failed", e);
  }
}
