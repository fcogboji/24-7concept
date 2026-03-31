export function chunkText(text: string, size = 500, overlap = 100): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += size - overlap) {
    chunks.push(normalized.slice(i, i + size));
  }
  return chunks;
}
