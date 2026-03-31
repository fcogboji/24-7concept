import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/similarity";

export async function getRelevantChunks(
  botId: string,
  query: string,
  topK = 5
): Promise<string[]> {
  const sources = await prisma.source.findMany({
    where: { botId },
    select: { content: true, embedding: true },
  });

  if (sources.length === 0) return [];

  const queryEmbedding = await createEmbedding(query);

  const scored = sources.map((s) => {
    const emb = s.embedding as unknown as number[];
    return {
      content: s.content,
      score: cosineSimilarity(queryEmbedding, emb),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.content);
}
