import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunk";
import { createEmbedding } from "@/lib/embeddings";
import { logAudit } from "@/lib/audit";
import { crawlWebsite } from "@/lib/crawler";

type RouteContext = { params: Promise<{ id: string }> };

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

  if (!bot.websiteUrl) {
    return NextResponse.json({ error: "Add a website URL first" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const raw = await crawlWebsite(bot.websiteUrl, 8);
    if (!raw || raw.length < 50) {
      return NextResponse.json(
        { error: "Could not read enough text from that site. Check the URL or try again." },
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
      meta: { chunks: pieces.length, websiteUrl: bot.websiteUrl },
    });

    return NextResponse.json({ ok: true, chunks: pieces.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
