import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { getOpenAI } from "@/lib/openai";
import { crawlWebsiteForTraining } from "@/lib/crawler";
import { rateLimitTrain } from "@/lib/rate-limit";
import { canUserTrain, FREE_MONTHLY_TRAIN_CAP } from "@/lib/plan";

type RouteContext = { params: Promise<{ id: string }> };

/** Headless crawl can be slow. */
export const maxDuration = 120;

/**
 * POST /api/bots/[id]/auto-learn
 *
 * Crawls the bot's website URL, extracts text, then uses an LLM to
 * summarise it into structured business context (hours, services,
 * pricing, FAQs, contact info). The owner reviews and confirms before
 * it becomes the bot's businessInfo.
 */
export async function POST(_req: Request, context: RouteContext) {
  const appUser = await getOrCreateAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: botId } = await context.params;

  const bot = await prisma.bot.findFirst({
    where: { id: botId, userId: appUser.id },
  });

  if (!bot) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Share the training rate limit — crawling is expensive.
  const limit = await rateLimitTrain(botId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const planAllows = await canUserTrain(appUser.id);
  if (!planAllows) {
    return NextResponse.json(
      {
        error: `Free plan allows up to ${FREE_MONTHLY_TRAIN_CAP} trainings per month. Upgrade to Pro for unlimited.`,
      },
      { status: 402 },
    );
  }

  if (!bot.websiteUrl) {
    return NextResponse.json({ error: "Add a website URL first." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
  }

  try {
    const { text: raw, stats } = await crawlWebsiteForTraining(bot.websiteUrl, 10);

    if (!raw || raw.length < 24) {
      return NextResponse.json(
        {
          error:
            "Could not read enough text from that site. The page may require sign-in, block bots, or render everything with JavaScript.",
          crawl: stats,
        },
        { status: 422 }
      );
    }

    // Truncate to avoid blowing token limits on the summarisation call.
    const truncated = raw.slice(0, 24_000);

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You extract structured business information from raw website text.

Return a concise, well-organised summary that a customer-support chatbot can use to answer visitor questions. Include ONLY facts found in the text — never invent details.

Structure the output with these sections (skip any section where no information was found):

**Business name**
**What they do** (1-3 sentences)
**Services / Products** (bullet list)
**Pricing** (if mentioned)
**Opening hours** (if mentioned)
**Location / Service area** (if mentioned)
**Contact details** (phone, email, address)
**FAQs** (common questions and answers found on the site)
**Other useful details**

Keep it under 1500 words. Write in third person ("They offer…") so the chatbot can rephrase naturally.`,
        },
        {
          role: "user",
          content: `Here is the raw text extracted from ${bot.websiteUrl}:\n\n${truncated}`,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!summary) {
      return NextResponse.json(
        { error: "Could not generate a summary from the crawled content." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ok: true,
      businessInfo: summary,
      crawl: stats,
    });
  } catch (e) {
    console.error("[auto-learn]", e);
    return NextResponse.json({ error: "Auto-learn failed. Please try again." }, { status: 500 });
  }
}
