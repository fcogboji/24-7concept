import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOpenAI } from "@/lib/openai";
import { getRelevantChunks } from "@/lib/retrieve";
import { rateLimitChat } from "@/lib/rate-limit";
import { canUserSendMessage } from "@/lib/plan";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";

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
    const appUser = await getOrCreateAppUser();
    if (!appUser) {
      return NextResponse.json(
        { error: "Please log in or sign up to use chat." },
        { status: 401, headers: cors }
      );
    }

    const { botId, message } = (await req.json()) as {
      botId?: string;
      message?: string;
    };

    if (!botId || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing botId or message" },
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
      include: { user: true },
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

    const chunks = await getRelevantChunks(botId, message);
    const context = chunks.length
      ? chunks.join("\n\n")
      : "No indexed content yet. Say you are not sure and ask them to contact the business.";

    const stream = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a calm, helpful member of the business team answering website visitors.

Use ONLY the context below. If something is not covered, say you are not sure and suggest they contact the business directly. Do not invent policies, prices, or hours.

Keep replies short (2–6 sentences) unless the visitor asks for detail. Sound natural and human — no bullet lists unless they ask for steps.

Context:
${context}`,
        },
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
          await prisma.message.createMany({
            data: [
              { botId, role: "user", content: message },
              { botId, role: "assistant", content: fullReply || "(empty)" },
            ],
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
