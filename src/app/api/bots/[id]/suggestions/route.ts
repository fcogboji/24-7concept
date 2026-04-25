import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWidgetCorsHeaders } from "@/lib/widget-cors";
import { rateLimitChat } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const DEFAULT_SUGGESTIONS = [
  "What do you do?",
  "How can I contact you?",
  "What are your hours?",
];

function buildSuggestions(info: string | null | undefined): string[] {
  const text = (info ?? "").trim();
  if (!text) return DEFAULT_SUGGESTIONS;

  const lower = text.toLowerCase();
  const suggestions: string[] = [];

  if (/(hour|open|close|monday|weekend)/.test(lower)) suggestions.push("What are your opening hours?");
  if (/(price|cost|fee|charge|£|\$)/.test(lower)) suggestions.push("How much does it cost?");
  if (/(emergency|same-day|urgent|call-out)/.test(lower)) suggestions.push("Do you offer emergency services?");
  if (/(location|address|area|serving|based in)/.test(lower)) suggestions.push("Where are you located?");
  if (/(email|phone|contact|call us|get in touch)/.test(lower)) suggestions.push("How can I contact you?");
  if (/(book|appoint|schedul|reserv)/.test(lower)) suggestions.push("How do I book an appointment?");
  if (/(service|offer|provide|speciali)/.test(lower)) suggestions.push("What services do you offer?");

  return [...new Set([...suggestions, ...DEFAULT_SUGGESTIONS])].slice(0, 3);
}

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS(req: NextRequest) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function GET(req: NextRequest, context: RouteContext) {
  const cors = getWidgetCorsHeaders(req);
  if (!cors) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const ip = getClientIp(req);
  const limit = await rateLimitChat(`suggest:${ip}:${id}`);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...cors, "Retry-After": String(limit.retryAfter) } },
    );
  }

  const bot = await prisma.bot.findUnique({
    where: { id },
    select: { businessInfo: true, avatarUrl: true, bookingConfig: { select: { enabled: true } } },
  });

  const suggestions = buildSuggestions(bot?.businessInfo);

  // Prepend booking chip if booking is enabled
  if (bot?.bookingConfig?.enabled) {
    const bookingSuggestion = "Book an appointment";
    if (!suggestions.includes(bookingSuggestion)) {
      suggestions.unshift(bookingSuggestion);
      // Keep max 3 suggestions
      if (suggestions.length > 3) suggestions.length = 3;
    }
  }

  return NextResponse.json(
    { suggestions, avatarUrl: bot?.avatarUrl ?? null },
    { headers: cors }
  );
}
