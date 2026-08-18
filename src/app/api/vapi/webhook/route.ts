import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endVapiCall, verifyVapiSignature } from "@/lib/vapi";
import { runPhoneTool } from "@/lib/phone-tools";
import { fireWebhooks } from "@/lib/webhooks";
import { sendTransactionalEmail } from "@/lib/email";
import { canWorkspaceAcceptCall, maybeNotifyPhoneQuota } from "@/lib/usage";
import { getLogger } from "@/lib/logger";

const log = getLogger("vapi-webhook");

export const runtime = "nodejs";

type Json = Record<string, unknown>;

function asRecord(v: unknown): Json {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {};
}

function pickString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

async function resolveBotId(message: Json, call: Json): Promise<string | null> {
  const meta = asRecord(message.metadata ?? call.metadata);
  const fromMeta = pickString(meta.botId);
  if (fromMeta) return fromMeta;

  const toNumber =
    pickString(
      asRecord(call.phoneNumber).number,
      call.phoneNumber as string,
      asRecord(message.phoneNumber).number,
      message.phoneNumber as string,
    );

  // Prefer DialedNumber / phoneNumberId mapping via PhoneConfig
  const e164Candidates = [
    pickString(asRecord(call.phoneNumber).number),
    pickString(call.phoneNumber as string),
    pickString(asRecord(message.phoneNumber).number),
    pickString(message.phoneNumber as string),
  ].filter(Boolean) as string[];

  for (const num of e164Candidates) {
    const cfg = await prisma.phoneConfig.findFirst({
      where: { e164Number: num, enabled: true },
      select: { botId: true },
    });
    if (cfg) return cfg.botId;
  }

  const phoneNumberId = pickString(
    asRecord(call.phoneNumber).id,
    asRecord(message.phoneNumber).id,
    call.phoneNumberId as string,
  );
  if (phoneNumberId) {
    const cfg = await prisma.phoneConfig.findFirst({
      where: { vapiPhoneNumberId: phoneNumberId },
      select: { botId: true },
    });
    if (cfg) return cfg.botId;
  }

  // assistantId → PhoneConfig
  const assistantId = pickString(call.assistantId as string, asRecord(call.assistant).id, message.assistantId as string);
  if (assistantId) {
    const cfg = await prisma.phoneConfig.findFirst({
      where: { vapiAssistantId: assistantId },
      select: { botId: true },
    });
    if (cfg) return cfg.botId;
  }

  return null;
}

async function ensureCallSession(opts: {
  botId: string;
  vapiCallId: string;
  fromNumber?: string | null;
  toNumber?: string | null;
  status?: string;
  direction?: string | null;
}) {
  return prisma.callSession.upsert({
    where: { vapiCallId: opts.vapiCallId },
    create: {
      botId: opts.botId,
      vapiCallId: opts.vapiCallId,
      fromNumber: opts.fromNumber ?? null,
      toNumber: opts.toNumber ?? null,
      status: opts.status ?? "in_progress",
      direction: opts.direction === "outbound" ? "outbound" : "inbound",
    },
    update: {
      ...(opts.fromNumber ? { fromNumber: opts.fromNumber } : {}),
      ...(opts.toNumber ? { toNumber: opts.toNumber } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(opts.direction === "outbound" ? { direction: "outbound" } : {}),
    },
  });
}

async function handleToolCalls(message: Json, call: Json): Promise<NextResponse> {
  const botId = await resolveBotId(message, call);
  const callId = pickString(call.id as string, asRecord(message.call).id) || "unknown";
  if (!botId) {
    return NextResponse.json({
      results: [
        {
          toolCallId: "unknown",
          result: "Configuration error: no bot mapped to this number.",
        },
      ],
    });
  }

  const fromNumber = pickString(
    asRecord(call.customer).number,
    call.customer as string,
    asRecord(message.customer).number,
  );
  const toNumber = pickString(asRecord(call.phoneNumber).number, asRecord(message.phoneNumber).number);

  await ensureCallSession({
    botId,
    vapiCallId: callId,
    fromNumber,
    toNumber,
    status: "in_progress",
    direction: pickString(asRecord(call.metadata).direction, asRecord(message.metadata).direction),
  });

  const phoneConfig = await prisma.phoneConfig.findUnique({
    where: { botId },
    select: { forwardingNumber: true },
  });

  // Vapi may send toolCalls or toolWithToolCallList shapes
  const toolCallList =
    (Array.isArray(message.toolCalls) ? message.toolCalls : null) ||
    (Array.isArray(message.toolCallList) ? message.toolCallList : null) ||
    (Array.isArray(asRecord(message.toolWithToolCallList))
      ? (message.toolWithToolCallList as unknown[])
      : null) ||
    [];

  // Also support single function-call legacy shape
  const functionCall = asRecord(message.functionCall);
  if (functionCall.name && toolCallList.length === 0) {
    const result = await runPhoneTool({
      botId,
      callId,
      name: String(functionCall.name),
      args: asRecord(functionCall.parameters ?? functionCall.arguments),
      callerPhone: fromNumber,
      forwardingNumber: phoneConfig?.forwardingNumber,
    });
    return NextResponse.json({ result });
  }

  const results: { toolCallId: string; result: string }[] = [];

  for (const raw of toolCallList) {
    const item = asRecord(raw);
    const toolCall = asRecord(item.toolCall ?? item);
    const fn = asRecord(toolCall.function ?? item.function);
    const toolCallId = pickString(toolCall.id as string, item.id as string, item.toolCallId as string) || "tool";
    const name = pickString(fn.name as string, toolCall.name as string, item.name as string);
    let args: Record<string, unknown> = asRecord(fn.arguments ?? toolCall.parameters ?? item.parameters);
    if (typeof fn.arguments === "string") {
      try {
        args = JSON.parse(fn.arguments) as Record<string, unknown>;
      } catch {
        args = {};
      }
    }
    if (!name) {
      results.push({ toolCallId, result: JSON.stringify({ error: "Missing tool name" }) });
      continue;
    }
    const result = await runPhoneTool({
      botId,
      callId,
      name,
      args,
      callerPhone: fromNumber,
      forwardingNumber: phoneConfig?.forwardingNumber,
    });
    results.push({ toolCallId, result });
  }

  return NextResponse.json({ results });
}

async function handleEndOfCall(message: Json, call: Json): Promise<NextResponse> {
  const botId = await resolveBotId(message, call);
  const callId = pickString(call.id as string, asRecord(message.call).id);
  if (!botId || !callId) return NextResponse.json({ ok: true });

  const fromNumber = pickString(asRecord(call.customer).number, asRecord(message.customer).number);
  const toNumber = pickString(asRecord(call.phoneNumber).number, asRecord(message.phoneNumber).number);
  const endedReason = pickString(message.endedReason as string, call.endedReason as string);
  const durationSec =
    typeof message.durationSeconds === "number"
      ? Math.round(message.durationSeconds)
      : typeof call.duration === "number"
        ? Math.round(call.duration)
        : null;
  const summary = pickString(message.summary as string, asRecord(message.analysis).summary);
  const recordingUrl = pickString(message.recordingUrl as string, asRecord(message.artifact).recordingUrl);
  const transcript =
    message.transcript ??
    asRecord(message.artifact).transcript ??
    message.messages ??
    null;

  const status =
    endedReason && /no-answer|busy|canceled|cancelled/i.test(endedReason)
      ? "no_answer"
      : endedReason && /fail|error/i.test(endedReason)
        ? "failed"
        : "completed";

  const session = await prisma.callSession.upsert({
    where: { vapiCallId: callId },
    create: {
      botId,
      vapiCallId: callId,
      fromNumber,
      toNumber,
      status,
      endedAt: new Date(),
      durationSec,
      summary,
      recordingUrl,
      transcript: transcript as object | undefined,
    },
    update: {
      status,
      endedAt: new Date(),
      durationSec: durationSec ?? undefined,
      summary: summary ?? undefined,
      recordingUrl: recordingUrl ?? undefined,
      transcript: transcript ? (transcript as object) : undefined,
      fromNumber: fromNumber ?? undefined,
      toNumber: toNumber ?? undefined,
    },
  });

  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    select: { name: true, userId: true, user: { select: { email: true } } },
  });

  if (bot) {
    void maybeNotifyPhoneQuota(bot.userId);

    void fireWebhooks(bot.userId, "call.completed", {
      callId: session.id,
      vapiCallId: callId,
      botId,
      botName: bot.name,
      fromNumber: session.fromNumber,
      toNumber: session.toNumber,
      status: session.status,
      durationSec: session.durationSec,
      summary: session.summary,
      leadId: session.leadId,
      appointmentId: session.appointmentId,
    });

    if (bot.user.email && summary) {
      const esc = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const duration =
        session.durationSec != null ? `${session.durationSec}s` : "—";
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      void sendTransactionalEmail({
        to: bot.user.email,
        subject: `Call completed — ${bot.name}`,
        html: `<p>A phone call just finished for <strong>${esc(bot.name)}</strong>.</p>
          <p><strong>From:</strong> ${esc(session.fromNumber ?? "Unknown")}</p>
          <p><strong>Duration:</strong> ${esc(duration)}</p>
          <p><strong>Summary:</strong></p>
          <p>${esc(summary)}</p>
          <p><a href="${esc(appUrl)}/dashboard/calls/${esc(session.id)}">View call</a></p>`,
      }).catch((e) => log.error("call email failed", e));
    }
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-vapi-signature") ||
    req.headers.get("x-vapi-secret") ||
    req.headers.get("x-signature");

  if (!verifyVapiSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Json;
  try {
    body = JSON.parse(rawBody) as Json;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = asRecord(body.message ?? body);
  const call = asRecord(message.call ?? body.call);
  const type = pickString(message.type as string, body.type as string) || "";

  try {
    if (type === "tool-calls" || type === "function-call" || type === "tool-calls-result") {
      return await handleToolCalls(message, call);
    }
    if (type === "end-of-call-report") {
      return await handleEndOfCall(message, call);
    }
    if (type === "status-update") {
      const botId = await resolveBotId(message, call);
      const callId = pickString(call.id as string);
      const status = pickString(message.status as string);
      if (botId && callId && status) {
        await ensureCallSession({
          botId,
          vapiCallId: callId,
          status: status === "in-progress" ? "in_progress" : status,
          fromNumber: pickString(asRecord(call.customer).number),
          toNumber: pickString(asRecord(call.phoneNumber).number),
          direction: pickString(asRecord(call.metadata).direction, asRecord(message.metadata).direction),
        });
        const live = status === "ringing" || status === "in-progress" || status === "queued";
        if (live) {
          const bot = await prisma.bot.findUnique({ where: { id: botId }, select: { userId: true } });
          if (bot) {
            const quota = await canWorkspaceAcceptCall(bot.userId, callId);
            if (!quota.ok) {
              log.error("ending call — quota", undefined, { botId, callId, reason: quota.reason });
              await endVapiCall(callId);
              await prisma.callSession.updateMany({
                where: { vapiCallId: callId },
                data: { status: "canceled", endedAt: new Date() },
              });
            }
          }
        }
      }
      return NextResponse.json({ ok: true });
    }
    // assistant-request etc. — acknowledge
    return NextResponse.json({ ok: true });
  } catch (e) {
    log.error("webhook handler error", e, { type });
    return NextResponse.json({
      result: "Temporary issue. Apologize and offer a callback.",
    });
  }
}
