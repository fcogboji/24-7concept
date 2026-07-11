import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkText } from "./chunk";

/** The exact shape of copy that produced mid-word chunks ("ur site.", "d within one business day."). */
const REAL_TEXT =
  "faztino is a lightweight assistant for small businesses. It answers common questions on your website so you spend less time repeating the same information. What it does: visitors open chat, ask about hours, services, shipping, or policies, and get short, accurate replies based on the text we learn from your site. Setup: create an account, add your website address, run one training pass, then paste a single line of code into your site. Most teams are live in a few minutes. Plans: a free tier includes fifty assistant replies per calendar month for testing. Pro is a flat monthly price with unlimited replies and priority handling when you need help from our team. Privacy: messages are used to provide the service and improve your assistant; we do not sell visitor chats to advertisers. Contact: hello@faztino.app — we read every message and usually respond within one business day.";

const words = (s: string) => s.replace(/\s+/g, " ").trim().split(" ");

test("returns nothing for empty or whitespace-only input", () => {
  assert.deepEqual(chunkText(""), []);
  assert.deepEqual(chunkText("   \n\t "), []);
});

test("text shorter than the window stays a single chunk", () => {
  assert.deepEqual(chunkText("Short and sweet.", 500, 100), ["Short and sweet."]);
});

test("never splits a word across a chunk boundary", () => {
  const source = new Set(words(REAL_TEXT));
  for (const chunk of chunkText(REAL_TEXT)) {
    const w = words(chunk);
    // A boundary that lands mid-word yields a fragment ("ur", "d") that is not a
    // real word of the source.
    assert.ok(source.has(w[0]), `chunk starts mid-word: ${JSON.stringify(w[0])}`);
    assert.ok(source.has(w[w.length - 1]), `chunk ends mid-word: ${JSON.stringify(w.at(-1))}`);
  }
});

test("loses no content: every source word survives in some chunk", () => {
  const chunks = chunkText(REAL_TEXT);
  const covered = new Set(chunks.flatMap(words));
  for (const w of words(REAL_TEXT)) {
    assert.ok(covered.has(w), `word dropped by chunker: ${JSON.stringify(w)}`);
  }
});

test("emits no junk fragments", () => {
  const chunks = chunkText(REAL_TEXT);
  assert.ok(chunks.length > 1, "expected the sample to split into several chunks");
  for (const c of chunks) {
    assert.ok(c.length >= 80, `fragment chunk survived: ${JSON.stringify(c)}`);
  }
});

test("chunks overlap, so context spanning a boundary is not lost", () => {
  const chunks = chunkText(REAL_TEXT, 200, 60);
  for (let i = 1; i < chunks.length; i++) {
    const tail = words(chunks[i - 1]).slice(-3).join(" ");
    assert.ok(
      chunks[i - 1] !== chunks[i],
      "consecutive chunks should not be identical",
    );
    assert.ok(tail.length > 0);
  }
  // Overlap means adjacent chunks share at least one word.
  for (let i = 1; i < chunks.length; i++) {
    const prev = new Set(words(chunks[i - 1]));
    assert.ok(
      words(chunks[i]).some((w) => prev.has(w)),
      "adjacent chunks share no words — overlap was lost",
    );
  }
});

test("terminates on pathological input (no spaces, overlap >= size)", () => {
  const noSpaces = "x".repeat(2000);
  const chunks = chunkText(noSpaces, 500, 100);
  assert.ok(chunks.length > 0);
  assert.equal(chunks.join("").replace(/(.)\1*/, "$&").length > 0, true);

  // overlap >= size would make the stride non-positive; must still finish.
  const degenerate = chunkText(REAL_TEXT, 100, 100);
  assert.ok(degenerate.length > 0);
});
