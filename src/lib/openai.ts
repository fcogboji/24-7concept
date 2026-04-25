import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!client) {
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

/**
 * Model used for the customer-facing chat. Default is gpt-4o-mini for cost;
 * set CHAT_MODEL=gpt-4o (or any supported chat model) for higher quality.
 */
export function getChatModel(): string {
  return process.env.CHAT_MODEL?.trim() || "gpt-4o-mini";
}

/** Cheaper model for tool routing (function picking) inside the booking loop. */
export function getRoutingModel(): string {
  return process.env.CHAT_ROUTING_MODEL?.trim() || "gpt-4o-mini";
}
