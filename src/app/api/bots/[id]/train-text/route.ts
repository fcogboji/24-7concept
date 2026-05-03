import { NextResponse } from "next/server";
import { getOrCreateAppUser } from "@/lib/clerk-app-user";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunk";
import { createEmbedding } from "@/lib/embeddings";
import { logAudit } from "@/lib/audit";
import { rateLimitTrain } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/bots/[id]/train-text
 *
 * Accepts raw pasted text and creates embeddings from it — bypasses the
 * crawler entirely.  Designed for sites behind auth (Clerk, etc.) where
 * the crawler cannot extract content.
 */
export async function POST(req: Request, context: RouteContext) {
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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  // Reject oversized request bodies before parsing so a malicious payload
  // can't blow up memory or run up embedding costs by sneaking past the
  // post-parse cap.
  const MAX_BODY_BYTES = 200_000;
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Request body too large (max ${MAX_BODY_BYTES} bytes).` },
      { status: 413 }
    );
  }

  let body: { text?: string };
  try {
    body = (await req.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";

  if (text.length < 24) {
    return NextResponse.json(
      { error: "Please paste at least a few sentences of content to train on." },
      { status: 422 }
    );
  }

  // Cap at a reasonable size to prevent abuse / excessive embedding costs.
  const MAX_TEXT = 100_000;
  if (text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `Pasted text too long (max ${MAX_TEXT} characters).` },
      { status: 413 }
    );
  }
  const raw = text.slice(0, MAX_TEXT);

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
        source: "pasted-text",
        textLength: raw.length,
      },
    });

    await prisma.bot.update({
      where: { id: botId },
      data: { trainingStartedAt: null },
    });

    return NextResponse.json({ ok: true, chunks: pieces.length });
  } catch (e) {
    console.error(e);
    await prisma.bot.update({ where: { id: botId }, data: { trainingStartedAt: null } }).catch(() => {});
    return NextResponse.json({ error: "Training failed" }, { status: 500 });
  }
}
