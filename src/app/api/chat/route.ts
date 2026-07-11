import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChatModel, getOpenAI } from "@/lib/openai";
import { getRelevantChunksScored } from "@/lib/retrieve";
import { rateLimitChat, rateLimitChatBotGlobal } from "@/lib/rate-limit";
import { canUserSendMessage } from "@/lib/plan";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { bookingTools, handleBookingTool, type BookingToolResult } from "@/lib/booking-tools";
import { encodeBookingFormForStream, type BookingFormRequest } from "@/lib/chat-form";
import { engagementTools, handleEngagementTool } from "@/lib/engagement-tools";
import { getLogger } from "@/lib/logger";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

const log = getLogger("chat");

const MAX_MESSAGE_LENGTH = 12_000;

function clientIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function OPTIONS(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { botId, message, sessionId, pageUrl } = (await req.json()) as {
      botId?: string;
      message?: string;
      sessionId?: string;
      pageUrl?: string;
    };

    if (!botId || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing botId or message" },
        { status: 400, headers: cors }
      );
    }

    // Validate sessionId format if provided
    if (sessionId && !/^s_[a-f0-9]{8,64}$/.test(sessionId)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 400, headers: cors }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400, headers: cors }
      );
    }

    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      include: { user: true, bookingConfig: true },
    });

    if (!bot) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404, headers: cors });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Assistant is not fully configured yet." },
        { status: 503, headers: cors }
      );
    }

    const ip = clientIp(req);
    const ipLimit = await rateLimitChat(`${ip}:${botId}`);
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many messages. Try again shortly." },
        { status: 429, headers: { ...cors, "Retry-After": String(ipLimit.retryAfter) } }
      );
    }
    // Global cap per bot (across all IPs) so a distributed botnet cannot
    // drain the workspace's monthly OpenAI quota in a single burst.
    const botLimit = await rateLimitChatBotGlobal(botId);
    if (!botLimit.ok) {
      return NextResponse.json(
        { error: "This assistant is receiving too many requests right now. Try again shortly." },
        { status: 429, headers: { ...cors, "Retry-After": String(botLimit.retryAfter) } }
      );
    }

    if (!bot.isDemo) {
      const decision = await canUserSendMessage(bot.userId);
      if (!decision.ok) {
        const errorBody =
          decision.reason === "quota"
            ? {
                error:
                  "This workspace has reached its monthly message limit. Please upgrade or wait until next month.",
                used: decision.used,
                limit: decision.limit,
              }
            : {
                error:
                  "This workspace's subscription is not active. Please contact the site owner.",
              };
        return NextResponse.json(errorBody, { status: 402, headers: cors });
      }
    }

    const bookingEnabled = bot.bookingConfig?.enabled === true;

    // Load history before the current message is saved, so `prior` is exactly the
    // preceding turns — no need to slice the just-inserted row back off.
    const prior = sessionId
      ? await prisma.message.findMany({
          where: { botId, sessionId },
          orderBy: { createdAt: "asc" },
          take: 50, // limit to last 50 messages to stay within token budget
        })
      : [];

    // A follow-up ("how much is that?", "and on weekends?") means nothing on its own,
    // so embedding it alone retrieves noise. Prepend the recent user turns to give the
    // query enough standing to match the right chunks.
    const recentUserTurns = prior
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.content);
    const retrievalQuery = [...recentUserTurns, message].join("\n");

    const scoredChunks = await getRelevantChunksScored(botId, retrievalQuery);
    const topScore = scoredChunks[0]?.score ?? 0;
    const ragContext = scoredChunks.length
      ? scoredChunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n")
      : null;
    const businessInfo = bot.businessInfo?.trim() || null;
    const hasAnyKnowledge = Boolean(businessInfo) || Boolean(ragContext) || bookingEnabled;

    if (!hasAnyKnowledge) {
      const fallback =
        "I don't have that information yet. If you'd like, leave your email and someone from the team will get back to you.";
      await prisma.message.createMany({
        data: [
          { botId, role: "user", content: message, sessionId: sessionId || null, pageUrl: pageUrl || null },
          { botId, role: "assistant", content: fallback, sessionId: sessionId || null, pageUrl: pageUrl || null },
        ],
      });
      return new NextResponse(fallback, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...cors },
      });
    }

    const contextSections: string[] = [];
    if (businessInfo) contextSections.push(`### Business overview (curated by the owner — highest priority)\n${businessInfo}`);
    if (ragContext) contextSections.push(`### Indexed website content (from training; quote sparingly)\n${ragContext}`);
    const context = contextSections.length
      ? contextSections.join("\n\n")
      : "(No indexed content yet — only answer about logistics like booking or contact details.)";

    const todayStr = new Date().toISOString().slice(0, 10);
    const lowConfidence = !businessInfo && topScore < 0.28;

    const systemPromptParts: string[] = [
      `You are the live customer assistant for ${bot.name}. Speak in first person plural ("we", "our team") as a real representative of the business — never refer to yourself as an AI, model, bot, or chatbot. Today is ${todayStr}.`,
      `\n## Voice and style\n- Warm, concise, plain English. 2-5 short sentences for most replies; expand only when the visitor asks for detail or when confirming a booking.\n- One topic per reply. Ask a follow-up question if the visitor's intent is unclear.\n- Don't open with "Sure!" / "Of course!" / "Great question!" — just answer.\n- No emojis unless the visitor uses them first.\n- Match the visitor's language.`,
      `\n## Grounding rules (CRITICAL)\n- Use ONLY the context below for any factual claim about ${bot.name} (services, hours, prices, policies, contact details, location).\n- If the context doesn't cover it, say so directly: "I'm not sure about that — let me get that confirmed for you" — then offer the capture_lead tool to collect their email so the team can follow up.\n- Never invent prices, availability, hours, guarantees, or policies. Don't speculate about competitors.\n- If the visitor asks something off-topic (general knowledge, jokes, coding, other companies), gently redirect to what you can help with.`,
      `\n## When to use the engagement tools\n- capture_lead: when the visitor asks something you can't answer, expresses interest in being contacted, or shares a problem that needs human follow-up. Always confirm before saving and only collect what they offer.\n- escalate_to_human: when the visitor explicitly asks for a human, has a complaint, or the situation is sensitive (refund, complaint, account issue).`,
      `\n## Context\n${context}`,
    ];

    if (lowConfidence) {
      systemPromptParts.push(
        `\n## Low-confidence notice\nThe retrieved context is weak for this question. Bias toward "I'm not sure" and the capture_lead tool rather than guessing.`,
      );
    }

    if (bookingEnabled) {
      systemPromptParts.push(
        `\n## Booking\nYou can book appointments for visitors:\n1. list_services when asked what can be booked.\n2. check_availability(date) for a specific YYYY-MM-DD date.\n3. request_booking_details(fields, prompt) — when you need the visitor to provide booking details (name, email, phone, date, time, service). Only include fields you still need; a matching form appears in the chat.\n4. create_appointment(...) — ONLY after you have date, time, name, and email (from the form submission or conversation). Confirm details before booking.\nBusiness timezone: ${bot.bookingConfig!.timezone}.`,
      );
    }

    const systemPrompt = systemPromptParts.join("\n");

    // Save the user message immediately so it's never lost.
    await prisma.message.create({
      data: { botId, role: "user", content: message, sessionId: sessionId || null, pageUrl: pageUrl || null },
    });

    // Conversation history so the AI remembers prior turns (loaded above, pre-insert).
    const historyMessages: ChatCompletionMessageParam[] = [];
    for (const m of prior) {
      if (m.role === "user") {
        historyMessages.push({ role: "user", content: m.content });
      } else if (m.role === "assistant") {
        historyMessages.push({ role: "assistant", content: m.content });
      }
    }

    const openai = getOpenAI();
    const chatModel = getChatModel();
    const toolCtx = { botId, sessionId, pageUrl };

    const tools: ChatCompletionTool[] = [
      ...engagementTools,
      ...(bookingEnabled ? bookingTools : []),
    ];

    let pendingForm: BookingFormRequest | null = null;

    const handleToolCall = async (name: string, args: Record<string, unknown>): Promise<string> => {
      if (
        bookingEnabled &&
        (name === "list_services" ||
          name === "check_availability" ||
          name === "create_appointment" ||
          name === "request_booking_details")
      ) {
        const result: BookingToolResult = await handleBookingTool(name, args, toolCtx);
        if (typeof result === "object" && result !== null && "formRequest" in result) {
          pendingForm = result.formRequest;
          return result.toolResult;
        }
        return result as string;
      }
      return handleEngagementTool(name, args, toolCtx);
    };

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message },
    ];

    // Cap output length on every OpenAI call so a malicious or malformed
    // prompt cannot run up an unbounded bill. Tuned for short customer-facing
    // replies plus a small headroom for tool-call JSON.
    const MAX_REPLY_TOKENS = 800;

    const MAX_TOOL_ROUNDS = 5;

    const encoder = new TextEncoder();
    let fullReply = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // The tools travel with the streaming call, so a reply that needs no tool
          // (the common case) reaches the visitor on the first round instead of
          // waiting for a separate blocking routing pass to finish first.
          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const stream = await openai.chat.completions.create({
              model: chatModel,
              stream: true,
              messages,
              tools,
              max_tokens: MAX_REPLY_TOKENS,
            });

            // Tool calls arrive split across deltas: `id`/`name` land once, then
            // `arguments` accumulate as fragments, keyed by index.
            const calls: { id: string; name: string; args: string }[] = [];
            let roundText = "";

            for await (const part of stream) {
              const delta = part.choices[0]?.delta;
              if (!delta) continue;

              const text = delta.content ?? "";
              if (text) {
                roundText += text;
                fullReply += text;
                controller.enqueue(encoder.encode(text));
              }

              for (const tc of delta.tool_calls ?? []) {
                const slot = (calls[tc.index] ??= { id: "", name: "", args: "" });
                if (tc.id) slot.id = tc.id;
                if (tc.function?.name) slot.name = tc.function.name;
                if (tc.function?.arguments) slot.args += tc.function.arguments;
              }
            }

            const toolCalls = calls.filter((c) => c.id && c.name);
            if (!toolCalls.length) break;

            messages.push({
              role: "assistant",
              content: roundText || null,
              tool_calls: toolCalls.map((c) => ({
                id: c.id,
                type: "function" as const,
                function: { name: c.name, arguments: c.args || "{}" },
              })),
            });

            for (const c of toolCalls) {
              let args: Record<string, unknown> = {};
              try {
                args = JSON.parse(c.args || "{}");
              } catch {
                /* empty args */
              }
              const result = await handleToolCall(c.name, args);
              messages.push({ role: "tool", tool_call_id: c.id, content: result });
            }
          }

          const storedReply = fullReply || "(empty)";
          await prisma.message.create({
            data: { botId, role: "assistant", content: storedReply, sessionId: sessionId || null, pageUrl: pageUrl || null },
          });
          if (pendingForm) {
            controller.enqueue(encoder.encode(encodeBookingFormForStream(pendingForm)));
          }
        } catch (e) {
          log.error("stream failed", e, { botId });
          controller.enqueue(encoder.encode("\n[Sorry — something went wrong. Please try again.]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...cors,
      },
    });
  } catch (e) {
    log.error("handler failed", e);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: cors });
  }
}
