import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunk";
import { createEmbedding } from "@/lib/embeddings";
import { logAudit } from "@/lib/audit";
import { crawlWebsiteForTraining } from "@/lib/crawler";
import { rateLimitTrain } from "@/lib/rate-limit";
import { canUserTrain, FREE_MONTHLY_TRAIN_CAP } from "@/lib/plan";

type RouteContext = { params: Promise<{ id: string }> };

/** Headless crawl can exceed default serverless limits on Vercel Pro+. */
export const maxDuration = 120;

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

  const trainLimit = await rateLimitTrain(botId);
  if (!trainLimit.ok) {
    return NextResponse.json(
      { error: "Training rate limit reached. Try again later." },
      { status: 429, headers: { "Retry-After": String(trainLimit.retryAfter) } }
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
    return NextResponse.json({ error: "Add a website URL first" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  // Prevent concurrent training — stale locks older than 5 minutes are ignored.
  const LOCK_TTL_MS = 5 * 60 * 1000;
  if (bot.trainingStartedAt && Date.now() - bot.trainingStartedAt.getTime() < LOCK_TTL_MS) {
    return NextResponse.json(
      { error: "Training is already in progress. Please wait for it to finish." },
      { status: 409 }
    );
  }

  await prisma.bot.update({
    where: { id: botId },
    data: { trainingStartedAt: new Date() },
  });

  try {
    const { text: raw, stats: crawlStats } = await crawlWebsiteForTraining(bot.websiteUrl, 10);
    if (!raw || raw.length < 24) {
      return NextResponse.json(
        {
          error:
            "Could not read enough text from that site. It may require sign-in (e.g. Clerk), block bots, or show almost everything only after JavaScript — we still could not see enough public text.",
          hint:
            "Use a URL that is publicly readable without logging in (marketing, docs, /about). If your whole site is behind auth, add a public page with your FAQs and train on that. For local dev: ALLOW_LOCAL_TRAINING_URL=1. To skip the browser crawl: CRAWLER_DISABLE_RENDER=1.",
          crawl: crawlStats,
        },
        { status: 422 }
      );
    }

    const pieces = chunkText(raw, 550, 120);
    await prisma.source.deleteMany({ where: { botId } });

    const batchSize = 8;
    for (let i = 0; i < pieces.length; i += batchSize) {
      const slice = pieces.slice(i, i + batchSize);
      const rows = await Promise.all(
        slice.map(async (content) => {
          const embedding = await createEmbedding(content);
          return { botId, content, embedding };
        })
      );
      await prisma.source.createMany({ data: rows });
    }

    await logAudit({
      userId: bot.userId,
      action: "bot.trained",
      resourceType: "bot",
      resourceId: botId,
      meta: {
        chunks: pieces.length,
        websiteUrl: bot.websiteUrl,
        crawlUsedPlaywright: crawlStats.usedPlaywright === true,
      },
    });

    await prisma.bot.update({
      where: { id: botId },
      data: { trainingStartedAt: null },
    });

    return NextResponse.json({ ok: true, chunks: pieces.length });
  } catch (e) {
    console.error(e);
    // Clear the training lock so the user can retry.
    await prisma.bot.update({ where: { id: botId }, data: { trainingStartedAt: null } }).catch(() => {});
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
