import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI } from "@/lib/openai";
import { getRelevantChunks } from "@/lib/retrieve";
import { rateLimitChat } from "@/lib/rate-limit";
import { canUserSendMessage } from "@/lib/plan";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { bookingTools, handleBookingTool } from "@/lib/booking-tools";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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
    const limit = await rateLimitChat(`${ip}:${botId}`);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many messages. Try again shortly." },
        { status: 429, headers: { ...cors, "Retry-After": String(limit.retryAfter) } }
      );
    }

    if (!bot.isDemo) {
      const allowed = await canUserSendMessage(bot.userId);
      if (!allowed) {
        return NextResponse.json(
          {
            error:
              "Message limit reached for this workspace. Upgrade to continue, or wait until next month.",
          },
          { status: 402, headers: cors }
        );
      }
    }

    const bookingEnabled = bot.bookingConfig?.enabled === true;

    const chunks = await getRelevantChunks(botId, message);
    const ragContext = chunks.length ? chunks.join("\n\n") : null;
    const businessInfo = bot.businessInfo?.trim() || null;
    if (!businessInfo && !ragContext && !bookingEnabled) {
      const fallback =
        "I don't have that information right now. Please contact the business directly and they will be happy to help.";
      await prisma.message.createMany({
        data: [
          { botId, role: "user", content: message, sessionId: sessionId || null, pageUrl: pageUrl || null },
          { botId, role: "assistant", content: fallback, sessionId: sessionId || null, pageUrl: pageUrl || null },
        ],
      });
      return new NextResponse(fallback, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          ...cors,
        },
      });
    }
    const context =
      businessInfo && ragContext
        ? `--- Business information ---\n${businessInfo}\n\n--- Additional indexed content ---\n${ragContext}`
        : businessInfo
          ? `--- Business information ---\n${businessInfo}`
          : ragContext
            ? `--- Indexed content ---\n${ragContext}`
            : "No indexed content yet. Say you are not sure and ask them to contact the business.";

    let systemPrompt = `You are the customer assistant for ${bot.name}.
Speak as a representative of ${bot.name}, not as an AI tool or third-party platform.

Use ONLY the context below. If something is not covered, say you are not sure and suggest they contact the business directly. Do not invent policies, prices, or hours.

Keep replies short (2–6 sentences) unless the visitor asks for detail. Sound natural and human — no bullet lists unless they ask for steps.

Context:
${context}`;

    if (bookingEnabled) {
      const todayStr = new Date().toISOString().slice(0, 10);
      systemPrompt += `

You can help visitors book appointments. Use the available tools to:
1. Show services (list_services) when asked what can be booked
2. Check time slots (check_availability) for a specific date
3. Book appointments (create_appointment) after confirming all details with the visitor

Always confirm the date, time, service, name, and email with the visitor BEFORE creating an appointment. Today's date is ${todayStr}. Business timezone: ${bot.bookingConfig!.timezone}.`;
    }

    // Save the user message immediately so it's never lost.
    await prisma.message.create({
      data: { botId, role: "user", content: message, sessionId: sessionId || null, pageUrl: pageUrl || null },
    });

    // Load conversation history for this session so the AI remembers prior messages
    const historyMessages: ChatCompletionMessageParam[] = [];
    if (sessionId) {
      const prior = await prisma.message.findMany({
        where: { botId, sessionId },
        orderBy: { createdAt: "asc" },
        take: 50, // limit to last 50 messages to stay within token budget
      });
      // Exclude the message we just saved (last user message) — we add it explicitly below
      const priorWithoutCurrent = prior.slice(0, -1);
      for (const m of priorWithoutCurrent) {
        if (m.role === "user") {
          historyMessages.push({ role: "user", content: m.content });
        } else if (m.role === "assistant") {
          historyMessages.push({ role: "assistant", content: m.content });
        }
      }
    }

    const openai = getOpenAI();
    const toolCtx = { botId, sessionId };

    // If booking is enabled, use a tool-use loop (non-streaming until final response)
    if (bookingEnabled) {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ];

      let finalText = "";
      const MAX_TOOL_ROUNDS = 5;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          tools: bookingTools,
        });

        const choice = completion.choices[0];
        const assistantMsg = choice.message;
        messages.push(assistantMsg);

        if (!assistantMsg.tool_calls?.length) {
          finalText = assistantMsg.content ?? "";
          break;
        }

        // Execute each tool call
        for (const tc of assistantMsg.tool_calls) {
          if (tc.type !== "function") continue;
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || "{}");
          } catch { /* empty */ }

          const result = await handleBookingTool(tc.function.name, args, toolCtx);
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }

        // If last round, force a non-tool response
        if (round === MAX_TOOL_ROUNDS - 1) {
          const final = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
          });
          finalText = final.choices[0]?.message?.content ?? "";
        }
      }

      await prisma.message.create({
        data: { botId, role: "assistant", content: finalText || "(empty)", sessionId: sessionId || null, pageUrl: pageUrl || null },
      });

      return new NextResponse(finalText, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8", ...cors },
      });
    }

    // Standard streaming path (no booking)
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message },
      ],
    });

    const encoder = new TextEncoder();
    let fullReply = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const text = part.choices[0]?.delta?.content ?? "";
            fullReply += text;
            controller.enqueue(encoder.encode(text));
          }
          await prisma.message.create({
            data: { botId, role: "assistant", content: fullReply || "(empty)", sessionId: sessionId || null, pageUrl: pageUrl || null },
          });
        } catch (e) {
          console.error(e);
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
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: cors });
  }
}
