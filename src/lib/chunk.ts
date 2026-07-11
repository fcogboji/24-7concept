/** Chunks shorter than this are dropped: with overlap their text already appears in the previous chunk. */
const MIN_CHUNK = 80;

export function chunkText(text: string, size = 500, overlap = 100): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= size) return [normalized];

  const chunks: string[] = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + size, normalized.length);

    // Snap the cut back to a sentence end, else a word end, so a chunk never
    // stops mid-word. Only look in the back half: an early boundary would make
    // the chunk too small to carry context.
    if (end < normalized.length) {
      const window = normalized.slice(start, end);
      const earliest = Math.floor(size * 0.5);
      const sentence = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("! "),
        window.lastIndexOf("? "),
      );
      const word = window.lastIndexOf(" ");
      if (sentence >= earliest) end = start + sentence + 1;
      else if (word >= earliest) end = start + word;
    }

    const piece = normalized.slice(start, end).trim();
    if (piece && (piece.length >= MIN_CHUNK || chunks.length === 0)) chunks.push(piece);

    if (end >= normalized.length) break;

    // Step back by `overlap`, then forward to the next word start, so the following
    // chunk never begins mid-word either. Always advances, so this cannot spin.
    let next = end - overlap;
    if (next <= start) {
      next = end;
    } else {
      const space = normalized.indexOf(" ", next);
      next = space !== -1 && space + 1 < end ? space + 1 : end;
    }
    start = next;
  }

  return chunks;
}
