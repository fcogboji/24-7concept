import { prisma } from "@/lib/prisma";
import {
  createVapiPhoneNumber,
  deleteVapiAssistant,
  deleteVapiPhoneNumber,
  isVapiConfigured,
  syncVapiAssistant,
  updateVapiPhoneAssistant,
} from "@/lib/vapi";
import { getLogger } from "@/lib/logger";

const log = getLogger("phone-lifecycle");

export async function syncPhoneAssistantForBot(botId: string): Promise<{ assistantId: string }> {
  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    include: {
      bookingConfig: { select: { enabled: true } },
      phoneConfig: true,
      sources: { take: 8, orderBy: { createdAt: "desc" }, select: { content: true } },
    },
  });
  if (!bot) throw new Error("Bot not found");
  if (!isVapiConfigured()) throw new Error("VAPI_API_KEY is not configured on the server");

  const knowledgePreview = bot.sources.map((s) => s.content.slice(0, 400)).join("\n---\n");
  const assistantId = await syncVapiAssistant({
    botId: bot.id,
    botName: bot.name,
    businessInfo: bot.businessInfo,
    greeting: bot.phoneConfig?.greeting,
    voice: bot.phoneConfig?.voice,
    bookingEnabled: Boolean(bot.bookingConfig?.enabled),
    forwardingNumber: bot.phoneConfig?.forwardingNumber,
    existingAssistantId: bot.phoneConfig?.vapiAssistantId,
    knowledgePreview,
  });

  await prisma.phoneConfig.upsert({
    where: { botId },
    create: {
      botId,
      enabled: true,
      vapiAssistantId: assistantId,
      greeting: bot.phoneConfig?.greeting,
      voice: bot.phoneConfig?.voice,
      forwardingNumber: bot.phoneConfig?.forwardingNumber,
      businessHoursOnly: bot.phoneConfig?.businessHoursOnly ?? false,
    },
    update: {
      vapiAssistantId: assistantId,
      enabled: true,
    },
  });

  return { assistantId };
}

export async function assignPhoneNumberForBot(botId: string, areaCode?: string) {
  const cfg = await prisma.phoneConfig.findUnique({ where: { botId } });
  let assistantId = cfg?.vapiAssistantId;
  if (!assistantId) {
    const synced = await syncPhoneAssistantForBot(botId);
    assistantId = synced.assistantId;
  }

  if (cfg?.vapiPhoneNumberId && cfg.e164Number) {
    await updateVapiPhoneAssistant(cfg.vapiPhoneNumberId, assistantId);
    return { e164Number: cfg.e164Number, vapiPhoneNumberId: cfg.vapiPhoneNumberId };
  }

  const created = await createVapiPhoneNumber({ assistantId, areaCode });

  // Only one concurrent assign may claim an empty slot; losers release the orphan number.
  const claimed = await prisma.phoneConfig.updateMany({
    where: { botId, vapiPhoneNumberId: null },
    data: {
      vapiPhoneNumberId: created.id,
      e164Number: created.number,
      enabled: true,
      vapiAssistantId: assistantId,
    },
  });

  if (claimed.count === 0) {
    await deleteVapiPhoneNumber(created.id);
    const existing = await prisma.phoneConfig.findUnique({ where: { botId } });
    if (existing?.vapiPhoneNumberId && existing.e164Number) {
      return { e164Number: existing.e164Number, vapiPhoneNumberId: existing.vapiPhoneNumberId };
    }
    throw new Error("Could not assign phone number — please try again");
  }

  return { e164Number: created.number, vapiPhoneNumberId: created.id };
}

export async function disablePhoneForBot(botId: string): Promise<void> {
  const cfg = await prisma.phoneConfig.findUnique({ where: { botId } });
  if (!cfg) return;

  try {
    if (cfg.vapiPhoneNumberId) {
      await updateVapiPhoneAssistant(cfg.vapiPhoneNumberId, null);
    }
  } catch (e) {
    log.error("detach phone failed", e, { botId });
  }

  await prisma.phoneConfig.update({
    where: { botId },
    data: { enabled: false },
  });
}

/** Full teardown: detach number + delete assistant (used when releasing). */
export async function releasePhoneForBot(botId: string): Promise<void> {
  const cfg = await prisma.phoneConfig.findUnique({ where: { botId } });
  if (!cfg) return;

  if (cfg.vapiPhoneNumberId) {
    await deleteVapiPhoneNumber(cfg.vapiPhoneNumberId);
  }
  if (cfg.vapiAssistantId) {
    await deleteVapiAssistant(cfg.vapiAssistantId);
  }

  await prisma.phoneConfig.update({
    where: { botId },
    data: {
      enabled: false,
      vapiPhoneNumberId: null,
      e164Number: null,
      vapiAssistantId: null,
    },
  });
}
