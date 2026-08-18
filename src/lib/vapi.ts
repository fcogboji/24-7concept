import { createHmac, timingSafeEqual } from "node:crypto";
import { getConfiguredAppOrigin } from "@/lib/app-origin";
import { getLogger } from "@/lib/logger";

const log = getLogger("vapi");

const VAPI_BASE = "https://api.vapi.ai";

export function isVapiConfigured(): boolean {
  return Boolean(process.env.VAPI_API_KEY?.trim());
}

function apiKey(): string {
  const key = process.env.VAPI_API_KEY?.trim();
  if (!key) throw new Error("VAPI_API_KEY is not configured");
  return key;
}

async function vapiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    ...(init?.headers as Record<string, string> | undefined),
  };
  let body = init?.body;
  if (init?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${VAPI_BASE}${path}`, {
    ...init,
    headers,
    body,
    signal: init?.signal ?? AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    log.error("vapi request failed", undefined, { path, status: res.status, text: text.slice(0, 400) });
    throw new Error(`Vapi ${init?.method ?? "GET"} ${path} failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type VapiToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
  async?: boolean;
  server?: { url: string; secret?: string };
};

export function phoneToolDefinitions(serverUrl: string, secret?: string): VapiToolDef[] {
  const server = { url: serverUrl, ...(secret ? { secret } : {}) };
  return [
    {
      type: "function",
      function: {
        name: "search_knowledge",
        description:
          "Search the business knowledge base for answers about services, prices, hours, location, and policies.",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "What the caller is asking about" },
          },
          required: ["query"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "capture_lead",
        description:
          "Save the caller's contact details so the business can follow up. Prefer collecting email when possible; phone alone is OK for phone calls.",
        parameters: {
          type: "object",
          properties: {
            email: { type: "string", description: "Caller email if they shared one" },
            name: { type: "string", description: "Caller name" },
            phone: { type: "string", description: "Caller phone (E.164 preferred)" },
            reason: { type: "string", description: "Short reason for follow-up" },
          },
          required: ["reason"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "list_services",
        description: "List bookable services/appointment types.",
        parameters: { type: "object", properties: {} },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "check_availability",
        description: "Check open appointment slots for a date (YYYY-MM-DD).",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string" },
            serviceId: { type: "string" },
          },
          required: ["date"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "create_appointment",
        description:
          "Book an appointment after confirming date, time, name, and email with the caller.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            startTime: { type: "string", description: "HH:mm in business timezone" },
            serviceId: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
          },
          required: ["date", "startTime", "name", "email"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "transfer_to_human",
        description: "Transfer the call to a human when the caller asks for a person or the issue is sensitive.",
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string" },
          },
          required: ["reason"],
        },
      },
      server,
    },
  ];
}

export function webhookServerUrl(): string {
  return `${getConfiguredAppOrigin()}/api/vapi/webhook`;
}

export type AssistantSyncInput = {
  botId: string;
  botName: string;
  businessInfo?: string | null;
  greeting?: string | null;
  voice?: string | null;
  bookingEnabled: boolean;
  forwardingNumber?: string | null;
  existingAssistantId?: string | null;
  knowledgePreview?: string;
};

export async function syncVapiAssistant(input: AssistantSyncInput): Promise<string> {
  const serverUrl = webhookServerUrl();
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim() || undefined;
  const voice = input.voice?.trim() || process.env.VAPI_DEFAULT_VOICE_ID?.trim() || "jennifer-playht";

  const firstMessage =
    input.greeting?.trim() ||
    `Hi, thanks for calling ${input.botName}. How can I help you today?`;

  const systemPrompt = [
    `You are the phone receptionist for ${input.botName}.`,
    "Speak naturally, briefly, and helpfully — like a real front-desk assistant (Intercom-style).",
    "Answer from the business knowledge via search_knowledge when unsure.",
    "Capture leads when the caller wants a callback or cannot book now.",
    input.bookingEnabled
      ? "Booking is enabled: use list_services, check_availability, then create_appointment after confirming details."
      : "Booking is not enabled; offer to capture a lead for a callback instead of inventing times.",
    input.forwardingNumber
      ? `You can transfer_to_human when they insist on a person. Forwarding number: ${input.forwardingNumber}.`
      : "There is no live transfer number; take a message via capture_lead instead.",
    input.businessInfo ? `Business notes:\n${input.businessInfo.slice(0, 4000)}` : "",
    input.knowledgePreview ? `Knowledge highlights:\n${input.knowledgePreview.slice(0, 3000)}` : "",
    "Never invent prices or availability. Use tools.",
    `Internal botId for routing: ${input.botId}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const payload = {
    name: `faztino-${input.botId.slice(0, 12)}`,
    firstMessage,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }],
      tools: phoneToolDefinitions(serverUrl, secret),
    },
    voice: {
      provider: "playht",
      voiceId: voice,
    },
    serverUrl,
    serverMessages: ["end-of-call-report", "status-update", "tool-calls"],
    metadata: { botId: input.botId },
  };

  if (input.existingAssistantId) {
    await vapiFetch(`/assistant/${input.existingAssistantId}`, {
      method: "PATCH",
      json: payload,
    });
    return input.existingAssistantId;
  }

  const created = await vapiFetch<{ id: string }>("/assistant", {
    method: "POST",
    json: payload,
  });
  return created.id;
}

export async function deleteVapiAssistant(assistantId: string): Promise<void> {
  try {
    await vapiFetch(`/assistant/${assistantId}`, { method: "DELETE" });
  } catch (e) {
    log.error("delete assistant failed", e, { assistantId });
  }
}

export type CreatePhoneNumberResult = {
  id: string;
  number: string;
};

/**
 * Buy/import a Twilio number via Vapi and attach it to an assistant.
 * Requires Twilio credentials in env and a Twilio account linked in Vapi.
 */
export async function createVapiPhoneNumber(opts: {
  assistantId: string;
  areaCode?: string;
}): Promise<CreatePhoneNumberResult> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required to assign a number");
  }

  const areaCode = opts.areaCode?.trim() || process.env.VAPI_PHONE_AREA_CODE?.trim() || "415";

  const created = await vapiFetch<{ id: string; number?: string; phoneNumber?: string }>("/phone-number", {
    method: "POST",
    json: {
      provider: "twilio",
      twilioAccountSid,
      twilioAuthToken,
      areaCode,
      assistantId: opts.assistantId,
      name: `faztino-${opts.assistantId.slice(0, 8)}`,
    },
  });

  const number = created.number || created.phoneNumber;
  if (!number) throw new Error("Vapi did not return a phone number");
  return { id: created.id, number };
}

export async function updateVapiPhoneAssistant(
  phoneNumberId: string,
  assistantId: string | null,
): Promise<void> {
  await vapiFetch(`/phone-number/${phoneNumberId}`, {
    method: "PATCH",
    json: { assistantId },
  });
}

export async function deleteVapiPhoneNumber(phoneNumberId: string): Promise<void> {
  try {
    await vapiFetch(`/phone-number/${phoneNumberId}`, { method: "DELETE" });
  } catch (e) {
    log.error("delete phone number failed", e, { phoneNumberId });
  }
}

/** Place an outbound call from the bot's Vapi/Twilio number to a visitor. */
export async function createOutboundCall(opts: {
  assistantId: string;
  phoneNumberId: string;
  customerNumber: string;
  botId: string;
}): Promise<{ id: string }> {
  const created = await vapiFetch<{ id: string }>("/call", {
    method: "POST",
    json: {
      assistantId: opts.assistantId,
      phoneNumberId: opts.phoneNumberId,
      customer: { number: opts.customerNumber },
      metadata: { botId: opts.botId, direction: "outbound" },
    },
  });
  if (!created?.id) throw new Error("Vapi did not return a call id");
  return created;
}

/** Hang up a live call (used when a workspace is over minutes or concurrency). */
export async function endVapiCall(callId: string): Promise<void> {
  try {
    await vapiFetch(`/call/${callId}/end`, { method: "POST" });
  } catch (e) {
    log.error("end call failed", e, { callId });
  }
}

/** Verify Vapi webhook HMAC when VAPI_WEBHOOK_SECRET is set. */
export function verifyVapiSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Dev convenience: allow unsigned when secret unset (log once via warn path).
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/i, "").trim();
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(provided, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
