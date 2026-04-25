import { prisma } from "@/lib/prisma";
import { createEmbedding } from "@/lib/embeddings";
import { cosineSimilarity } from "@/lib/similarity";

export type RelevantChunk = { content: string; score: number };

/** Treat anything below this as noise (rough empirical threshold for text-embedding-3-small). */
const MIN_RELEVANCE = 0.18;
/** MMR-like dedup: skip a chunk that is very similar to one already chosen. */
const DEDUP_OVERLAP = 0.92;

function hasHeavyTextOverlap(a: string, b: string): boolean {
  const an = a.replace(/\s+/g, " ").trim().toLowerCase();
  const bn = b.replace(/\s+/g, " ").trim().toLowerCase();
  if (an.length === 0 || bn.length === 0) return false;
  const shorter = an.length < bn.length ? an : bn;
  const longer = an.length < bn.length ? bn : an;
  return longer.includes(shorter.slice(0, Math.min(120, shorter.length)));
}

export async function getRelevantChunksScored(
  botId: string,
  query: string,
  topK = 8,
): Promise<RelevantChunk[]> {
  const sources = await prisma.source.findMany({
    where: { botId },
    select: { content: true, embedding: true },
  });

  if (sources.length === 0) return [];

  const queryEmbedding = await createEmbedding(query);

  const scored = sources.map((s) => ({
    content: s.content,
    score: cosineSimilarity(queryEmbedding, s.embedding as unknown as number[]),
  }));

  scored.sort((a, b) => b.score - a.score);

  const picked: RelevantChunk[] = [];
  for (const candidate of scored) {
    if (candidate.score < MIN_RELEVANCE) break;
    if (
      picked.some(
        (p) => p.score - candidate.score < DEDUP_OVERLAP && hasHeavyTextOverlap(p.content, candidate.content),
      )
    ) {
      continue;
    }
    picked.push(candidate);
    if (picked.length >= topK) break;
  }
  return picked;
}

/** Backwards-compatible: returns just the chunk text. */
export async function getRelevantChunks(botId: string, query: string, topK = 8): Promise<string[]> {
  const scored = await getRelevantChunksScored(botId, query, topK);
  return scored.map((s) => s.content);
}
